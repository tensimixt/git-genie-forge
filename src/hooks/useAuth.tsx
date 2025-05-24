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
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  // Handle session initialization and auth state changes
  useEffect(() => {
    let mounted = true;
    
    async function getSession() {
      try {
        setLoading(true);
        
        // Get the current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        const currentSession = data.session;
        console.log('Current session:', currentSession ? 'Found' : 'Not found');
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            await fetchUserProfile(currentSession.user.id);
          }
          
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Unexpected error in getSession:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }
    
    getSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email);
        
        if (mounted) {
          setLoading(true);
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
            await createOrUpdateProfile(currentSession.user, currentSession);
            await fetchUserProfile(currentSession.user.id);
          } else if (!currentSession) {
            setProfile(null);
          }
          
          setLoading(false);
        }
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
          redirectTo: `${window.location.origin}${window.location.pathname}`
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
