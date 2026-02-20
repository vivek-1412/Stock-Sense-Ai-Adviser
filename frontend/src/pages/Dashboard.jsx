import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  TrendingUp, TrendingDown, Search, Bell, Wallet,
  BarChart3, LogOut, Plus, Brain, AlertTriangle, ChevronRight,
  Loader2, Home, PieChart, Settings, Activity, Target,
  User, Ghost, Dog, Cat, Bird, Rocket, Star, Heart,
  Zap, Smile, Gamepad2, Coffee, Music, Pizza
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Sidebar Component
const Sidebar = ({ activeItem, onItemClick }) => {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'portfolio', icon: Wallet, label: 'Portfolio' },
    { id: 'predictions', icon: Brain, label: 'AI Predictions' },
    { id: 'alerts', icon: Bell, label: 'Alerts' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const AVATAR_MAP = {
    user: User, ghost: Ghost, dog: Dog, cat: Cat,
    bird: Bird, rocket: Rocket, star: Star, heart: Heart,
    zap: Zap, smile: Smile, gamepad: Gamepad2,
    coffee: Coffee, music: Music, pizza: Pizza
  };

  const selectedAvatarId = localStorage.getItem('stocksense_avatar') || 'user';
  const AvatarIcon = AVATAR_MAP[selectedAvatarId] || User;
  const brandColor = localStorage.getItem('stocksense_brand_color') || '#00d4ff';

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="sidebar hidden md:flex fixed left-0 top-0 h-screen w-16 flex-col items-center py-6 z-50">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-8 shadow-lg transition-all duration-500"
          style={{ backgroundColor: brandColor, boxShadow: `0 0 20px ${brandColor}40` }}
        >
          <AvatarIcon className="w-6 h-6 text-primary-foreground" />
        </div>

        <div className="flex-1 flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`sidebar-icon w-10 h-10 rounded-xl flex items-center justify-center ${activeItem === item.id ? 'active' : ''
                }`}
              data-testid={`sidebar-${item.id}`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${activeItem === item.id ? 'text-primary' : 'text-muted-foreground'}`} style={activeItem === item.id ? { color: brandColor } : {}} />
            </button>
          ))}
        </div>

        <button
          onClick={() => onItemClick('logout')}
          className="sidebar-icon w-10 h-10 rounded-xl flex items-center justify-center mt-auto"
          data-testid="sidebar-logout"
        >
          <LogOut className="w-5 h-5 text-slate-400 hover:text-red-400 transition-colors" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${activeItem === item.id ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            <item.icon className="w-5 h-5" style={activeItem === item.id ? { color: brandColor } : {}} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => onItemClick('logout')}
          className="flex flex-col items-center justify-center w-12 h-12 text-muted-foreground"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Logout</span>
        </button>
      </div>
    </>
  );
};

// Gauge Chart Component
const GaugeChart = ({ value, maxValue = 100, label, color = "#00d4ff" }) => {
  const percentage = (value / maxValue) * 100;
  const angle = (percentage / 100) * 180;

  return (
    <div className="relative w-full h-40">
      <svg viewBox="0 0 200 120" className="w-full h-full">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" className="text-border" strokeWidth="16" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${(angle / 180) * 251.2} 251.2`} style={{ filter: `drop-shadow(0 0 8px ${color}60)` }} />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-2">
        <p className="text-3xl font-bold text-foreground">{value}%</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};

// Metric Card with Sparkline
const MetricCard = ({ title, value, change, changeType, icon: Icon, sparklineData, color }) => {
  const isPositive = changeType === 'positive';

  return (
    <div className="dashboard-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {change}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>

      {sparklineData && (
        <div className="h-12 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`spark-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#spark-${title})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

// Prediction Card
const PredictionCard = ({ symbol, predictions, onClick }) => {
  const timeframes = ['3d', '7d', '15d', '30d'];
  const pred30d = predictions?.['30d'];
  const isPositive = pred30d?.change_percent >= 0;

  return (
    <div className="dashboard-card p-4 cursor-pointer hover:border-primary/50 transition-colors" onClick={onClick} data-testid={`prediction-card-${symbol}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono font-bold text-lg text-foreground">{symbol}</span>
        <Badge className={`${isPositive ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-red-500/20 text-red-500 border-red-500/30'}`}>
          {pred30d?.trend || 'N/A'}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {timeframes.map((tf) => {
          const pred = predictions?.[tf];
          const isPos = pred?.change_percent >= 0;
          return (
            <div key={tf} className="text-center p-2 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{tf.toUpperCase()}</p>
              <p className={`text-sm font-bold ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                {isPos ? '+' : ''}{pred?.change_percent?.toFixed(1) || 0}%
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Current: <span className="font-mono font-medium text-foreground">₹{pred30d?.current_price?.toLocaleString()}</span>
        </span>
        <span className="text-muted-foreground">
          Accuracy: <span className="font-medium text-primary">{pred30d?.confidence?.toFixed(0)}%</span>
        </span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predictionsLoading, setPredictionsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchDashboardData();
    fetchTrendingStocks();
    fetchPortfolio();
    fetchPredictions();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/summary`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchTrendingStocks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/market/trending`);
      setTrendingStocks(response.data);
    } catch (error) {
      console.error('Failed to fetch trending stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/portfolio`);
      setPortfolio(response.data);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    }
  };

  const fetchPredictions = async () => {
    try {
      setPredictionsLoading(true);
      const response = await axios.get(`${API_URL}/api/dashboard/predictions`);
      setPredictions(response.data);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setPredictionsLoading(false);
    }
  };

  const searchTimeout = React.useRef(null);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.length >= 2) {
      searchTimeout.current = setTimeout(async () => {
        try {
          const response = await axios.get(`${API_URL}/api/stocks/search?q=${query}`);
          setSearchResults(response.data);
        } catch (error) {
          console.error('Search failed:', error);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }
  };

  const handleSidebarClick = (item) => {
    if (item === 'logout') { logout(); navigate('/'); }
    else if (item === 'portfolio') { navigate('/portfolio'); }
    else if (item === 'alerts') { navigate('/alerts'); }
    else if (item === 'settings') { navigate('/settings'); }
    else { setActiveSection(item); }
  };

  const portfolioSummary = dashboardData?.portfolio || { total_invested: 0, total_current: 0, total_pnl: 0, pnl_percent: 0, holdings_count: 0 };

  const monthlyData = [
    { month: 'Jan', value: 4000, profit: 2400 },
    { month: 'Feb', value: 3000, profit: 1398 },
    { month: 'Mar', value: 5000, profit: 3800 },
    { month: 'Apr', value: 4500, profit: 3000 },
    { month: 'May', value: 6000, profit: 4500 },
    { month: 'Jun', value: 5500, profit: 4000 },
  ];

  const radarData = [
    { subject: 'Returns', A: 120, fullMark: 150 },
    { subject: 'Risk', A: 98, fullMark: 150 },
    { subject: 'Volatility', A: 86, fullMark: 150 },
    { subject: 'Diversity', A: 99, fullMark: 150 },
    { subject: 'Momentum', A: 85, fullMark: 150 },
    { subject: 'Liquidity', A: 65, fullMark: 150 },
  ];

  const sparklineData = Array.from({ length: 10 }, (_, i) => ({ value: Math.random() * 100 + 50 }));
  const COLORS = ['#00d4ff', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Sidebar activeItem={activeSection} onItemClick={handleSidebarClick} />

      <div className="ml-0 md:ml-16 pb-20 md:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-40 glass-header">
          <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">
                    Welcome back, <span className="gradient-text">{user?.name || 'Trader'}</span>
                  </h1>
                  <p className="text-muted-foreground text-xs md:text-sm">Market overview for today</p>
                </div>
                <div className="md:hidden flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => navigate('/alerts')} className="relative">
                    <Bell className="w-5 h-5" />
                    {dashboardData?.alerts_count > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />}
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="flex-1 w-full md:max-w-md md:mx-8 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  data-testid="stock-search-input"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    {searchResults.map((stock) => (
                      <button
                        key={stock.symbol}
                        onClick={() => { navigate(`/stock/${stock.symbol}`); setSearchResults([]); setSearchQuery(''); }}
                        className="w-full px-4 py-3 text-left hover:bg-secondary flex items-center justify-between transition-colors"
                        data-testid={`search-result-${stock.symbol}`}
                      >
                        <div>
                          <span className="font-mono font-bold text-foreground">{stock.symbol}</span>
                          <span className="text-sm text-muted-foreground ml-2">{stock.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="hidden md:flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate('/alerts')}
                  className="relative border-border bg-card hover:bg-secondary hover:border-primary"
                  data-testid="alerts-btn"
                >
                  <Bell className="w-5 h-5 text-foreground" />
                  {dashboardData?.alerts_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {dashboardData.alerts_count}
                    </span>
                  )}
                </Button>
                <Button onClick={() => navigate('/portfolio')} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" data-testid="add-stock-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stock
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <main className="max-w-[1800px] mx-auto px-6 py-6">
          {/* Top Metrics Row */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <MetricCard title="Portfolio Value" value={`₹${portfolioSummary.total_current?.toLocaleString() || '0'}`} change={`${portfolioSummary.pnl_percent >= 0 ? '+' : ''}${portfolioSummary.pnl_percent?.toFixed(1) || 0}%`} changeType={portfolioSummary.pnl_percent >= 0 ? 'positive' : 'negative'} icon={Wallet} sparklineData={sparklineData} color="var(--cyan-primary)" />
            <MetricCard title="Total P&L" value={`₹${portfolioSummary.total_pnl?.toLocaleString() || '0'}`} change={`${portfolioSummary.total_pnl >= 0 ? '+' : ''}${((portfolioSummary.total_pnl / (portfolioSummary.total_invested || 1)) * 100).toFixed(1)}%`} changeType={portfolioSummary.total_pnl >= 0 ? 'positive' : 'negative'} icon={TrendingUp} sparklineData={sparklineData} color="var(--success)" />
            <MetricCard title="Holdings" value={portfolioSummary.holdings_count || 0} change="+2 this week" changeType="positive" icon={PieChart} color="#8b5cf6" />
            <MetricCard title="Active Alerts" value={dashboardData?.alerts_count || 0} change="Monitoring" changeType="positive" icon={Bell} color="var(--warning)" />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Performance Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
              <div className="dashboard-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Live Market Data</h3>
                    <p className="text-sm text-muted-foreground">Real Time Visualization</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30">1D</Badge>
                    <Badge variant="outline" className="border-border text-muted-foreground">1W</Badge>
                    <Badge variant="outline" className="border-border text-muted-foreground">1M</Badge>
                  </div>
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--cyan-primary)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--cyan-primary)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--success)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fill: 'var(--chart-text)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--chart-text)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--navy-medium)', border: '1px solid var(--border)', borderRadius: '12px', color: 'hsl(var(--foreground))' }} />
                      <Area type="monotone" dataKey="value" stroke="var(--cyan-primary)" strokeWidth={2} fill="url(#colorValue)" />
                      <Area type="monotone" dataKey="profit" stroke="var(--success)" strokeWidth={2} fill="url(#colorProfit)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* Gauge & Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
              <div className="dashboard-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-2">Portfolio Health</h3>
                <GaugeChart value={76} label="Performance Score" color="var(--cyan-primary)" />
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-muted-foreground">0%</span>
                  <span className="text-emerald-500 font-medium">+15% vs last month</span>
                  <span className="text-muted-foreground">100%</span>
                </div>
              </div>

              <div className="dashboard-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Win Rate', value: '68%', color: 'var(--success)' },
                    { label: 'Avg Return', value: '+12.4%', color: 'var(--cyan-primary)' },
                    { label: 'Risk Score', value: 'Low', color: 'var(--warning)' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <span className="text-muted-foreground">{stat.label}</span>
                      <span className="font-bold" style={{ color: stat.color }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Predictions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
              <div className="dashboard-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <Brain className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">AI Stock Predictions</h3>
                      <p className="text-sm text-muted-foreground">3D • 7D • 15D • 30D Forecasts</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">ML Powered</Badge>
                </div>

                {predictionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-cyan animate-spin" />
                  </div>
                ) : predictions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {predictions.slice(0, 4).map((item) => (
                      <PredictionCard key={item.symbol} symbol={item.symbol} predictions={item.predictions} onClick={() => navigate(`/stock/${item.symbol}`)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Brain className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                    <p>Unable to load predictions</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Radar Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="dashboard-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-2">Portfolio Spread</h3>
                <p className="text-sm text-muted-foreground mb-4">Risk Distribution Analysis</p>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="var(--chart-grid)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--chart-text)', fontSize: 11 }} />
                      <PolarRadiusAxis tick={{ fill: 'var(--chart-text)', fontSize: 10 }} axisLine={false} />
                      <Radar name="Portfolio" dataKey="A" stroke="var(--cyan-primary)" fill="var(--cyan-primary)" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Market Movers */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6">
            <div className="dashboard-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Market Movers</h3>
                    <p className="text-sm text-muted-foreground">Top active stocks</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 bg-secondary/50 rounded-xl animate-pulse" />
                  ))
                ) : (
                  trendingStocks.slice(0, 8).map((stock, idx) => (
                    <button
                      key={stock.symbol}
                      onClick={() => navigate(`/stock/${stock.symbol}`)}
                      className="p-4 bg-secondary/50 hover:bg-secondary rounded-xl flex items-center justify-between transition-colors border border-transparent hover:border-primary/30"
                      data-testid={`trending-stock-${stock.symbol}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-mono font-bold text-foreground">{stock.symbol}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-muted-foreground text-sm">₹{stock.price?.toLocaleString()}</p>
                        <p className={`text-sm font-bold ${stock.change_percent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent?.toFixed(2)}%
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
