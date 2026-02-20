import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  ArrowLeft, TrendingUp, TrendingDown, Brain, AlertTriangle,
  Plus, Bell, Loader2, BarChart3, Calendar, Home
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ComposedChart, Line
} from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const StockAnalysis = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [stockData, setStockData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predictionLoading, setPredictionLoading] = useState(true);
  const [period, setPeriod] = useState('1y');
  const [addToPortfolio, setAddToPortfolio] = useState({ quantity: '', buy_price: '' });
  const [alertForm, setAlertForm] = useState({ alert_type: 'price_above', threshold: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchStockData(); fetchPredictions(); fetchPortfolio(); }, [symbol, period]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/stocks/${symbol}?period=${period}`);
      setStockData(response.data);
    } catch (error) { console.error('Failed to fetch stock data:', error); }
    finally { setLoading(false); }
  };

  const fetchPredictions = async () => {
    try {
      setPredictionLoading(true);
      const response = await axios.get(`${API_URL}/api/stocks/${symbol}/predictions`);
      setPredictions(response.data);
    } catch (error) { console.error('Failed to fetch predictions:', error); }
    finally { setPredictionLoading(false); }
  };

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/portfolio`);
      const item = response.data.items.find(i => i.symbol.toUpperCase() === symbol.toUpperCase());
      setPortfolio(item);
    } catch (error) { console.error('Failed to fetch portfolio:', error); }
  };

  const handleAddToPortfolio = async () => {
    try {
      await axios.post(`${API_URL}/api/portfolio/add`, {
        symbol, quantity: parseFloat(addToPortfolio.quantity),
        buy_price: parseFloat(addToPortfolio.buy_price || stockData?.current_price),
        buy_date: new Date().toISOString().split('T')[0]
      });
      setDialogOpen(false); setAddToPortfolio({ quantity: '', buy_price: '' });
      fetchPortfolio();
      alert('Added to portfolio successfully!');
    } catch (error) { alert('Failed to add to portfolio'); }
  };

  const handleCreateAlert = async () => {
    try {
      await axios.post(`${API_URL}/api/alerts`, {
        symbol, alert_type: alertForm.alert_type,
        threshold: parseFloat(alertForm.threshold), email_enabled: true
      });
      setAlertDialogOpen(false); setAlertForm({ alert_type: 'price_above', threshold: '' });
      alert('Alert created successfully!');
    } catch (error) { alert('Failed to create alert'); }
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><Loader2 className="w-8 h-8 text-cyan animate-spin" /></div>;
  if (!stockData) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><p className="text-slate-400">Stock not found</p></div>;

  const riskRadarData = stockData.risk ? [
    { subject: 'Volatility', A: stockData.risk.volatility, fullMark: 100 },
    { subject: 'Sharpe', A: Math.abs(stockData.risk.sharpe_ratio) * 20, fullMark: 100 },
    { subject: 'Drawdown', A: Math.abs(stockData.risk.max_drawdown), fullMark: 100 },
    { subject: 'Risk Score', A: stockData.risk.risk_score * 10, fullMark: 100 },
  ] : [];

  const timeframes = ['3d', '7d', '15d', '30d'];
  const currentPrediction = predictions?.predictions?.[selectedTimeframe];
  const predictionChartData = timeframes.map(tf => {
    const pred = predictions?.predictions?.[tf];
    return { timeframe: tf.toUpperCase(), change: pred?.change_percent || 0, confidence: pred?.confidence || 0 };
  });

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Sidebar */}
      {/* Desktop Sidebar */}
      <div className="sidebar hidden md:flex fixed left-0 top-0 h-screen w-16 flex-col items-center py-6 z-50">
        <button onClick={() => navigate('/dashboard')} className="w-10 h-10 bg-cyan rounded-xl flex items-center justify-center mb-8 shadow-cyan" data-testid="back-btn">
          <Home className="w-5 h-5 text-[#0f172a]" />
        </button>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50">
        <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center justify-center w-12 h-12 text-muted-foreground">
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </button>
      </div>

      <div className="ml-0 md:ml-16 pb-20 md:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-40 glass-header">
          <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl md:text-2xl font-bold text-white">{symbol}</h1>
                    <Badge className="bg-cyan/20 text-cyan border-cyan/30 text-[10px] md:text-sm">NSE/BSE</Badge>
                  </div>
                  <p className="text-xs md:text-sm text-slate-400">Stock analysis</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 bg-cyan hover:bg-cyan-light text-[#0f172a] font-semibold text-xs md:text-sm px-3 md:px-4" data-testid="add-portfolio-btn">
                      <Plus className="w-4 h-4 mr-1 md:mr-2" />Add Portfolio
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1e293b] border-[#334155] w-[95vw] max-w-md">
                    <DialogHeader><DialogTitle className="text-xl font-bold text-white">Add {symbol} to Portfolio</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Quantity</Label>
                        <Input type="number" placeholder="Number of shares" value={addToPortfolio.quantity} onChange={(e) => setAddToPortfolio({ ...addToPortfolio, quantity: e.target.value })} className="h-11 bg-[#334155] border-[#475569] text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Buy Price (₹)</Label>
                        <Input type="number" placeholder={`Current: ₹${stockData.current_price}`} value={addToPortfolio.buy_price} onChange={(e) => setAddToPortfolio({ ...addToPortfolio, buy_price: e.target.value })} className="h-11 bg-[#334155] border-[#475569] text-white" />
                      </div>
                      <Button className="w-full bg-cyan hover:bg-cyan-light text-[#0f172a] font-semibold" onClick={handleAddToPortfolio}>Add to Portfolio</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 border-amber-500/50 text-amber-400 hover:bg-amber-500/10 text-xs md:text-sm px-3 md:px-4" data-testid="create-alert-btn">
                      <Bell className="w-4 h-4 mr-1 md:mr-2" />Set Alert
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1e293b] border-[#334155] w-[95vw] max-w-md">
                    <DialogHeader><DialogTitle className="text-xl font-bold text-white">Create Alert for {symbol}</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Alert Type</Label>
                        <Select value={alertForm.alert_type} onValueChange={(v) => setAlertForm({ ...alertForm, alert_type: v })}>
                          <SelectTrigger className="h-11 bg-[#334155] border-[#475569] text-white"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#1e293b] border-[#334155]">
                            <SelectItem value="price_above">Price Above</SelectItem>
                            <SelectItem value="price_below">Price Below</SelectItem>
                            <SelectItem value="pnl_above">P&L Above %</SelectItem>
                            <SelectItem value="pnl_below">P&L Below %</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Threshold</Label>
                        <Input type="number" placeholder={alertForm.alert_type.includes('price') ? 'Price in ₹' : 'Percentage'} value={alertForm.threshold} onChange={(e) => setAlertForm({ ...alertForm, threshold: e.target.value })} className="h-11 bg-[#334155] border-[#475569] text-white" />
                      </div>
                      <Button className="w-full bg-cyan hover:bg-cyan-light text-[#0f172a] font-semibold" onClick={handleCreateAlert}>Create Alert</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1800px] mx-auto px-4 md:px-6 py-4 md:py-6">
          {/* Price Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dashboard-card p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="w-full md:w-auto text-center md:text-left">
                <p className="text-slate-400 text-xs md:text-sm mb-1">Current Price</p>
                <p className="text-3xl md:text-5xl font-bold text-white">₹<span className="font-mono">{stockData.current_price?.toLocaleString()}</span></p>
                <div className={`flex items-center justify-center md:justify-start gap-2 mt-2 ${stockData.change_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stockData.change_percent >= 0 ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> : <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />}
                  <span className="font-mono font-bold text-sm md:text-base">{stockData.change_percent >= 0 ? '+' : ''}₹{stockData.change?.toFixed(2)} ({stockData.change_percent?.toFixed(2)}%)</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-4 text-xs">
                <div className="p-2 md:p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl min-w-[100px] text-center">
                  <span className="text-slate-400">52W High</span>
                  <p className="font-mono font-bold text-emerald-400">₹{stockData.high_52w?.toLocaleString()}</p>
                </div>
                <div className="p-2 md:p-3 bg-red-500/10 border border-red-500/30 rounded-xl min-w-[100px] text-center">
                  <span className="text-slate-400">52W Low</span>
                  <p className="font-mono font-bold text-red-400">₹{stockData.low_52w?.toLocaleString()}</p>
                </div>
                <div className="p-2 md:p-3 bg-cyan/10 border border-cyan/30 rounded-xl min-w-[100px] text-center">
                  <span className="text-slate-400">Volume</span>
                  <p className="font-mono font-bold text-cyan">{stockData.volume?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {portfolio && (
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-[#334155] flex flex-wrap items-center gap-4 md:gap-6">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Your Holdings</p>
                  <p className="text-lg md:text-2xl font-bold text-white"><span className="font-mono">{portfolio.quantity}</span> Shares</p>
                </div>
                <div className="hidden sm:block h-10 w-px bg-[#334155]" />
                <div>
                  <p className="text-slate-400 text-xs mb-1">Avg. Buy Price</p>
                  <p className="text-lg md:text-2xl font-bold text-white">₹<span className="font-mono">{portfolio.buy_price?.toLocaleString()}</span></p>
                </div>
                <div className="hidden sm:block h-10 w-px bg-[#334155]" />
                <div>
                  <p className="text-slate-400 text-xs mb-1">Current P&L</p>
                  <div className={`flex items-center gap-2 ${portfolio.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span className="text-lg md:text-2xl font-bold font-mono">{portfolio.pnl >= 0 ? '+' : ''}₹{portfolio.pnl?.toLocaleString()} ({portfolio.pnl_percent?.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="prediction" className="space-y-6">
            <TabsList className="w-full md:w-auto bg-[#1e293b] p-1 rounded-xl border border-[#334155] flex overflow-x-auto no-scrollbar">
              <TabsTrigger value="prediction" className="flex-1 md:flex-none rounded-lg text-slate-400 data-[state=active]:bg-purple-500 data-[state=active]:text-white whitespace-nowrap"><Brain className="w-4 h-4 mr-2" />AI Predictions</TabsTrigger>
              <TabsTrigger value="chart" className="flex-1 md:flex-none rounded-lg text-slate-400 data-[state=active]:bg-cyan data-[state=active]:text-[#0f172a] whitespace-nowrap"><BarChart3 className="w-4 h-4 mr-2" />Chart</TabsTrigger>
              <TabsTrigger value="risk" className="flex-1 md:flex-none rounded-lg text-slate-400 data-[state=active]:bg-amber-500 data-[state=active]:text-[#0f172a] whitespace-nowrap"><AlertTriangle className="w-4 h-4 mr-2" />Risk</TabsTrigger>
            </TabsList>

            {/* Prediction Tab */}
            <TabsContent value="prediction">
              <div className="space-y-6">
                <div className="dashboard-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center"><Calendar className="w-5 h-5 text-purple-400" /></div>
                    <div><h3 className="text-lg font-bold text-white">Select Prediction Timeframe</h3><p className="text-sm text-slate-400">Compare AI predictions across timeframes</p></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {timeframes.map((tf) => {
                      const pred = predictions?.predictions?.[tf];
                      const isSelected = selectedTimeframe === tf;
                      const isPositive = pred?.change_percent >= 0;
                      return (
                        <button key={tf} onClick={() => setSelectedTimeframe(tf)} className={`p-3 md:p-5 rounded-xl border-2 transition-all ${isSelected ? 'border-purple-500 bg-purple-500/10' : 'border-[#334155] bg-[#334155]/50 hover:border-[#475569]'}`}>
                          <p className={`text-sm md:text-lg font-bold ${isSelected ? 'text-purple-400' : 'text-white'}`}>{tf.toUpperCase()}</p>
                          {pred ? (<><p className={`text-xl md:text-3xl font-bold mt-1 md:mt-2 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>{isPositive ? '+' : ''}{pred.change_percent?.toFixed(2)}%</p><p className="text-[10px] md:text-sm text-slate-400 mt-1">₹{pred.predicted_price?.toLocaleString()}</p><Badge className={`mt-2 text-[10px] md:text-sm ${pred.trend === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' : pred.trend === 'bearish' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'} border-0`}>{pred.trend}</Badge></>) : (<p className="text-slate-500 mt-2">...</p>)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="dashboard-card p-6">
                    <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center"><Brain className="w-5 h-5 text-purple-400" /></div><h3 className="text-lg font-bold text-white">{selectedTimeframe.toUpperCase()} Prediction Details</h3></div>
                    {predictionLoading ? (<div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-purple-400 animate-spin" /></div>) : currentPrediction ? (
                      <div className="space-y-4">
                        <div className="p-5 bg-[#334155]/50 rounded-xl">
                          <p className="text-sm text-slate-400 mb-1">Price Target</p>
                          <p className="text-4xl font-bold text-white">₹{currentPrediction.predicted_price?.toLocaleString()}</p>
                          <div className={`flex items-center gap-2 mt-2 ${currentPrediction.change_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {currentPrediction.change_percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span className="font-bold">{currentPrediction.change_percent >= 0 ? '+' : ''}{currentPrediction.change_percent?.toFixed(2)}%</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-[#334155]/50 rounded-xl"><p className="text-sm text-slate-400">Trend</p><Badge className={`mt-1 text-base ${currentPrediction.trend === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' : currentPrediction.trend === 'bearish' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'} border-0`}>{currentPrediction.trend}</Badge></div>
                          <div className="p-4 bg-[#334155]/50 rounded-xl"><p className="text-sm text-slate-400">Model Accuracy</p><p className="text-2xl font-bold text-cyan">{currentPrediction.confidence?.toFixed(1)}%</p></div>
                        </div>
                        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl"><p className="text-sm text-purple-300"><strong>Model:</strong> Random Forest with technical indicators (MA, RSI, Volatility, Momentum)</p></div>
                      </div>
                    ) : (<p className="text-slate-400">Unable to generate prediction</p>)}
                  </div>

                  <div className="dashboard-card p-6">
                    <h3 className="text-lg font-bold text-white mb-6">All Timeframe Comparison</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={predictionChartData}>
                          <XAxis dataKey="timeframe" tick={{ fill: '#64748b', fontSize: 12 }} />
                          <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }} />
                          <Bar yAxisId="left" dataKey="change" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Change %" />
                          <Line yAxisId="right" type="monotone" dataKey="confidence" stroke="#00d4ff" strokeWidth={3} dot={{ fill: '#00d4ff', r: 5 }} name="Confidence %" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Chart Tab */}
            <TabsContent value="chart">
              <div className="dashboard-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Price Chart</h3>
                  <div className="flex gap-2">
                    {['5d', '1mo', '3mo', '6mo', '1y', '2y'].map((p) => (
                      <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p)} className={period === p ? 'bg-cyan text-[#0f172a]' : 'border-[#334155] text-slate-400 hover:text-white'} data-testid={`period-${p}-btn`}>{p.toUpperCase()}</Button>
                    ))}
                  </div>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stockData.chart_data}>
                      <defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4} /><stop offset="95%" stopColor="#00d4ff" stopOpacity={0} /></linearGradient></defs>
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={['auto', 'auto']} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }} formatter={(v) => [`₹${v.toLocaleString()}`, 'Price']} />
                      <Area type="monotone" dataKey="close" stroke="#00d4ff" strokeWidth={2} fill="url(#colorPrice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            {/* Risk Tab */}
            <TabsContent value="risk">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="dashboard-card p-6">
                  <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-400" /></div><h3 className="text-lg font-bold text-white">Risk Analysis</h3></div>
                  <div className="space-y-4">
                    <div className="p-5 bg-[#334155]/50 rounded-xl">
                      <div className="flex items-center justify-between mb-3"><span className="text-slate-300">Risk Level</span><Badge className={`text-base px-4 py-1 ${stockData.risk?.risk_level === 'Low' ? 'bg-emerald-500/20 text-emerald-400' : stockData.risk?.risk_level === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'} border-0`}>{stockData.risk?.risk_level}</Badge></div>
                      <div className="h-3 bg-[#475569] rounded-full overflow-hidden"><div className={`h-full rounded-full ${stockData.risk?.risk_level === 'Low' ? 'bg-emerald-500 w-1/3' : stockData.risk?.risk_level === 'Medium' ? 'bg-amber-500 w-2/3' : 'bg-red-500 w-full'}`} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-[#334155]/50 rounded-xl"><p className="text-sm text-slate-400">Volatility</p><p className="text-2xl font-bold text-white">{stockData.risk?.volatility?.toFixed(1)}%</p></div>
                      <div className="p-4 bg-[#334155]/50 rounded-xl"><p className="text-sm text-slate-400">Sharpe Ratio</p><p className="text-2xl font-bold text-white">{stockData.risk?.sharpe_ratio?.toFixed(2)}</p></div>
                      <div className="p-4 bg-[#334155]/50 rounded-xl"><p className="text-sm text-slate-400">Max Drawdown</p><p className="text-2xl font-bold text-red-400">{stockData.risk?.max_drawdown?.toFixed(1)}%</p></div>
                      <div className="p-4 bg-[#334155]/50 rounded-xl"><p className="text-sm text-slate-400">Risk Score</p><p className="text-2xl font-bold text-white">{stockData.risk?.risk_score}/10</p></div>
                    </div>
                  </div>
                </div>
                <div className="dashboard-card p-6">
                  <h3 className="text-lg font-bold text-white mb-6">Risk Radar</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={riskRadarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Radar name="Risk" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default StockAnalysis;
