import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, Wallet, Loader2, Search, Home, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const COLORS = ['#00d4ff', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

const Portfolio = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [formData, setFormData] = useState({ quantity: '', buy_price: '', buy_date: '' });
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchPortfolio(); }, []);

  const fetchPortfolio = async () => {
    try { setLoading(true); const response = await axios.get(`${API_URL}/api/portfolio`); setPortfolio(response.data); }
    catch (error) { console.error('Failed to fetch portfolio:', error); }
    finally { setLoading(false); }
  };

  const searchTimeout = React.useRef(null);

  const handleSearch = (query) => {
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

  const handleSelectStock = (stock) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setSelectedStock(stock);
    setSearchQuery(stock.symbol);
    setSearchResults([]);
  };

  const handleAddStock = async () => {
    if (!selectedStock || !formData.quantity) return;
    try {
      await axios.post(`${API_URL}/api/portfolio/add`, { symbol: selectedStock.symbol, quantity: parseFloat(formData.quantity), buy_price: parseFloat(formData.buy_price) || 0, buy_date: formData.buy_date || new Date().toISOString().split('T')[0] });
      setDialogOpen(false); setSelectedStock(null); setSearchQuery(''); setFormData({ quantity: '', buy_price: '', buy_date: '' }); fetchPortfolio();
    } catch (error) { alert('Failed to add stock to portfolio'); }
  };

  const handleDeleteStock = async (itemId) => {
    setDeleting(itemId);
    try { await axios.delete(`${API_URL}/api/portfolio/${itemId}`); fetchPortfolio(); }
    catch (error) { alert('Failed to remove stock from portfolio'); }
    finally { setDeleting(null); }
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><Loader2 className="w-8 h-8 text-cyan animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="sidebar fixed left-0 top-0 h-screen w-16 flex flex-col items-center py-6 z-50">
        <button onClick={() => navigate('/dashboard')} className="w-10 h-10 bg-cyan rounded-xl flex items-center justify-center mb-8 shadow-cyan" data-testid="back-btn"><Home className="w-5 h-5 text-[#0f172a]" /></button>
      </div>

      <div className="ml-16">
        <header className="sticky top-0 z-40 glass-header">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white hover:bg-[#334155]"><ArrowLeft className="w-5 h-5" /></Button>
                <div><h1 className="text-2xl font-bold text-white">My Portfolio</h1><p className="text-sm text-slate-400">{portfolio?.items?.length || 0} Holdings</p></div>
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild><Button className="bg-cyan hover:bg-cyan-light text-[#0f172a] font-semibold" data-testid="add-stock-btn"><Plus className="w-4 h-4 mr-2" />Add Stock</Button></DialogTrigger>
                <DialogContent className="bg-[#1e293b] border-[#334155] max-w-md">
                  <DialogHeader><DialogTitle className="text-xl font-bold text-white">Add Stock to Portfolio</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2 relative">
                      <Label className="text-slate-300">Search Stock</Label>
                      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search NSE/BSE stocks..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-10 h-11 bg-[#334155] border-[#475569] text-white" data-testid="portfolio-search-input" /></div>
                      {searchResults.length > 0 && (<div className="absolute top-full mt-1 w-full bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">{searchResults.map((stock) => (<button key={stock.symbol} onClick={() => handleSelectStock(stock)} className="w-full px-4 py-2 text-left hover:bg-[#334155] flex items-center justify-between" data-testid={`select-${stock.symbol}`}><span className="font-mono font-bold text-white">{stock.symbol}</span><span className="text-sm text-slate-400 truncate ml-2">{stock.name}</span></button>))}</div>)}
                    </div>
                    {selectedStock && (<div className="p-3 rounded-xl bg-cyan/10 border border-cyan/30"><span className="font-mono font-bold text-cyan">{selectedStock.symbol}</span><span className="text-sm text-slate-300 ml-2">{selectedStock.name}</span></div>)}
                    <div className="space-y-2"><Label className="text-slate-300">Quantity</Label><Input type="number" placeholder="Number of shares" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="h-11 bg-[#334155] border-[#475569] text-white" data-testid="quantity-input" /></div>
                    <div className="space-y-2"><Label className="text-slate-300">Buy Price (₹)</Label><Input type="number" placeholder="Price per share" value={formData.buy_price} onChange={(e) => setFormData({ ...formData, buy_price: e.target.value })} className="h-11 bg-[#334155] border-[#475569] text-white" data-testid="buy-price-input" /></div>
                    <div className="space-y-2"><Label className="text-slate-300">Buy Date</Label><Input type="date" value={formData.buy_date} onChange={(e) => setFormData({ ...formData, buy_date: e.target.value })} className="h-11 bg-[#334155] border-[#475569] text-white" data-testid="buy-date-input" /></div>
                    <Button className="w-full bg-cyan hover:bg-cyan-light text-[#0f172a] font-semibold" onClick={handleAddStock} disabled={!selectedStock || !formData.quantity} data-testid="confirm-add-btn">Add to Portfolio</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <main className="max-w-[1800px] mx-auto px-6 py-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <div className="dashboard-card p-5"><p className="text-sm text-slate-400 mb-1">Total Invested</p><p className="text-3xl font-bold text-white">₹{portfolio?.summary?.total_invested?.toLocaleString() || 0}</p></div>
            <div className="dashboard-card p-5"><p className="text-sm text-slate-400 mb-1">Current Value</p><p className="text-3xl font-bold text-cyan">₹{portfolio?.summary?.total_current?.toLocaleString() || 0}</p></div>
            <div className="dashboard-card p-5"><p className="text-sm text-slate-400 mb-1">Total P&L</p><p className={`text-3xl font-bold ${portfolio?.summary?.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{portfolio?.summary?.total_pnl >= 0 ? '+' : ''}₹{portfolio?.summary?.total_pnl?.toLocaleString() || 0}</p></div>
            <div className="dashboard-card p-5"><p className="text-sm text-slate-400 mb-1">Returns</p><div className="flex items-center gap-2">{portfolio?.summary?.total_pnl_percent >= 0 ? <TrendingUp className="w-6 h-6 text-emerald-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}<p className={`text-3xl font-bold ${portfolio?.summary?.total_pnl_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{portfolio?.summary?.total_pnl_percent?.toFixed(2) || 0}%</p></div></div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="dashboard-card p-6">
                <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-cyan/20 rounded-xl flex items-center justify-center"><Wallet className="w-5 h-5 text-cyan" /></div><h3 className="text-lg font-bold text-white">Holdings</h3></div>
                {portfolio?.items?.length === 0 ? (
                  <div className="py-12 text-center"><Wallet className="w-12 h-12 text-slate-600 mx-auto mb-4" /><p className="text-slate-400 mb-4">Your portfolio is empty</p><Button className="bg-cyan hover:bg-cyan-light text-[#0f172a] font-semibold" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Your First Stock</Button></div>
                ) : (
                  <div className="space-y-3">{portfolio?.items?.map((item) => (
                    <div key={item.id} className="p-4 bg-[#334155]/50 hover:bg-[#334155] rounded-xl transition-colors border border-transparent hover:border-cyan/30">
                      <div className="flex items-center justify-between">
                        <button onClick={() => navigate(`/stock/${item.symbol}`)} className="flex items-center gap-4 text-left" data-testid={`holding-${item.symbol}`}><div><span className="font-mono font-bold text-white">{item.symbol}</span><p className="text-sm text-slate-400">{item.quantity} shares @ ₹{item.buy_price?.toLocaleString()}</p></div></button>
                        <div className="flex items-center gap-4">
                          <div className="text-right"><p className="font-mono text-white">₹{item.current_value?.toLocaleString()}</p><div className={`flex items-center justify-end gap-1 ${item.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{item.pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}<span className="text-sm font-medium">{item.pnl >= 0 ? '+' : ''}₹{item.pnl?.toLocaleString()} ({item.pnl_percent?.toFixed(2)}%)</span></div></div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteStock(item.id)} disabled={deleting === item.id} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10" data-testid={`delete-${item.symbol}`}>{deleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</Button>
                        </div>
                      </div>
                    </div>
                  ))}</div>
                )}
              </div>
            </div>

            <div className="dashboard-card p-6">
              <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center"><PieChart className="w-5 h-5 text-purple-400" /></div><h3 className="text-lg font-bold text-white">Allocation</h3></div>
              {portfolio?.allocation?.length > 0 ? (
                <><div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><RechartsPie><Pie data={portfolio.allocation} dataKey="value" nameKey="symbol" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>{portfolio.allocation.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }} formatter={(value, name) => [`₹${value.toLocaleString()}`, name]} /></RechartsPie></ResponsiveContainer></div>
                  <div className="space-y-2 mt-4">{portfolio.allocation.map((item, idx) => (<div key={item.symbol} className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} /><span className="font-mono text-slate-300">{item.symbol}</span></div><span className="text-slate-400">{item.percentage}%</span></div>))}</div></>
              ) : (<div className="h-[250px] flex items-center justify-center"><p className="text-slate-500 text-sm">No holdings to display</p></div>)}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Portfolio;
