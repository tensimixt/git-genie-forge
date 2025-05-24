import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  github_id: string | null;
  username: string | null;
  avatar_url: string | null;
  github_access_token: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  sessionFullyRestored: boolean;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionFullyRestored, setSessionFullyRestored] = useState(false);
  const { toast } = useToast();

  // This effect ensures loading state is reset after a timeout
  // even if session restoration fails
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log('Forcing loading state to false after timeout');
        setLoading(false);
      }
    }, 3000); // 3 second timeout
    
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('Session data:', data ? 'Found' : 'Not found');
        
        if (data && data.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          if (data.session.user) {
            await fetchUserProfile(data.session.user.id);
          }
        }
        
        setLoading(false);
        // Mark session as fully restored
        setSessionFullyRestored(true);
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setLoading(false);
          setSessionFullyRestored(true); // Even on error, we've completed the restoration attempt
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.email);
        
        if (!mounted) return;
        
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          if (event === 'SIGNED_IN') {
            await createOrUpdateProfile(newSession.user, newSession);
            await fetchUserProfile(newSession.user.id);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
        setSessionFullyRestored(true);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const createOrUpdateProfile = async (user: User, session: Session) => {
    try {
      const githubData = user.user_metadata;
      const providerToken = session.provider_token;

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          github_id: githubData.user_name || githubData.preferred_username,
          username: githubData.user_name || githubData.preferred_username,
          avatar_url: githubData.avatar_url,
          github_access_token: providerToken, // Store securely
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error upserting profile:', error);
      }
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
    }
  };

  const signInWithGitHub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'repo read:user',
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with GitHub:', error);
      toast({
        title: "Authentication Failed",
        description: "Failed to sign in with GitHub. Please try again.",
        variant: "destructive",
      });
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    sessionFullyRestored,
    signInWithGitHub,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
