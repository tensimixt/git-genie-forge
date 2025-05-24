import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Add debug logging for Supabase client creation
console.log('Creating Supabase client with persistSession: true');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'git-genie-auth-token',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    debug: true // Enable debug mode for auth
  }
});

// Add a function to check and log the current auth state
export const logAuthState = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    if (data && data.session) {
      console.log('Session found:', {
        user_id: data.session.user?.id,
        expires_at: data.session.expires_at,
        has_access_token: !!data.session.access_token,
        has_provider_token: !!data.session.provider_token,
        has_refresh_token: !!data.session.refresh_token
      });
      return data.session;
    } else {
      console.log('No active session found');
      return null;
    }
  } catch (err) {
    console.error('Exception checking auth state:', err);
    return null;
  }
};

// Add a function to debug function calls
export const debugFunctionCall = async (functionName, body) => {
  try {
    console.log(`Preparing to call function: ${functionName}`);
    
    // Get current session for debugging
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Current session state:', {
      has_session: !!sessionData?.session,
      has_access_token: !!sessionData?.session?.access_token,
      user_id: sessionData?.session?.user?.id
    });
    
    // Make the function call with extra logging
    console.log(`Calling function ${functionName} with body:`, body);
    const result = await supabase.functions.invoke(functionName, { body });
    
    if (result.error) {
      console.error(`Function ${functionName} error:`, result.error);
    } else {
      console.log(`Function ${functionName} success:`, {
        data_received: !!result.data,
        data_type: result.data ? typeof result.data : 'none'
      });
    }
    
    return result;
  } catch (err) {
    console.error(`Exception in function ${functionName} call:`, err);
    throw err;
  }
};
