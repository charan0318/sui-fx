import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { Copy, Terminal, Zap, Code, ArrowLeft, Droplets, Shield, HelpCircle, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoFm from "@/components/background/logo_fm.png";
import suiFxVideo from "@/components/background/sui_fx_center.mp4";

export default function Docs() {
  const { toast } = useToast();

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "⚡ Copied!",
      description: "Code copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Video Background */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-100"
        >
          <source src={suiFxVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Navigation */}
      <NavBar items={navItems} />

      {/* Main Content */}
      <div className="relative z-10 pt-16">
        {/* Status Indicator */}
        <div className="fixed top-6 right-6 z-50">
          <Badge variant="outline" className="border-green-500/50 text-green-400 bg-black/20 backdrop-blur-sm">
            {stats?.success ? 'Online' : 'Loading...'}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            {/* Back Link */}
            <div className="mb-6">
              <a 
                href="/" 
                className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors font-inter"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </a>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight font-space-grotesk mb-4">
              <span className="bg-gradient-to-r from-white via-blue-300 to-purple-300 bg-clip-text text-transparent">
                API
              </span>
              <br />
              <span className="text-gray-200">Documentation</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto font-inter">
              Simple REST API for requesting SUI testnet tokens
            </p>
          </motion.div>

          {/* Main Content Grid */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Quick Start */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="group"
            >
              <div className="bg-black/30 border-gray-700/50 backdrop-blur-xl hover:bg-black/40 transition-all duration-300 relative z-10 rounded-2xl border p-8 h-full">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold ml-4 text-white font-space-grotesk">
                    Quick Start
                  </h2>
                </div>
                <p className="text-gray-300 font-inter mb-6">
                  Get SUI testnet tokens with a simple HTTP request
                </p>
                <div className="space-y-4">
                  <div className="bg-black/40 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400 font-mono">POST Request</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(`curl -X POST "/api/v1/faucet/request" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"address":"0x1234..."}'`)}
                        className="p-1 h-8 w-8 hover:bg-blue-500/20"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                    <pre className="text-sm text-green-400 font-mono overflow-x-auto">
                      <code>{`curl -X POST "/api/v1/faucet/request" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"address":"0x1234..."}'`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Response Format */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="group"
            >
              <div className="bg-black/30 border-gray-700/50 backdrop-blur-xl hover:bg-black/40 transition-all duration-300 relative z-10 rounded-2xl border p-8 h-full">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
                    <Code className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold ml-4 text-white font-space-grotesk">
                    Response
                  </h2>
                </div>
                <p className="text-gray-300 font-inter mb-6">
                  JSON response with transaction details
                </p>
                <div className="bg-black/40 rounded-xl p-4 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400 font-mono">Success Response</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(`{
  "success": true,
  "message": "SUI sent successfully",
  "data": {
    "transactionId": "0xabc123...",
    "amount": "1000000",
    "recipient": "0x1234..."
  }
}`)}
                      className="p-1 h-8 w-8 hover:bg-cyan-500/20"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>
                  <pre className="text-sm text-cyan-400 font-mono overflow-x-auto">
                    <code>{`{
  "success": true,
  "message": "SUI sent successfully",
  "data": {
    "transactionId": "0xabc123...",
    "amount": "1000000",
    "recipient": "0x1234..."
  }
}`}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          </div>

          {/* API Endpoints */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="max-w-4xl mx-auto mb-16"
          >
            <div className="bg-black/30 border-gray-700/50 backdrop-blur-xl hover:bg-black/40 transition-all duration-300 relative z-10 rounded-2xl border p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                  <Terminal className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold ml-4 text-white font-space-grotesk">
                  Available Endpoints
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Faucet Request */}
                <div className="bg-black/40 rounded-xl p-6 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white font-space-grotesk">Request Tokens</h3>
                      <span className="text-sm text-green-400 font-mono">POST /api/v1/faucet/request</span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm font-inter mb-4">Request SUI tokens for a wallet address</p>
                  <div className="text-xs text-gray-400 font-inter">
                    <p>• Requires API key</p>
                    <p>• Rate limited per address</p>
                    <p>• Returns transaction ID</p>
                  </div>
                </div>

                {/* Faucet Status */}
                <div className="bg-black/40 rounded-xl p-6 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white font-space-grotesk">Faucet Status</h3>
                      <span className="text-sm text-blue-400 font-mono">GET /api/v1/faucet/status</span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm font-inter mb-4">Check faucet balance and operational status</p>
                  <div className="text-xs text-gray-400 font-inter">
                    <p>• No authentication required</p>
                    <p>• Returns current balance</p>
                    <p>• Shows rate limits</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
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