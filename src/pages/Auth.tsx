
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import AnimatedLogo from '@/components/auth/AnimatedLogo';
import AnimatedBackground from '@/components/auth/AnimatedBackground';
import TimeManagementVisual from '@/components/auth/TimeManagementVisual';
import FeatureHighlight from '@/components/auth/FeatureHighlight';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [session, setSession] = useState<Session | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session) {
          setTimeout(() => {
            navigate('/');
          }, 0);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate('/');
      }
    });

    // Add the CSS animation for floating elements
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes floatComplex {
        0% { transform: translate(-50%, -50%) rotate(0deg) translate(0, 0); }
        25% { transform: translate(-50%, -50%) rotate(3deg) translate(30px, 20px); }
        50% { transform: translate(-50%, -50%) rotate(-2deg) translate(20px, -30px); }
        75% { transform: translate(-50%, -50%) rotate(1deg) translate(-20px, -10px); }
        100% { transform: translate(-50%, -50%) rotate(0deg) translate(0, 0); }
      }
      
      @keyframes floatLogo {
        0% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(2deg); }
        100% { transform: translateY(0) rotate(0deg); }
      }
      
      @keyframes glow {
        0% { opacity: 0.3; transform: scale(0.9); }
        100% { opacity: 0.7; transform: scale(1.1); }
      }
      
      @keyframes pulse {
        0% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.8); }
        100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.2); }
      }
      
      @keyframes orbit {
        0% { transform: rotate(0deg) translateX(100px) rotate(0deg); }
        100% { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
      }
      
      .glass-card {
        background: rgba(30, 20, 60, 0.2);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.18);
        transition: all 0.3s ease;
      }
      
      .glass-card:hover {
        background: rgba(30, 20, 60, 0.3);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.47);
      }
      
      .perspective-1000 {
        perspective: 1000px;
      }
      
      .shimmer {
        background: linear-gradient(
          to right,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.2) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
      }
      
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      subscription.unsubscribe();
      document.head.removeChild(style);
    };
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        toast({
          title: "Success!",
          description: "You've successfully signed in.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Check your email to confirm your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-background">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Time Management Visuals */}
      <TimeManagementVisual />
      
      {/* Main Content */}
      <div className="flex flex-col md:flex-row w-full relative z-10">
        {/* Left Section - Branding and Logo */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
          {/* Centered Logo */}
          <div className="w-full max-w-md mx-auto text-center">
            <AnimatedLogo className="w-72 h-72 mx-auto mb-6" />
            
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-indigo-300 to-purple-200 mb-4 tracking-tight">
              Malleabite
            </h1>
            
            <div className="relative mb-8">
              <p className="text-xl text-white/90 font-light">
                Malleable Integrated Time-management Environment
              </p>
              <div className="absolute inset-0 shimmer"></div>
            </div>
            
            <p className="text-white/70 max-w-md mx-auto mb-12 leading-relaxed">
              Shape your time, shape your life. The ultimate adaptable solution for 
              modern time management with AI-powered insights.
            </p>
            
            {/* Feature highlights (visible on larger screens) */}
            <div className="hidden md:block">
              <FeatureHighlight />
            </div>
          </div>
        </div>
        
        {/* Right Section - Auth Form */}
        <div className="w-full md:w-2/5 xl:w-1/3 flex items-center justify-center p-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-background border-l border-purple-500/20 backdrop-blur-xl md:block hidden" />
          
          <Card className="w-full max-w-md overflow-hidden glass-card border-white/10 relative">
            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-purple-500/30 animate-pulse opacity-70" />
            </div>
            
            <CardHeader className="text-center relative z-10">
              <CardTitle className="text-2xl font-bold text-white mb-2">
                {mode === 'signin' ? 'Welcome Back' : 'Join Malleabite'}
              </CardTitle>
              <CardDescription className="text-white/70">
                {mode === 'signin' 
                  ? 'Sign in to continue your productivity journey' 
                  : 'Create an account to start organizing your time'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative z-10">
              <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60 group-hover:text-primary transition-colors" />
                    <Input 
                      id="email"
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60 group-hover:text-primary transition-colors" />
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 transition-all"
                    />
                    <button 
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-3 text-white/60 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full relative overflow-hidden group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2 transition-all duration-300"
                  disabled={loading}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                    {!loading && (
                      mode === 'signin' ? 
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /> : 
                        <Sparkles className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    )}
                  </span>
                  <span className="absolute inset-0 w-full scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 bg-gradient-to-r from-indigo-700 to-purple-700"></span>
                </Button>
                
                <div className="text-center pt-4">
                  {mode === 'signin' ? (
                    <p className="text-white/70">
                      Don't have an account?{' '}
                      <button 
                        onClick={() => setMode('signup')}
                        className="text-primary hover:text-primary/80 hover:underline font-medium"
                        type="button"
                      >
                        Create one
                      </button>
                    </p>
                  ) : (
                    <p className="text-white/70">
                      Already have an account?{' '}
                      <button 
                        onClick={() => setMode('signin')}
                        className="text-primary hover:text-primary/80 hover:underline font-medium"
                        type="button"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
