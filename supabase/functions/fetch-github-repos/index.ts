
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header passed from the client
    const authHeader = req.headers.get('Authorization')!
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: authHeader } 
        } 
      }
    )

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user profile to access GitHub token
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('github_access_token, username')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.github_access_token) {
      throw new Error('GitHub access token not found')
    }

    const { searchQuery } = await req.json()

    // Determine the API endpoint
    let url: string
    if (searchQuery) {
      // Search repositories globally
      url = `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=30`
    } else {
      // Get user's repositories
      url = 'https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator'
    }

    console.log('Fetching from:', url)

    // Make request to GitHub API
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${profile.github_access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Git-Genie-App'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GitHub API error:', response.status, errorText)
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Handle both user repos and search results format
    const repositories = searchQuery ? data.items : data

    console.log(`Found ${repositories?.length} repositories`)

    return new Response(
      JSON.stringify({ repositories }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error fetching GitHub repositories:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})
