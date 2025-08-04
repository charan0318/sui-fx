import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Key, 
  Code, 
  Copy, 
  CheckCircle, 
  ExternalLink, 
  BarChart3,
  Globe,
  Sparkles,
  Rocket,
  Shield,
  Book,
  HelpCircle,
  Activity,
  Droplets,
  ArrowLeft,
  AlertTriangle,
  Zap
} from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import logoFm from "@/components/background/logo_fm.png";
import suiFxVideo from "@/components/background/sui_fx_center.mp4";

const clientRegistrationSchema = z.object({
  name: z.string().min(1, "Application name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  homepage_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  callback_url: z.string().url("Invalid URL").optional().or(z.literal(""))
});

type ClientRegistrationForm = z.infer<typeof clientRegistrationSchema>;

export default function ApiClients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Get system stats for status indicator
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/v1/metrics"],
    refetchInterval: 30000,
  });

  const navItems = [
    { name: 'Home', url: '/', icon: ArrowLeft },
    { name: 'Faucet', url: '/faucet', icon: Droplets },
    { name: 'APIs', url: '/api-clients', icon: Key },
    { name: 'FAQ', url: '/faq', icon: HelpCircle },
    { name: 'Status', url: '/status', icon: Activity }
  ];

  const form = useForm<ClientRegistrationForm>({
    resolver: zodResolver(clientRegistrationSchema),
    defaultValues: {
      name: "",
      description: "",
      homepage_url: "",
      callback_url: "",
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: ClientRegistrationForm) => {
      console.log('Attempting to register API client:', data);
      const response = await apiRequest("POST", "/api/v1/clients/register", data);
      console.log('API response:', response);
      return response;
    },
    onSuccess: (response) => {
      console.log('Registration successful - Full response:', response);
      
      // More robust data extraction with detailed logging
      let clientData;
      
      if (response && typeof response === 'object') {
        if (response.success === true && response.data) {
          console.log('Using response.data:', response.data);
          clientData = response.data;
        } else if (response.client_id && response.api_key) {
          console.log('Using direct response:', response);
          clientData = response;
        } else if (response.data && response.data.client_id) {
          console.log('Using nested data:', response.data);
          clientData = response.data;
        } else {
          console.error('Unexpected response format. Response keys:', Object.keys(response));
          console.error('Full response:', JSON.stringify(response, null, 2));
          // Fallback - try to extract any available data
          clientData = response.data || response;
        }
      } else {
        console.error('Invalid response type:', typeof response, response);
        clientData = {};
      }
      
      console.log('Final clientData:', clientData);
      
      // Validate we have the required fields
      if (!clientData.client_id || !clientData.api_key) {
        console.error('Missing required fields:', {
          hasClientId: !!clientData.client_id,
          hasApiKey: !!clientData.api_key,
          clientData
        });
        
        toast({
          title: "Registration Issue",
          description: "API client was created but response data is incomplete. Please check the browser console.",
          variant: "destructive",
        });
        return;
      }
      
      setRegistrationResult(clientData);
      setShowSuccessModal(true);
      form.reset();
      toast({
        title: "Application Registered!",
        description: "Your API client has been successfully created.",
      });
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register application",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    });
  };

  const onSubmit = (data: ClientRegistrationForm) => {
    registerMutation.mutate(data);
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
      <div className="relative z-20 pt-16">
        {/* Status Indicator */}
        <div className="fixed top-6 right-6 z-50">
          <Badge variant="outline" className="border-green-500/50 text-green-400 bg-black/20 backdrop-blur-sm">
            {stats?.success ? 'Online' : 'Loading...'}
          </Badge>
        </div>

        {/* Hero Section with Two Column Layout */}
        <div className="container mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[80vh]">

            {/* Left Column - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-10 order-1 lg:order-1 text-left"
            >
              {/* Main Headline */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight font-space-grotesk leading-none">
                  <span className="bg-gradient-to-r from-white via-blue-300 to-purple-300 bg-clip-text text-transparent">
                    API
                  </span>
                </h1>
                <p className="text-3xl md:text-4xl text-gray-300 font-space-grotesk tracking-wide">
                  CLIENT REGISTRATION
                </p>
              </motion.div>

              {/* Enhanced Description */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-6 max-w-2xl"
              >
                <p className="text-xl text-gray-300 leading-relaxed font-inter">
                  Register your application to get dedicated API keys, track usage analytics, and integrate seamlessly with SUI-FX faucet services.
                </p>
              </motion.div>

              {/* Feature Points */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-lg text-gray-300 font-inter">Dedicated API keys with custom rate limits</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-lg text-gray-300 font-inter">Real-time usage analytics and monitoring</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-lg text-gray-300 font-inter">Production-ready integration support</span>
                </div>
              </motion.div>

              {/* View Docs Button */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="pt-4"
              >
                <button
                  onClick={() => window.open('/docs', '_blank')}
                  className="bg-black/80 backdrop-blur-sm w-full h-14 no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-base font-semibold leading-6 text-white inline-block hover:bg-gray-900/80 transition-all duration-300"
                >
                  <span className="absolute inset-0 overflow-hidden rounded-full">
                    <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </span>
                  <div className="relative flex justify-center w-full text-center space-x-2 h-full items-center z-10 rounded-full bg-black/90 py-0.5 px-4 ring-1 ring-white/10">
                    <span className="flex items-center space-x-3">
                      <Book className="w-6 h-6 text-blue-400" />
                      <span className="text-lg font-space-grotesk bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-300 to-purple-300">
                        VIEW API DOCUMENTATION
                      </span>
                    </span>
                  </div>
                </button>
              </motion.div>

              
            </motion.div>

            {/* Right Column - Registration Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="order-2 lg:order-2 lg:-ml-16"
            >
            <div className="relative">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={2}
                className="rounded-xl"
              />
              <Card className="bg-black/60 border-white/20 backdrop-blur-xl shadow-2xl relative z-30">
              <CardHeader className="text-center pb-8">
                <div className="flex items-center justify-center mb-4">
                  <Rocket className="w-8 h-8 text-blue-400 mr-3" />
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Register Your Application
                  </CardTitle>
                </div>
                <p className="text-gray-400 font-inter">Get started with dedicated API keys in minutes</p>
              </CardHeader>
              <CardContent className="space-y-8 relative z-40">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-50">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300 font-semibold flex items-center">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Application Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-black/50 border-gray-500 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 h-12 relative z-10 font-medium"
                              placeholder="My Awesome DApp"
                              disabled={registerMutation.isPending}
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300 font-semibold flex items-center">
                            <Code className="w-4 h-4 mr-2" />
                            Description
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              className="bg-black/50 border-gray-500 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 min-h-[100px] resize-none relative z-10 font-medium"
                              placeholder="Describe what your application does..."
                              disabled={registerMutation.isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="homepage_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 font-semibold flex items-center">
                              <Globe className="w-4 h-4 mr-2" />
                              Homepage URL
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="bg-black/50 border-gray-500 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 h-12 relative z-10 font-medium"
                                placeholder="https://myapp.com"
                                disabled={registerMutation.isPending}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="callback_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 font-semibold flex items-center">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Callback URL
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="bg-black/50 border-gray-500 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 h-12 relative z-10 font-medium"
                                placeholder="https://myapp.com/callback"
                                disabled={registerMutation.isPending}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="relative w-full">
                      <GlowingEffect 
                        blur={15}
                        spread={30}
                        variant="default"
                        glow={true}
                        className="w-full h-14 rounded-full"
                        disabled={registerMutation.isPending}
                      />
                      <button 
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="bg-black/80 backdrop-blur-sm w-full h-14 no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-base font-semibold leading-6 text-white inline-block hover:bg-gray-900/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="absolute inset-0 overflow-hidden rounded-full">
                          <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        </span>
                        <div className="relative flex justify-center w-full text-center space-x-2 h-full items-center z-10 rounded-full bg-black/90 py-0.5 px-4 ring-1 ring-white/10">
                          <span className="flex items-center space-x-3">
                            <Rocket className="w-6 h-6 text-blue-400" />
                            <span className="text-lg font-space-grotesk bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-300 to-purple-300">
                              {registerMutation.isPending ? "REGISTERING..." : "REGISTER APPLICATION"}
                            </span>
                          </span>
                        </div>
                      </button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
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

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-black/90 border-green-500/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
              Application Registered Successfully!
            </DialogTitle>
          </DialogHeader>

          {registrationResult && (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <span className="font-semibold text-green-400">Registration Successful!</span>
                </div>
                <p className="text-sm text-green-300">
                  Your application "{registrationResult.name}" has been registered successfully.
                </p>
              </div>

              {/* Client ID */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-300 flex items-center">
                    <Key className="w-4 h-4 mr-2" />
                    Client ID
                  </label>
                  <p className="text-xs text-gray-400 mt-1">
                    Unique identifier for your application. Use this to identify your app in API requests.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    readOnly
                    value={registrationResult?.client_id || 'Loading...'}
                    className="bg-gray-800/50 border-gray-600 text-white font-mono text-sm"
                  />
                  <Button
                    onClick={() => copyToClipboard(registrationResult.client_id, "Client ID")}
                    className="bg-blue-600 hover:bg-blue-500 px-3"
                    disabled={!registrationResult.client_id}
                  >
                    {copiedField === "Client ID" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* API Key Warning */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400 mr-2" />
                  <span className="font-semibold text-orange-400">Save Your API Key Now!</span>
                </div>
                <p className="text-sm text-orange-300 mb-2">
                  This is your secret API key for authentication. It will only be shown once!
                </p>
                <p className="text-xs text-orange-400 mb-4">
                  Use this key in the "X-API-Key" header for all API requests to the SUI-FX faucet.
                </p>
                <div className="flex items-center space-x-2">
                  <Input
                    readOnly
                    value={registrationResult.api_key || 'Loading...'}
                    className="bg-orange-900/20 border-orange-500/30 text-white font-mono text-sm"
                  />
                  <Button
                    onClick={() => copyToClipboard(registrationResult.api_key, "API Key")}
                    className="bg-orange-600 hover:bg-orange-500 px-3"
                    disabled={!registrationResult.api_key}
                  >
                    {copiedField === "API Key" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Quick Integration Example */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-300 flex items-center">
                    <Code className="w-4 h-4 mr-2" />
                    Quick Integration Example
                  </label>
                  <p className="text-xs text-gray-400 mt-1">
                    Use this curl command to test your API key with the SUI-FX faucet.
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <pre className="text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
                    <code>{`curl -X POST "http://localhost:3003/api/v1/faucet/request" \\
  -H "X-API-Key: ${registrationResult.api_key || 'your-api-key'}" \\
  -H "Content-Type: application/json" \\
  -d '{"address": "0x64char_hex_wallet_address"}'`}</code>
                  </pre>
                  <Button
                    onClick={() => copyToClipboard(`curl -X POST "http://localhost:3003/api/v1/faucet/request" \\
  -H "X-API-Key: ${registrationResult.api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{"address": "0x64char_hex_wallet_address"}'`, "Integration Code")}
                    className="mt-3 bg-gray-700 hover:bg-gray-600 text-xs px-3 py-2"
                    disabled={!registrationResult.api_key}
                  >
                    {copiedField === "Integration Code" ? <CheckCircle className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    Copy Code
                  </Button>
                </div>
              </div>

              <div className="flex space-x-3 pt-6 border-t border-gray-700">
                <Button
                  onClick={() => window.open('/docs', '_blank')}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3"
                >
                  <Book className="w-4 h-4 mr-2" />
                  View Documentation
                </Button>
                <Button
                  onClick={() => setShowSuccessModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white font-semibold py-3"
                >
                  I've Saved My Keys
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
    </div>
  );
}