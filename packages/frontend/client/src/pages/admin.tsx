import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShieldCheck, LogIn, LogOut, Server, Wallet, BarChart3, ExternalLink, Book, HelpCircle, Activity, Shield, Droplets, ArrowLeft, Eye, EyeOff } from "lucide-react";
import logoFm from "@/components/background/logo_fm.png";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem('adminSession'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!sessionId);
  
  // Simple form state instead of React Hook Form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Get system stats
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000,
  });

const navItems = [
    { name: 'Home', url: '/', icon: ArrowLeft },
    { name: 'Faucet', url: '/faucet', icon: Droplets },
    { name: 'APIs', url: '/api-clients', icon: Shield },
    { name: 'FAQ', url: '/faq', icon: HelpCircle },
    { name: 'Status', url: '/status', icon: Activity }
  ];

  // Simple login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoggingIn(true);
    
    try {
      const data = await apiRequest('POST', '/api/v1/admin/login', { username, password });
      setSessionId(data.data.token);
      setIsAuthenticated(true);
      localStorage.setItem('adminSession', data.data.token);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${username}!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (sessionId) {
        await apiRequest("POST", "/api/admin/logout", {});
      }
    },
    onSuccess: () => {
      setSessionId(null);
      setIsAuthenticated(false);
      localStorage.removeItem('adminSession');
      queryClient.clear();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    },
  });

  // Dashboard data query
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    enabled: isAuthenticated && !!sessionId,
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/v1/admin/dashboard', undefined, sessionId || undefined);
      } catch (error: any) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          setIsAuthenticated(false);
          setSessionId(null);
          localStorage.removeItem('adminSession');
        }
        throw error;
      }
    },
    refetchInterval: 30000,
  });

  const handleSubmit = handleLogin;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
        {/* Simple background without video */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 pt-16 flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full mx-4">
          <div className="bg-gray-800/90 border border-gray-700 backdrop-blur-sm shadow-2xl rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">Admin Login</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 block mb-2">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 h-12 px-4 rounded-md"
                    placeholder="Enter username"
                    autoComplete="username"
                    required
                    style={{
                      outline: 'none'
                    }}
                  />
                </div>
                <div className="relative">
                  <label className="text-gray-300 block mb-2">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 h-12 px-4 pr-12 rounded-md"
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                    style={{
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-10 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 h-12 font-semibold rounded-md flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <LogIn className="w-5 h-5" />
                  <span>{isLoggingIn ? "Logging in..." : "Login"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        </div>

        {/* Navigation */}
        <NavBar items={navItems} />

        {/* Main Content */}
        <div className="relative z-10 pt-16 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Navigation */}
      <NavBar items={navItems} />

      {/* Main Content */}
      <div className="relative z-20 pt-16">
        {/* Status Indicator */}
        <div className="fixed top-6 right-6 z-50">
          <Badge variant="outline" className="border-green-500/50 text-green-400 bg-black/20 backdrop-blur-sm">
            {stats?.success ? 'Online' : 'Loading...'}
          </Badge>
        </div>

        {/* Header */}
        <div className="container mx-auto px-6 py-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <h1 className="text-3xl font-bold font-space-grotesk bg-gradient-to-r from-white via-blue-300 to-purple-300 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-black/20 backdrop-blur-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </motion.div>
        </div>

      <div className="container mx-auto px-6 py-8">
        {dashboardData?.success && (
          <>
            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="glass-morphism border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-300">System Status</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-400">Healthy</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime:</span>
                      <span className="text-white">{Math.floor(dashboardData.data.system.uptime / 3600)}h {Math.floor((dashboardData.data.system.uptime % 3600) / 60)}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-white">{dashboardData.data.system.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-300">Wallet Info</h4>
                    <Wallet className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Balance:</span>
                      <span className="text-white font-semibold">{dashboardData.data.faucet.balance.sui} SUI</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Network:</span>
                      <Badge variant="default">
                        {dashboardData.data.faucet.network}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-300">Statistics</h4>
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Success Rate:</span>
                      <span className="text-green-400 font-semibold">{dashboardData.data.stats.database.successRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Requests:</span>
                      <span className="text-white">{dashboardData.data.stats.database.totalTransactions}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card className="glass-morphism border-gray-700 mb-8">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">{dashboardData.data.stats.database.successRate}</div>
                    <div className="text-sm text-gray-400">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2">{dashboardData.data.stats.database.totalTransactions}</div>
                    <div className="text-sm text-gray-400">Total Transactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-2">{dashboardData.data.stats.database.totalAmountDistributed.sui}</div>
                    <div className="text-sm text-gray-400">SUI Distributed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuration Info */}
            <Card className="glass-morphism border-gray-700">
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold text-gray-300 mb-3">Faucet Settings</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Default Amount:</span>
                        <span className="text-white">{dashboardData.data.config.defaultAmount.sui} SUI</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Max Amount:</span>
                        <span className="text-white">{dashboardData.data.config.maxAmount.sui} SUI</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-300 mb-3">Rate Limits</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Per Wallet:</span>
                        <span className="text-white">{dashboardData.data.config.rateLimits.maxPerWallet}/hour</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Per IP:</span>
                        <span className="text-white">{dashboardData.data.config.rateLimits.maxPerIP}/hour</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        
        {/* Debug info - remove in production */}
        {!dashboardData && (
          <div className="text-center text-gray-400 mt-8">
            <p>Loading dashboard data...</p>
          </div>
        )}
        
        {dashboardData && !dashboardData.success && (
          <div className="text-center text-red-400 mt-8">
            <p>Error loading dashboard data</p>
            <pre className="text-xs mt-2 text-left bg-gray-800 p-4 rounded overflow-auto">
              {JSON.stringify(dashboardData, null, 2)}
            </pre>
          </div>
        )}
      </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="container mx-auto px-8 py-8 flex items-center justify-between"
        >
          <img 
            src={logoFm} 
            alt="FM Logo" 
            className="w-12 h-12 opacity-80"
          />
          <p className="text-gray-400 font-inter text-sm flex-1 text-center">
            Built with 🤍 from ch04niverse
          </p>
          <a 
            href="https://docs.sui.io/guides/developer/getting-started/connect"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-black/20 border border-white/10 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-black/30 transition-all duration-300 text-sm font-inter"
          >
            Build with Sui
          </a>
        </motion.div>
      </div>
    </div>
  );
}