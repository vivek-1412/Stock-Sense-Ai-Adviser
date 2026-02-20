import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
    ArrowLeft, User, Bell, Shield, Palette, Database,
    HelpCircle, LogOut, ChevronRight, Check, AlertCircle,
    Activity, Zap, Moon, Sun, Globe, Monitor, Menu,
    UserCircle, Ghost, Dog, Cat, Bird, Rocket, Star, Heart,
    Camera, Image as ImageIcon, Gamepad2, Coffee, Music, Pizza,
    Smile
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const AVATARS = [
    { id: 'user', icon: User, label: 'Classic' },
    { id: 'ghost', icon: Ghost, label: 'Ghosty' },
    { id: 'dog', icon: Dog, label: 'Pippin' },
    { id: 'cat', icon: Cat, label: 'Luna' },
    { id: 'rocket', icon: Rocket, label: 'Astro' },
    { id: 'zap', icon: Zap, label: 'Volt' },
    { id: 'smile', icon: Smile, label: 'Happy' },
    { id: 'gamepad', icon: Gamepad2, label: 'Gamer' },
    { id: 'coffee', icon: Coffee, label: 'Brew' },
    { id: 'music', icon: Music, label: 'Vibe' },
    { id: 'pizza', icon: Pizza, label: 'Slice' },
    { id: 'star', icon: Star, label: 'Alpha' }
];

const Settings = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [apiStatus, setApiStatus] = useState('checking');
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [avatarSelectorOpen, setAvatarSelectorOpen] = useState(false);

    const [selectedAvatar, setSelectedAvatar] = useState(() => {
        return localStorage.getItem('stocksense_avatar') || 'user';
    });

    const [customAvatar, setCustomAvatar] = useState(() => {
        return localStorage.getItem('stocksense_custom_avatar') || null;
    });

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('stocksense_theme') || 'midnight';
    });

    const fileInputRef = useRef(null);

    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('stocksense_notifications');
        return saved ? JSON.parse(saved) : {
            priceAlerts: true,
            weeklySummary: false,
            aiPredictions: true,
            marketNews: true
        };
    });

    const [brandColor, setBrandColor] = useState(() => {
        return localStorage.getItem('stocksense_brand_color') || '#00d4ff';
    });

    const [profileData, setProfileData] = useState({
        name: user?.name || 'User',
        email: user?.email || 'user@example.com'
    });

    useEffect(() => {
        const checkApi = async () => {
            try {
                await axios.get(`${API_URL}/api/health`);
                setApiStatus('healthy');
            } catch (error) {
                setApiStatus('error');
            }
        };
        checkApi();
    }, []);

    useEffect(() => {
        localStorage.setItem('stocksense_notifications', JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        localStorage.setItem('stocksense_brand_color', brandColor);
        localStorage.setItem('stocksense_avatar', selectedAvatar);
        localStorage.setItem('stocksense_theme', theme);

        // Apply theme globally
        if (theme === 'solaris') {
            document.documentElement.classList.add('light');
        } else {
            document.documentElement.classList.remove('light');
        }

        // Apply brand color globally
        const hsl = hexToHSL(brandColor);
        document.documentElement.style.setProperty('--primary', hsl);
        document.documentElement.style.setProperty('--ring', hsl);
    }, [brandColor, selectedAvatar, theme]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("File is too large! Limit is 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setCustomAvatar(base64String);
                setSelectedAvatar('custom');
                localStorage.setItem('stocksense_custom_avatar', base64String);
                toast.success("Custom identity uploaded!");
            };
            reader.readAsDataURL(file);
        }
    };

    const hexToHSL = (hex) => {
        let r = parseInt(hex.slice(1, 3), 16) / 255;
        let g = parseInt(hex.slice(3, 5), 16) / 255;
        let b = parseInt(hex.slice(5, 7), 16) / 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) h = s = 0;
        else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
                default: break;
            }
            h /= 6;
        }
        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    const handleSaveProfile = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Profile updated successfully!");
        }, 1200);
    };

    const toggleNotification = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
        toast.info(`Notification preference updated`);
    };

    const tabs = [
        { id: 'profile', icon: User, label: 'Profile' },
        { id: 'notifications', icon: Bell, label: 'Notifications' },
        { id: 'security', icon: Shield, label: 'Security' },
        { id: 'appearance', icon: Palette, label: 'Appearance' },
        { id: 'system', icon: Monitor, label: 'System & API' }
    ];

    const currentAvatarData = AVATARS.find(a => a.id === selectedAvatar) || AVATARS[0];
    const AvatarIcon = currentAvatarData.icon;

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <header className="fixed top-0 left-0 right-0 h-16 bg-background/90 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 z-50">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="mr-2 text-slate-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-lg md:text-xl font-black tracking-tighter underline decoration-primary/30 decoration-2 underline-offset-8">
                        <span className="gradient-text">SETTINGS</span>
                    </h1>
                </div>

                <Button variant="ghost" size="icon" className="md:hidden text-slate-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <Menu className="w-6 h-6" />
                </Button>
            </header>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 top-16 bg-background z-40 md:hidden p-4">
                        <div className="grid grid-cols-2 gap-4">
                            {tabs.map((tab) => (
                                <button onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }} className={`flex flex-col items-center justify-center aspect-square gap-3 p-4 rounded-3xl transition-all ${activeTab === tab.id ? 'bg-cyan/20 text-cyan border-2 border-cyan shadow-[0_0_20px_rgba(0,212,255,0.1)]' : 'bg-secondary text-muted-foreground border border-border'}`}>
                                    <tab.icon className="w-8 h-8" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="max-w-5xl mx-auto pt-24 px-4 pb-24">
                <div className="flex flex-col md:flex-row gap-8">
                    <aside className="hidden md:block w-64 space-y-2 shrink-0 h-fit sticky top-24">
                        {tabs.map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                        <div className="pt-4 mt-4 border-t border-border">
                            <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 group transition-all hover:bg-red-500/10">
                                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Log Out
                            </button>
                        </div>
                    </aside>

                    <div className="flex-1 min-w-0">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                            {activeTab === 'profile' && (
                                <Card className="bg-[#1e293b]/50 border-slate-800 backdrop-blur-md">
                                    <CardHeader className="pb-8">
                                        <CardTitle className="text-foreground text-2xl font-black tracking-tighter">
                                            <span className="text-primary italic mr-2">//</span>
                                            MY ACCOUNT
                                        </CardTitle>
                                        <CardDescription className="text-slate-500">Manage your profile and digital identity.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-8">
                                        <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-slate-800/50">
                                            <div className="relative group">
                                                <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-cyan via-blue-500 to-indigo-600 p-1 rotate-3 group-hover:rotate-0 transition-all duration-500 shadow-xl shadow-cyan/10">
                                                    <div className="w-full h-full rounded-[2.3rem] bg-card flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-all duration-500 overflow-hidden text-card-foreground">
                                                        {selectedAvatar === 'custom' && customAvatar ? (
                                                            <img src={customAvatar} alt="Profile" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <AvatarIcon className="w-14 h-14 text-primary drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]" />
                                                        )}
                                                    </div>
                                                </div>
                                                <Dialog open={avatarSelectorOpen} onOpenChange={setAvatarSelectorOpen}>
                                                    <DialogTrigger asChild>
                                                        <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white text-[#0f172a] border-4 border-[#0f172a] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl group-hover:bg-cyan group-hover:text-white">
                                                            <Camera className="w-5 h-5" />
                                                        </button>
                                                    </DialogTrigger>
                                                    <DialogContent className="bg-[#0f172a] border-slate-800 sm:max-w-xl">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-2xl font-black text-white uppercase italic">Select Avatar</DialogTitle>
                                                            <DialogDescription className="text-slate-500">Choose an icon that matches your trading style.</DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-8">
                                                            {AVATARS.map((avatar) => (
                                                                <button
                                                                    key={avatar.id}
                                                                    onClick={() => { setSelectedAvatar(avatar.id); setAvatarSelectorOpen(false); toast.success(`${avatar.label} selected!`); }}
                                                                    className={`flex flex-col items-center gap-3 p-4 rounded-3xl transition-all border-2 ${selectedAvatar === avatar.id ? 'bg-cyan/10 border-cyan shadow-[0_0_20px_rgba(0,212,255,0.1)] scale-105' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                                                                >
                                                                    <avatar.icon className={`w-10 h-10 ${selectedAvatar === avatar.id ? 'text-cyan' : 'text-slate-500'}`} />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{avatar.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <input
                                                            type="file"
                                                            ref={fileInputRef}
                                                            onChange={handleFileChange}
                                                            accept="image/*"
                                                            className="hidden"
                                                        />
                                                        <div
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="p-4 rounded-3xl bg-secondary/50 border border-border flex items-center justify-between group cursor-pointer hover:border-primary transition-colors"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${selectedAvatar === 'custom' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground group-hover:text-primary'}`}>
                                                                    <ImageIcon className="w-6 h-6" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-foreground uppercase tracking-tighter">Upload Custom DNA</p>
                                                                    <p className="text-[10px] text-muted-foreground">{selectedAvatar === 'custom' ? 'Active - Click to Change' : 'Personalize your profile'}</p>
                                                                </div>
                                                            </div>
                                                            {selectedAvatar === 'custom' ? (
                                                                <Badge className="bg-emerald-500/20 text-emerald-500 uppercase text-[9px] font-black italic">Active</Badge>
                                                            ) : (
                                                                <Badge className="bg-primary/20 text-primary uppercase text-[9px] font-black italic">Unlocked</Badge>
                                                            )}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                            <div className="text-center sm:text-left space-y-3">
                                                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">{profileData.name}</h3>
                                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                                    <Badge className="bg-cyan/10 text-cyan border-cyan/20 px-3 py-1 font-black italic tracking-widest text-[10px]">VERIFIED TRADER</Badge>
                                                    <span className="text-slate-700">•</span>
                                                    <span className="text-slate-500 text-xs font-mono">{profileData.email}</span>
                                                </div>
                                                <div className="flex gap-4 pt-2">
                                                    <div className="text-center sm:text-left">
                                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Growth</p>
                                                        <p className="text-lg font-black text-emerald-400">+24.5%</p>
                                                    </div>
                                                    <div className="text-center sm:text-left">
                                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Level</p>
                                                        <p className="text-lg font-black text-indigo-400">Master</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Display Name</Label>
                                                <Input value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} className="bg-background border-border h-14 text-foreground text-lg font-bold rounded-2xl focus:border-primary" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Email Identity</Label>
                                                <Input value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} className="bg-background border-border h-14 text-muted-foreground font-mono italic rounded-2xl focus:border-primary" />
                                            </div>
                                        </div>

                                        <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full h-14 bg-cyan hover:bg-cyan/90 text-[#0f172a] font-black italic text-lg rounded-2xl shadow-xl shadow-cyan/20">
                                            {isSaving ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Check className="w-6 h-6 mr-2" />}
                                            SAVE ALL CHANGES
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === 'appearance' && (
                                <Card className="bg-[#1e293b]/50 border-slate-800 backdrop-blur-md">
                                    <CardHeader>
                                        <CardTitle className="text-foreground text-2xl font-black tracking-tighter">
                                            <span className="text-primary italic mr-2">//</span>
                                            DESIGN SYSTEM
                                        </CardTitle>
                                        <CardDescription className="text-slate-500">Hack the visual matrix of your trading experience.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-12 pb-12">
                                        <div className="space-y-6">
                                            <Label className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">Global Theme</Label>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div
                                                    onClick={() => setTheme('midnight')}
                                                    className={`relative p-6 rounded-[2rem] bg-[#0f172a] border-2 flex flex-col items-center gap-4 cursor-pointer overflow-hidden group transition-all ${theme === 'midnight' ? 'border-cyan shadow-[0_0_30px_rgba(0,212,255,0.1)]' : 'border-slate-800'}`}
                                                >
                                                    {theme === 'midnight' && (
                                                        <div className="absolute top-0 right-0 p-3 bg-cyan text-[#0f172a] rounded-bl-2xl">
                                                            <Check className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${theme === 'midnight' ? 'bg-cyan/10' : 'bg-slate-800'}`}>
                                                        <Moon className={`w-8 h-8 ${theme === 'midnight' ? 'text-cyan' : 'text-slate-500'}`} />
                                                    </div>
                                                    <p className={`text-xs font-black uppercase tracking-widest ${theme === 'midnight' ? 'text-white' : 'text-slate-500'}`}>Midnight Neon</p>
                                                </div>
                                                <div
                                                    onClick={() => { setTheme('solaris'); toast.success("Solaris Light theme enabled!"); }}
                                                    className={`relative p-6 rounded-[2rem] flex flex-col items-center gap-4 cursor-pointer overflow-hidden group transition-all ${theme === 'solaris' ? 'bg-white border-2 border-cyan shadow-[0_0_30px_rgba(0,212,255,0.1)]' : 'bg-slate-900/50 border border-slate-800 hover:border-slate-700'}`}
                                                >
                                                    {theme === 'solaris' && (
                                                        <div className="absolute top-0 right-0 p-3 bg-cyan text-white rounded-bl-2xl">
                                                            <Check className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${theme === 'solaris' ? 'bg-cyan/10' : 'bg-slate-800/50'}`}>
                                                        <Sun className={`w-8 h-8 ${theme === 'solaris' ? 'text-cyan' : 'text-slate-600'}`} />
                                                    </div>
                                                    <p className={`text-xs font-black uppercase tracking-widest ${theme === 'solaris' ? 'text-slate-900' : 'text-slate-600'}`}>Solaris Light</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <Label className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">Primary Signature Color</Label>
                                            <div className="flex flex-wrap gap-5 justify-center sm:justify-start">
                                                {[
                                                    { color: '#00d4ff', label: 'Neon' },
                                                    { color: '#10b981', label: 'Jade' },
                                                    { color: '#8b5cf6', label: 'Iris' },
                                                    { color: '#f59e0b', label: 'Gold' },
                                                    { color: '#ef4444', label: 'Ruby' },
                                                    { color: '#ec4899', label: 'Pink' }
                                                ].map((c) => (
                                                    <motion.button
                                                        key={c.color}
                                                        whileHover={{ scale: 1.15, rotate: 5 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => { setBrandColor(c.color); toast.success(`${c.label} color applied globally!`); }}
                                                        className={`w-14 h-14 rounded-3xl transition-all shadow-xl border-4 ${brandColor === c.color ? 'border-white scale-110' : 'border-[#0f172a]'}`}
                                                        style={{ backgroundColor: c.color, boxShadow: brandColor === c.color ? `0 0 20px ${c.color}60` : 'none' }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === 'notifications' && (
                                <Card className="bg-[#1e293b]/50 border-slate-800">
                                    <CardHeader>
                                        <CardTitle className="text-foreground text-2xl font-black tracking-tighter italic">
                                            <span className="text-primary mr-2">//</span>
                                            SMART LOGISTICS
                                        </CardTitle>
                                        <CardDescription className="text-slate-500">Configure how data flows to your devices.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {[
                                            { id: 'priceAlerts', label: 'Price Wall Triggers', desc: 'When targets are breached.' },
                                            { id: 'weeklySummary', label: 'Alpha Performance', desc: 'Detailed PDF report every Monday.' },
                                            { id: 'aiPredictions', label: 'AI Strategy Pulse', desc: 'When the model switches polarity.' },
                                            { id: 'marketNews', label: 'Critical Volatility', desc: 'Instant heads-up for fast moves.' }
                                        ].map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-6 rounded-3xl hover:bg-slate-900/50 transition-colors">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-white italic tracking-tight uppercase transition-colors">{item.label}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase font-medium">{item.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => toggleNotification(item.id)}
                                                    className={`w-16 h-8 rounded-2xl relative transition-all duration-500 overflow-hidden ${notifications[item.id] ? 'bg-cyan shadow-[0_0_15px_rgba(0,212,255,0.4)]' : 'bg-slate-800'}`}
                                                >
                                                    <motion.div
                                                        animate={{ x: notifications[item.id] ? 36 : 6 }}
                                                        className="absolute top-1.5 w-5 h-5 bg-white rounded-lg shadow-lg"
                                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                    />
                                                </button>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Settings;
