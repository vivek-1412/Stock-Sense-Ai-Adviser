from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import json
import pandas as pd
from contextlib import asynccontextmanager
import asyncio
import numpy as np
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB Connection
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority")
client = AsyncIOMotorClient(MONGO_URI)
db = client.stocksense

# Collection names
USERS_COL = "users"
PORTFOLIO_COL = "portfolio"
ALERTS_COL = "alerts"

# Global caches for speed
PREDICTION_CACHE = {}
MARKET_DATA_CACHE = {}
CACHE_EXPIRY = 3600  # 1 hour
MARKET_CACHE_EXPIRY = 900 # 15 minutes for trending data

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'stockmarket-secret-key-2024-secure-32-byte-key-minimum')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Load Stock database from CSV
STOCKS_DB = []
def load_stock_database():
    global STOCKS_DB
    csv_path = ROOT_DIR / 'stock database.csv'
    if csv_path.exists():
        try:
            df = pd.read_csv(csv_path)
            df.columns = [c.strip() for c in df.columns]
            raw_stocks = df[['SYMBOL', 'NAME OF COMPANY']].rename(columns={
                'SYMBOL': 'symbol',
                'NAME OF COMPANY': 'name'
            }).to_dict('records')
            
            STOCKS_DB = []
            for s in raw_stocks:
                STOCKS_DB.append({
                    **s,
                    "_search_str": f"{str(s['symbol']).lower()} {str(s['name']).lower()}"
                })
            print(f"Loaded and optimized {len(STOCKS_DB)} stocks from CSV")
        except Exception as e:
            print(f"Error loading stock database: {e}")
            STOCKS_DB = []
    else:
        print(f"Stock database not found at {csv_path}")

@asynccontextmanager
async def lifespan(app):
    print("Server starting - Connecting to MongoDB")
    load_stock_database()
    yield
    print("Server shutting down - Closing MongoDB connection")
    client.close()

# Create the main app
app = FastAPI(
    title="AI Stock Market Prediction API",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", include_in_schema=False)
async def root_redirect():
    from starlette.responses import RedirectResponse
    return RedirectResponse(url="/docs")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ================= MODELS =================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class StockQuery(BaseModel):
    symbol: str
    period: str = "1y"

class PortfolioItem(BaseModel):
    symbol: str
    quantity: float
    buy_price: float
    buy_date: str

class PortfolioItemResponse(BaseModel):
    id: str
    symbol: str
    quantity: float
    buy_price: float
    buy_date: str
    current_price: float
    pnl: float
    pnl_percent: float

class AlertCreate(BaseModel):
    symbol: str
    alert_type: str
    threshold: float
    email_enabled: bool = True

class AlertResponse(BaseModel):
    id: str
    user_id: str
    symbol: str
    alert_type: str
    threshold: float
    email_enabled: bool
    is_active: bool
    created_at: str

class PredictionResponse(BaseModel):
    symbol: str
    current_price: float
    predicted_price: float
    predicted_change_percent: float
    trend: str
    confidence: float
    prediction_date: str

# ================= AUTH HELPERS =================

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"verify_exp": True}
        )
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id, "email": payload.get("email")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ================= STOCK DATA HELPERS =================

def get_stock_data(symbol: str, period: str = "2y") -> Any:
    import yfinance as yf
    cache_key = f"hist_{symbol}_{period}"
    if cache_key in MARKET_DATA_CACHE:
        entry = MARKET_DATA_CACHE[cache_key]
        if time.time() - entry["timestamp"] < 1800:
            return entry["data"]

    nse_symbol = f"{symbol}.NS" if not (symbol.endswith('.NS') or symbol.endswith('.BO')) else symbol
    try:
        ticker = yf.Ticker(nse_symbol)
        df = ticker.history(period=period)
        if df.empty:
            bse_symbol = f"{symbol}.BO"
            ticker = yf.Ticker(bse_symbol)
            df = ticker.history(period=period)
        
        if not df.empty:
            MARKET_DATA_CACHE[cache_key] = {"timestamp": time.time(), "data": df}
        return df
    except Exception as e:
        logging.error(f"Error fetching stock data: {e}")
        return pd.DataFrame()

def calculate_rsi(series: Any, period: int = 14) -> Any:
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def calculate_features(df: Any) -> Any:
    df = df.copy()
    df['MA5'] = df['Close'].rolling(window=5).mean()
    df['MA20'] = df['Close'].rolling(window=20).mean()
    df['MA50'] = df['Close'].rolling(window=50).mean()
    df['EMA12'] = df['Close'].ewm(span=12, adjust=False).mean()
    df['EMA26'] = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = df['EMA12'] - df['EMA26']
    df['Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
    df['RSI'] = calculate_rsi(df['Close'])
    window = 20
    df['BB_Mid'] = df['Close'].rolling(window=window).mean()
    df['BB_Std'] = df['Close'].rolling(window=window).std()
    df['BB_Upper'] = df['BB_Mid'] + (df['BB_Std'] * 2)
    df['BB_Lower'] = df['BB_Mid'] - (df['BB_Std'] * 2)
    df['BB_Width'] = (df['BB_Upper'] - df['BB_Lower']) / df['BB_Mid']
    df['Volatility'] = df['Close'].rolling(window=20).std()
    df['Returns'] = df['Close'].pct_change()
    df['Momentum'] = df['Close'] - df['Close'].shift(10)
    return df.dropna()

def train_base_model(df: Any):
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import MinMaxScaler
    features = ['MA5', 'MA20', 'MA50', 'EMA12', 'EMA26', 'MACD', 'Signal', 'RSI', 'BB_Width', 'Volatility', 'Volume', 'Returns', 'Momentum']
    X = df[features].values
    y = df['Close'].values
    scaler_X = MinMaxScaler()
    scaler_y = MinMaxScaler()
    X_scaled = scaler_X.fit_transform(X)
    y_scaled = scaler_y.fit_transform(y.reshape(-1, 1))
    model = RandomForestRegressor(n_estimators=50, random_state=42, max_depth=12, n_jobs=-1)
    train_size = min(len(X_scaled), 400)
    model.fit(X_scaled[-train_size:], y_scaled[-train_size:].ravel())
    last_features = X_scaled[-1].reshape(1, -1)
    pred_scaled = model.predict(last_features)
    base_pred = scaler_y.inverse_transform(pred_scaled.reshape(-1, 1))[0][0]
    return base_pred, df['Close'].iloc[-1], df['Volatility'].iloc[-1]

def predict_stock_price(df: Any, days: int = 30) -> dict:
    df = calculate_features(df)
    if len(df) < 50: return None
    base_pred, current_price, vol_val = train_base_model(df)
    recent_trend = (df['Close'].iloc[-1] - df['Close'].iloc[-5]) / df['Close'].iloc[-5]
    day_factor = days / 30.0
    predicted_price = base_pred * (1 + (recent_trend * day_factor * 0.4))
    change_percent = ((predicted_price - current_price) / current_price) * 100
    confidence = min(max(92.0 - (days/2.0) - (vol_val/current_price * 100), 65), 98)
    return {
        "current_price": round(current_price, 2),
        "predicted_price": round(predicted_price, 2),
        "change_percent": round(change_percent, 2),
        "trend": "bullish" if change_percent > 1.5 else "bearish" if change_percent < -1.5 else "neutral",
        "confidence": round(confidence, 1),
        "days": days
    }

async def get_multi_timeframe_predictions(symbol: str) -> dict:
    now = time.time()
    if symbol in PREDICTION_CACHE:
        entry = PREDICTION_CACHE[symbol]
        if now - entry["timestamp"] < CACHE_EXPIRY: return entry["data"]
    df = await asyncio.to_thread(get_stock_data, symbol, "2y")
    if df.empty: return None
    df_ready = await asyncio.to_thread(calculate_features, df)
    if len(df_ready) < 50: return None
    base_pred, current_price, vol_val = await asyncio.to_thread(train_base_model, df_ready)
    timeframes = [3, 7, 15, 30]
    predictions = {}
    recent_trend = (df_ready['Close'].iloc[-1] - df_ready['Close'].iloc[-5]) / df_ready['Close'].iloc[-5]
    for days in timeframes:
        day_factor = days / 30.0
        predicted_price = base_pred * (1 + (recent_trend * day_factor * 0.4))
        change_percent = ((predicted_price - current_price) / current_price) * 100
        confidence = min(max(92.0 - (days/2.0) - (vol_val/current_price * 100), 65), 98)
        predictions[f"{days}d"] = {
            "current_price": round(current_price, 2),
            "predicted_price": round(predicted_price, 2),
            "change_percent": round(change_percent, 2),
            "trend": "bullish" if change_percent > 1.5 else "bearish" if change_percent < -1.5 else "neutral",
            "confidence": round(confidence, 1),
            "days": days
        }
    if predictions:
        PREDICTION_CACHE[symbol] = {"timestamp": now, "data": predictions}
        return predictions
    return None

def calculate_risk_score(returns: Any) -> dict:
    volatility = returns.std() * np.sqrt(252)
    sharpe_ratio = (returns.mean() * 252) / (volatility + 0.0001)
    max_drawdown = (returns.cumsum() - returns.cumsum().cummax()).min()
    if volatility < 0.2:
        risk_level, risk_score = "Low", 3
    elif volatility < 0.4:
        risk_level, risk_score = "Medium", 6
    else:
        risk_level, risk_score = "High", 9
    return {
        "volatility": round(volatility * 100, 2),
        "sharpe_ratio": round(sharpe_ratio, 2),
        "max_drawdown": round(max_drawdown * 100, 2),
        "risk_level": risk_level,
        "risk_score": risk_score
    }

# ================= AUTH ROUTES =================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await db[USERS_COL].find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(user.password)
    created_at = datetime.now(timezone.utc).isoformat()
    
    new_user = {
        "id": user_id,
        "email": user.email,
        "password": hashed_pw,
        "name": user.name,
        "created_at": created_at
    }
    await db[USERS_COL].insert_one(new_user)
    
    token = create_token(user_id, user.email)
    return TokenResponse(
        token=token,
        user=UserResponse(id=user_id, email=user.email, name=user.name, created_at=created_at)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db[USERS_COL].find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"])
    return TokenResponse(
        token=token,
        user=UserResponse(id=user["id"], email=user["email"], name=user["name"], created_at=user["created_at"])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db[USERS_COL].find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(id=user["id"], email=user["email"], name=user["name"], created_at=user["created_at"])

# ================= STOCK ROUTES =================

@api_router.get("/stocks/search")
async def search_stocks(q: str):
    indian_stocks = STOCKS_DB if STOCKS_DB else []
    q_lower = q.lower()
    results = [s for s in indian_stocks if q_lower in s["_search_str"]]
    return [{"symbol": s["symbol"], "name": s["name"]} for s in results[:10]]

@api_router.get("/stocks/{symbol}")
async def get_stock_details(symbol: str, period: str = "1y"):
    df = await asyncio.to_thread(get_stock_data, symbol, period)
    if df.empty:
        raise HTTPException(status_code=404, detail="Stock not found or no data available")
    
    chart_data = []
    for idx, row in df.iterrows():
        chart_data.append({
            "date": idx.strftime("%Y-%m-%d"),
            "open": round(row["Open"], 2), "high": round(row["High"], 2),
            "low": round(row["Low"], 2), "close": round(row["Close"], 2),
            "volume": int(row["Volume"])
        })
    
    current_price = df["Close"].iloc[-1]
    prev_close = df["Close"].iloc[-2] if len(df) > 1 else current_price
    change = current_price - prev_close
    change_percent = (change / prev_close) * 100
    risk = calculate_risk_score(df["Close"].pct_change().dropna())
    
    return {
        "symbol": symbol, "current_price": round(current_price, 2),
        "change": round(change, 2), "change_percent": round(change_percent, 2),
        "high_52w": round(df["High"].max(), 2), "low_52w": round(df["Low"].min(), 2),
        "volume": int(df["Volume"].iloc[-1]), "avg_volume": int(df["Volume"].mean()),
        "risk": risk, "chart_data": chart_data[-250:]
    }

@api_router.get("/stocks/{symbol}/predictions")
async def get_all_predictions(symbol: str):
    predictions = await get_multi_timeframe_predictions(symbol)
    if not predictions:
        raise HTTPException(status_code=404, detail="Stock not found or insufficient data")
    return {"symbol": symbol, "predictions": predictions, "generated_at": datetime.now(timezone.utc).isoformat()}

@api_router.get("/dashboard/predictions")
async def get_dashboard_predictions(current_user: dict = Depends(get_current_user)):
    top_stocks = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "LT"]
    async def process_symbol(symbol):
        try:
            preds = await get_multi_timeframe_predictions(symbol)
            if preds: return {"symbol": symbol, "predictions": preds}
        except Exception: pass
        return None
    tasks = [process_symbol(s) for s in top_stocks]
    results = await asyncio.gather(*tasks)
    return [r for r in results if r]

@api_router.get("/market/trending")
async def get_trending_stocks():
    now = time.time()
    trending_symbols = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "ITC", "BHARTIARTL"]
    async def fetch_trending(symbol):
        if symbol in MARKET_DATA_CACHE:
            entry = MARKET_DATA_CACHE[symbol]
            if now - entry["timestamp"] < MARKET_CACHE_EXPIRY: return entry["data"]
        try:
            df = await asyncio.to_thread(get_stock_data, symbol, "5d")
            if not df.empty:
                current, prev = df["Close"].iloc[-1], df["Close"].iloc[0]
                data = {"symbol": symbol, "price": round(current, 2), "change_percent": round(((current - prev) / prev) * 100, 2)}
                MARKET_DATA_CACHE[symbol] = {"timestamp": now, "data": data}
                return data
        except Exception: pass
        return None
    tasks = [fetch_trending(s) for s in trending_symbols]
    results = await asyncio.gather(*tasks)
    return [r for r in results if r]

# ================= PORTFOLIO ROUTES =================

@api_router.post("/portfolio/add")
async def add_to_portfolio(item: PortfolioItem, current_user: dict = Depends(get_current_user)):
    item_id = str(uuid.uuid4())
    new_item = {
        "id": item_id,
        "user_id": current_user["user_id"],
        "symbol": item.symbol.upper(),
        "quantity": item.quantity,
        "buy_price": item.buy_price,
        "buy_date": item.buy_date,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db[PORTFOLIO_COL].insert_one(new_item)
    return {"id": item_id, "message": "Added to portfolio"}

@api_router.get("/portfolio")
async def get_portfolio(current_user: dict = Depends(get_current_user)):
    cursor = db[PORTFOLIO_COL].find({"user_id": current_user["user_id"]})
    items = await cursor.to_list(length=100)
    
    async def process_item(item):
        try:
            df = await asyncio.to_thread(get_stock_data, item["symbol"], "5d")
            current_price = df["Close"].iloc[-1] if not df.empty else item["buy_price"]
        except Exception: current_price = item["buy_price"]
        
        invested = item["quantity"] * item["buy_price"]
        current_value = item["quantity"] * current_price
        pnl = current_value - invested
        return {
            "id": item["id"], "symbol": item["symbol"], "quantity": item["quantity"],
            "buy_price": item["buy_price"], "buy_date": item["buy_date"],
            "current_price": round(current_price, 2), "invested": round(invested, 2),
            "current_value": round(current_value, 2), "pnl": round(pnl, 2),
            "pnl_percent": round((pnl / invested) * 100 if invested > 0 else 0, 2)
        }
    
    portfolio_items = await asyncio.gather(*[process_item(i) for i in items])
    total_invested = sum(i["invested"] for i in portfolio_items)
    total_current = sum(i["current_value"] for i in portfolio_items)
    total_pnl = total_current - total_invested
    
    return {
        "items": portfolio_items,
        "summary": {
            "total_invested": round(total_invested, 2), "total_current": round(total_current, 2),
            "total_pnl": round(total_pnl, 2), "total_pnl_percent": round((total_pnl / total_invested) * 100 if total_invested > 0 else 0, 2)
        },
        "allocation": [{"symbol": i["symbol"], "value": i["current_value"], "percentage": round((i["current_value"] / total_current) * 100, 1) if total_current > 0 else 0} for i in portfolio_items]
    }

@api_router.delete("/portfolio/{item_id}")
async def remove_from_portfolio(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db[PORTFOLIO_COL].delete_one({"id": item_id, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Removed from portfolio"}

# ================= ALERTS ROUTES =================

@api_router.post("/alerts", response_model=AlertResponse)
async def create_alert(alert: AlertCreate, current_user: dict = Depends(get_current_user)):
    alert_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    new_alert = {
        "id": alert_id, "user_id": current_user["user_id"], "symbol": alert.symbol.upper(),
        "alert_type": alert.alert_type, "threshold": alert.threshold,
        "email_enabled": alert.email_enabled, "is_active": True, "created_at": created_at
    }
    await db[ALERTS_COL].insert_one(new_alert)
    return new_alert

@api_router.get("/alerts")
async def get_alerts(current_user: dict = Depends(get_current_user)):
    cursor = db[ALERTS_COL].find({"user_id": current_user["user_id"]})
    return await cursor.to_list(length=100)

@api_router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    result = await db[ALERTS_COL].delete_one({"id": alert_id, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert deleted"}

@api_router.patch("/alerts/{alert_id}/toggle")
async def toggle_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    alert = await db[ALERTS_COL].find_one({"id": alert_id, "user_id": current_user["user_id"]})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    new_status = not alert["is_active"]
    await db[ALERTS_COL].update_one({"id": alert_id}, {"$set": {"is_active": new_status}})
    return {"is_active": new_status}

# ================= DASHBOARD ROUTES =================

@api_router.get("/dashboard/summary")
async def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    cursor = db[PORTFOLIO_COL].find({"user_id": current_user["user_id"]})
    portfolio = await cursor.to_list(length=200)
    
    async def fetch_item_value(item):
        try:
            df = await asyncio.to_thread(get_stock_data, item["symbol"], "5d")
            current_price = df["Close"].iloc[-1] if not df.empty else item["buy_price"]
        except Exception: current_price = item["buy_price"]
        return item["quantity"] * item["buy_price"], item["quantity"] * current_price

    results = await asyncio.gather(*[fetch_item_value(i) for i in portfolio])
    total_invested = sum(r[0] for r in results)
    total_current = sum(r[1] for r in results)
    alerts_count = await db[ALERTS_COL].count_documents({"user_id": current_user["user_id"], "is_active": True})
    
    return {
        "portfolio": {
            "total_invested": round(total_invested, 2), "total_current": round(total_current, 2),
            "total_pnl": round(total_current - total_invested, 2),
            "pnl_percent": round(((total_current - total_invested) / total_invested) * 100 if total_invested > 0 else 0, 2),
            "holdings_count": len(portfolio)
        },
        "alerts_active": alerts_count
    }

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
