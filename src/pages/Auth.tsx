
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
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
      @keyframes float {
        0% { transform: translate(-50%, -50%) rotate(0deg) translate(0, 0); }
        25% { transform: translate(-50%, -50%) rotate(2deg) translate(20px, 20px); }
        50% { transform: translate(-50%, -50%) rotate(0deg) translate(40px, 0px); }
        75% { transform: translate(-50%, -50%) rotate(-2deg) translate(20px, -20px); }
        100% { transform: translate(-50%, -50%) rotate(0deg) translate(0, 0); }
      }
      
      @keyframes gentle-rotate {
        0% { transform: rotate(0deg); }
        50% { transform: rotate(5deg); }
        100% { transform: rotate(0deg); }
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
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Time Management Visuals */}
      <TimeManagementVisual />
      
      {/* Left Section - Branding and Features (hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 p-8 flex-col justify-between relative z-10">
        <div className="flex-1 flex flex-col justify-center items-center">
          {/* Logo Animation in Center */}
          <div className="mb-12">
            <AnimatedLogo className="w-64 h-64 mx-auto" />
          </div>
          
          {/* Tagline */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Malleabite</h1>
            <p className="text-xl text-white/80">
              Malleable Integrated Time-management Environment
            </p>
            <p className="mt-4 text-white/60 max-w-md mx-auto">
              Shape your time, shape your life. The adaptable solution for modern time management.
            </p>
          </div>
          
          {/* Feature Highlights */}
          <FeatureHighlight />
        </div>
      </div>
      
      {/* Right Section - Auth Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 relative z-10">
        <Card className="w-full max-w-md glass-card backdrop-blur-xl bg-white/10 border-white/20">
          <CardHeader className="text-center">
            {/* Show logo on mobile only */}
            <div className="md:hidden mb-6">
              <AnimatedLogo className="w-32 h-32 mx-auto" />
              <h1 className="text-2xl font-bold text-white mb-2">Malleabite</h1>
              <p className="text-white/60 text-sm">Malleable Integrated Time-management Environment</p>
            </div>

            <CardTitle className="text-2xl font-bold text-white">
              {mode === 'signin' ? 'Welcome Back' : 'Join Malleabite'}
            </CardTitle>
            <CardDescription className="text-white/70">
              {mode === 'signin' 
                ? 'Sign in to continue your productivity journey' 
                : 'Create an account to start organizing your time'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                  <Input 
                    id="email"
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                  <button 
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-3 text-white/60 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-2"
                disabled={loading}
              >
                {loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
              
              <div className="text-center pt-4">
                {mode === 'signin' ? (
                  <p className="text-white/70">
                    Don't have an account?{' '}
                    <button 
                      onClick={() => setMode('signup')}
                      className="text-primary hover:text-primary/80 hover:underline"
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
                      className="text-primary hover:text-primary/80 hover:underline"
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
  );
};

export default Auth;
