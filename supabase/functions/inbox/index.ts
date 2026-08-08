import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { company_id } = await req.json();
    if (!company_id) throw new Error('company_id is required');

    // Service role client — bypasses RLS so an employer can read every
    // job seeker's conversation for their company and resolve real emails
    // from auth.users (neither of which the anon client is allowed to do).
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Active conversations for this company, newest first
    const { data: convs, error: convErr } = await supabase
      .from('conversations')
      .select('id, user_id, created_at')
      .eq('company_id', company_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (convErr) throw convErr;

    if (!convs || convs.length === 0) {
      return new Response(JSON.stringify({ conversations: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Last message for each conversation
    const rows = await Promise.all(
      convs.map(async (conv) => {
        const { data: msgs } = await supabase
          .from('messages')
          .select('content, role, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const last = msgs?.[0];
        return {
          id: conv.id,
          user_id: conv.user_id as string | null,
          last_message: last?.content ?? null,
          last_message_at: last?.created_at ?? conv.created_at,
          unread: last?.role === 'user',
        };
      })
    );

    // 3. Resolve emails for the unique signed-in users
    const userIds = [...new Set(convs.map((c) => c.user_id).filter(Boolean))] as string[];
    const emailById: Record<string, string> = {};
    await Promise.all(
      userIds.map(async (id) => {
        const { data, error } = await supabase.auth.admin.getUserById(id);
        if (!error && data?.user?.email) emailById[id] = data.user.email;
      })
    );

    // Only surface conversations that actually have messages
    const conversations = rows
      .filter((r) => r.last_message !== null)
      .map((r) => ({
        ...r,
        user_email: r.user_id ? emailById[r.user_id] ?? null : null,
      }));

    return new Response(JSON.stringify({ conversations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
