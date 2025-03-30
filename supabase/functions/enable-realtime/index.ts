
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Enable realtime for tables
    const { error: todoError } = await supabaseClient.rpc('graphql.enable_realtime_publication', {
      name: 'todo_items',
      enable: true,
    })

    if (todoError) {
      throw todoError
    }

    const { error: eventsError } = await supabaseClient.rpc('graphql.enable_realtime_publication', {
      name: 'events',
      enable: true,
    })

    if (eventsError) {
      throw eventsError
    }

    return new Response(
      JSON.stringify({ message: 'Realtime enabled successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
