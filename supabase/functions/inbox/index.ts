import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Employer-side messaging runs through the service role because RLS on
// conversations/messages restricts the anon client to the caller's own
// rows, and emails live in auth.users which the anon client can't read.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json().catch(() => ({}));
    const action = payload.action ?? 'list';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    switch (action) {
      case 'list':
        return await listConversations(supabase, payload.company_id);
      case 'thread':
        return await loadThread(supabase, payload.conversation_id);
      case 'reply':
        return await sendReply(supabase, payload.conversation_id, payload.content);
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

// List a company's active conversations with last message + real user email.
async function listConversations(supabase: SupabaseClient, companyId?: string) {
  if (!companyId) return json({ error: 'company_id is required' }, 400);

  const { data: convs, error } = await supabase
    .from('conversations')
    .select('id, user_id, created_at')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  if (!convs || convs.length === 0) return json({ conversations: [] });

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

  const userIds = [...new Set(convs.map((c) => c.user_id).filter(Boolean))] as string[];
  const emailById: Record<string, string> = {};
  await Promise.all(
    userIds.map(async (id) => {
      const { data, error } = await supabase.auth.admin.getUserById(id);
      if (!error && data?.user?.email) emailById[id] = data.user.email;
    })
  );

  const conversations = rows
    .filter((r) => r.last_message !== null)
    .map((r) => ({
      ...r,
      user_email: r.user_id ? emailById[r.user_id] ?? null : null,
    }));

  return json({ conversations });
}

// Full message history for one conversation.
async function loadThread(supabase: SupabaseClient, conversationId?: string) {
  if (!conversationId) return json({ error: 'conversation_id is required' }, 400);

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) throw error;
  return json({ messages: messages ?? [] });
}

// Post an employer reply and notify the job seeker via push.
async function sendReply(supabase: SupabaseClient, conversationId?: string, content?: string) {
  if (!conversationId) return json({ error: 'conversation_id is required' }, 400);
  const text = (content ?? '').trim();
  if (!text) return json({ error: 'content is required' }, 400);

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role: 'employee', content: text })
    .select('id, role, content, created_at')
    .single();

  if (error) throw error;

  // Best-effort push to the conversation's user; never fail the reply on this.
  try {
    const { data: conv } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single();

    if (conv?.user_id) {
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', conv.user_id);

      if (tokens && tokens.length > 0) {
        const notifications = tokens.map((t: { token: string }) => ({
          to: t.token,
          title: 'New reply',
          body: text.slice(0, 100),
          data: { conversation_id: conversationId },
          sound: 'default',
        }));
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notifications),
        });
      }
    }
  } catch {
    // ignore push failures
  }

  return json({ message });
}
