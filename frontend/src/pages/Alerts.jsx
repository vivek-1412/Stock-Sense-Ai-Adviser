import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { ArrowLeft, Plus, Trash2, Bell, Loader2, Search, TrendingUp, TrendingDown, AlertTriangle, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const Alerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [formData, setFormData] = useState({ alert_type: 'price_above', threshold: '' });
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => { try { setLoading(true); const response = await axios.get(`${API_URL}/api/alerts`); setAlerts(response.data); } catch (error) { console.error('Failed to fetch alerts:', error); } finally { setLoading(false); } };

  const handleSearch = async (query) => { setSearchQuery(query); if (query.length >= 2) { try { const response = await axios.get(`${API_URL}/api/stocks/search?q=${query}`); setSearchResults(response.data); } catch (error) { console.error('Search failed:', error); } } else { setSearchResults([]); } };

  const handleSelectStock = (stock) => { setSelectedStock(stock); setSearchQuery(stock.symbol); setSearchResults([]); };

  const handleCreateAlert = async () => {
    if (!selectedStock || !formData.threshold) return;
    try { await axios.post(`${API_URL}/api/alerts`, { symbol: selectedStock.symbol, alert_type: formData.alert_type, threshold: parseFloat(formData.threshold), email_enabled: true }); setDialogOpen(false); setSelectedStock(null); setSearchQuery(''); setFormData({ alert_type: 'price_above', threshold: '' }); fetchAlerts(); }
    catch (error) { alert('Failed to create alert'); }
  };

  const handleDeleteAlert = async (alertId) => { setDeleting(alertId); try { await axios.delete(`${API_URL}/api/alerts/${alertId}`); fetchAlerts(); } catch (error) { alert('Failed to delete alert'); } finally { setDeleting(null); } };
  const handleToggleAlert = async (alertId) => { setToggling(alertId); try { await axios.patch(`${API_URL}/api/alerts/${alertId}/toggle`); fetchAlerts(); } catch (error) { console.error('Failed to toggle alert:', error); } finally { setToggling(null); } };

  const getAlertTypeLabel = (type) => ({ 'price_above': 'Price Above', 'price_below': 'Price Below', 'pnl_above': 'P&L Above %', 'pnl_below': 'P&L Below %' }[type] || type);
  const getAlertIcon = (type) => type.includes('above') ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />;

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
                <div><h1 className="text-2xl font-bold text-white">Price Alerts</h1><p className="text-sm text-slate-400">{alerts.filter(a => a.is_active).length} Active</p></div>
              </div>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild><Button className="bg-cyan hover:bg-cyan-light text-[#0f172a] font-semibold" data-testid="create-alert-btn"><Plus className="w-4 h-4 mr-2" />Create Alert</Button></DialogTrigger>
                <DialogContent className="bg-[#1e293b] border-[#334155] max-w-md">
                  <DialogHeader><DialogTitle className="text-xl font-bold text-white">Create Price Alert</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2 relative">
                      <Label className="text-slate-300">Search Stock</Label>
                      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search NSE/BSE stocks..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-10 h-11 bg-[#334155] border-[#475569] text-white" data-testid="alert-search-input" /></div>
                      {searchResults.length > 0 && (<div className="absolute top-full mt-1 w-full bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">{searchResults.map((stock) => (<button key={stock.symbol} onClick={() => handleSelectStock(stock)} className="w-full px-4 py-2 text-left hover:bg-[#334155] flex items-center justify-between" data-testid={`alert-select-${stock.symbol}`}><span className="font-mono font-bold text-white">{stock.symbol}</span><span className="text-sm text-slate-400 truncate ml-2">{stock.name}</span></button>))}</div>)}
                    </div>
                    {selectedStock && (<div className="p-3 rounded-xl bg-cyan/10 border border-cyan/30"><span className="font-mono font-bold text-cyan">{selectedStock.symbol}</span><span className="text-sm text-slate-300 ml-2">{selectedStock.name}</span></div>)}
                    <div className="space-y-2">
                      <Label className="text-slate-300">Alert Type</Label>
                      <Select value={formData.alert_type} onValueChange={(v) => setFormData({ ...formData, alert_type: v })}>
                        <SelectTrigger className="h-11 bg-[#334155] border-[#475569] text-white" data-testid="alert-type-select"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#1e293b] border-[#334155]"><SelectItem value="price_above">Price Above</SelectItem><SelectItem value="price_below">Price Below</SelectItem><SelectItem value="pnl_above">P&L Above %</SelectItem><SelectItem value="pnl_below">P&L Below %</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label className="text-slate-300">Threshold</Label><Input type="number" placeholder={formData.alert_type.includes('price') ? 'Price in ₹' : 'Percentage'} value={formData.threshold} onChange={(e) => setFormData({ ...formData, threshold: e.target.value })} className="h-11 bg-[#334155] border-[#475569] text-white" data-testid="alert-threshold-input" /></div>
                    <Button className="w-full bg-cyan hover:bg-cyan-light text-[#0f172a] font-semibold" onClick={handleCreateAlert} disabled={!selectedStock || !formData.threshold} data-testid="confirm-create-alert-btn">Create Alert</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>
        
        <main className="max-w-[1800px] mx-auto px-6 py-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="dashboard-card p-5 border-l-4 border-amber-500">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5 text-amber-400" /></div>
                <div><h3 className="font-bold text-white mb-1">Email Alerts</h3><p className="text-sm text-slate-400">Price alerts will be sent to your registered email when conditions are met. Note: Email delivery requires SendGrid configuration (currently <span className="text-amber-400 font-medium">MOCKED</span> for demo).</p></div>
              </div>
            </div>
          </motion.div>
          
          <div className="dashboard-card p-6">
            <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-cyan/20 rounded-xl flex items-center justify-center"><Bell className="w-5 h-5 text-cyan" /></div><h3 className="text-lg font-bold text-white">Your Alerts</h3></div>
            
            {alerts.length === 0 ? (
              <div className="py-12 text-center"><Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" /><p className="text-slate-400 mb-4">No alerts configured</p><Button className="bg-cyan hover:bg-cyan-light text-[#0f172a] font-semibold" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Create Your First Alert</Button></div>
            ) : (
              <div className="space-y-3">{alerts.map((alert) => (
                <div key={alert.id} className={`p-4 bg-[#334155]/50 rounded-xl border ${alert.is_active ? 'border-transparent' : 'border-[#475569]'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#1e293b] rounded-xl flex items-center justify-center border border-[#475569]">{getAlertIcon(alert.alert_type)}</div>
                      <div><div className="flex items-center gap-2"><span className="font-mono font-bold text-white">{alert.symbol}</span><Badge variant="outline" className="border-[#475569] text-slate-400">{getAlertTypeLabel(alert.alert_type)}</Badge></div><p className="text-sm text-slate-400 mt-1">Threshold: {alert.alert_type.includes('price') ? '₹' : ''}{alert.threshold?.toLocaleString()}{alert.alert_type.includes('pnl') ? '%' : ''}</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2"><Switch checked={alert.is_active} onCheckedChange={() => handleToggleAlert(alert.id)} disabled={toggling === alert.id} data-testid={`toggle-${alert.id}`} /><span className={`text-sm font-medium ${alert.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>{alert.is_active ? 'Active' : 'Paused'}</span></div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAlert(alert.id)} disabled={deleting === alert.id} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10" data-testid={`delete-alert-${alert.id}`}>{deleting === alert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</Button>
                    </div>
                  </div>
                </div>
              ))}</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Alerts;
