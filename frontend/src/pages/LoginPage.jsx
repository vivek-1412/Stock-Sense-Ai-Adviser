import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { TrendingUp, Shield, Bell, BarChart3, Brain, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(loginData.email, loginData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    try {
      await register(registerData.name, registerData.email, registerData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Brain, title: 'AI Predictions', desc: 'ML-powered 3D, 7D, 15D, 30D forecasts' },
    { icon: BarChart3, title: 'Risk Analysis', desc: 'Portfolio risk assessment' },
    { icon: Bell, title: 'Smart Alerts', desc: 'Real-time price notifications' },
    { icon: Shield, title: 'Secure', desc: 'Bank-grade security' },
  ];

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '₹2Cr+', label: 'Tracked Daily' },
    { value: '85%', label: 'Accuracy Rate' },
  ];

  return (
    <div className="min-h-screen flex bg-[#0f172a]">
      {/* Left Panel - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#1e293b]">
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-cyan/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-cyan/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-cyan/5 rounded-full" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan flex items-center justify-center shadow-cyan">
              <TrendingUp className="w-7 h-7 text-[#0f172a]" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              Market<span className="text-cyan">AI</span>
            </span>
          </motion.div>
          
          {/* Hero Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                AI-Powered
                <br />
                <span className="gradient-text text-glow">Stock Market</span>
                <br />
                Intelligence
              </h1>
              <p className="mt-6 text-lg text-slate-400 max-w-md">
                Predict. Analyze. Profit. Your intelligent companion for NSE/BSE stock market analysis with multi-timeframe AI predictions.
              </p>
            </motion.div>
            
            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 gap-4"
            >
              {features.map((feature, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3 p-4 rounded-xl bg-[#334155]/50 border border-[#475569]/50 hover:border-cyan/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-cyan" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{feature.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
            
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center gap-8"
            >
              {stats.map((stat, idx) => (
                <div key={idx}>
                  <p className="text-3xl font-bold text-cyan text-glow">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
          
          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex items-center gap-2 text-slate-500 text-sm"
          >
            <Zap className="w-4 h-4 text-cyan" />
            <span>Powered by Machine Learning • NSE/BSE Data</span>
          </motion.div>
        </div>
      </div>
      
      {/* Right Panel - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-[#0f172a]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-cyan flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#0f172a]" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Market<span className="text-cyan">AI</span>
            </span>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#1e293b] mb-6 p-1 rounded-xl border border-[#334155]">
              <TabsTrigger 
                value="login" 
                className="rounded-lg font-semibold text-slate-400 data-[state=active]:bg-cyan data-[state=active]:text-[#0f172a]"
                data-testid="login-tab"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="rounded-lg font-semibold text-slate-400 data-[state=active]:bg-cyan data-[state=active]:text-[#0f172a]"
                data-testid="register-tab"
              >
                Register
              </TabsTrigger>
            </TabsList>
            
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <TabsContent value="login">
              <Card className="border-[#334155] bg-[#1e293b]">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
                  <CardDescription className="text-slate-400">
                    Enter your credentials to access your portfolio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium text-slate-300">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                        className="h-11 bg-[#334155] border-[#475569] text-white placeholder:text-slate-500 focus:border-cyan focus:ring-cyan/20"
                        data-testid="login-email-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-sm font-medium text-slate-300">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        className="h-11 bg-[#334155] border-[#475569] text-white placeholder:text-slate-500 focus:border-cyan focus:ring-cyan/20"
                        data-testid="login-password-input"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-cyan hover:bg-cyan-light text-[#0f172a] font-semibold shadow-cyan hover:shadow-cyan-lg transition-all"
                      disabled={isLoading}
                      data-testid="login-submit-btn"
                    >
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card className="border-[#334155] bg-[#1e293b]">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
                  <CardDescription className="text-slate-400">
                    Start your AI-powered trading journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-sm font-medium text-slate-300">Full Name</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="John Doe"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        required
                        className="h-11 bg-[#334155] border-[#475569] text-white placeholder:text-slate-500 focus:border-cyan focus:ring-cyan/20"
                        data-testid="register-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-sm font-medium text-slate-300">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                        className="h-11 bg-[#334155] border-[#475569] text-white placeholder:text-slate-500 focus:border-cyan focus:ring-cyan/20"
                        data-testid="register-email-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-sm font-medium text-slate-300">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        className="h-11 bg-[#334155] border-[#475569] text-white placeholder:text-slate-500 focus:border-cyan focus:ring-cyan/20"
                        data-testid="register-password-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm" className="text-sm font-medium text-slate-300">Confirm Password</Label>
                      <Input
                        id="register-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        required
                        className="h-11 bg-[#334155] border-[#475569] text-white placeholder:text-slate-500 focus:border-cyan focus:ring-cyan/20"
                        data-testid="register-confirm-input"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-cyan hover:bg-cyan-light text-[#0f172a] font-semibold shadow-cyan hover:shadow-cyan-lg transition-all"
                      disabled={isLoading}
                      data-testid="register-submit-btn"
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <p className="mt-6 text-center text-sm text-slate-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
