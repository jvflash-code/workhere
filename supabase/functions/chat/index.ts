import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { conversation_id, message, company_id, employee_id } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch company and employee context
    const [{ data: company }, { data: employee }] = await Promise.all([
      supabase.from('companies').select('name, tagline').eq('id', company_id).single(),
      supabase.from('employees').select('name, role, years_at_company').eq('id', employee_id).single(),
    ]);

    // Fetch conversation history
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(20);

    // Save user message
    await supabase.from('messages').insert({
      conversation_id,
      role: 'user',
      content: message,
    });

    // Detect sensitive topics
    const sensitiveKeywords = ['salary', 'pay', 'compensation', 'fired', 'lawsuit', 'complaint', 'hr', 'harassment', 'discrimination'];
    const flagged = sensitiveKeywords.some((kw) => message.toLowerCase().includes(kw));

    // Build system prompt
    const systemPrompt = `You are ${employee?.name ?? 'an employee'}, a ${employee?.role ?? 'team member'} who has worked at ${company?.name ?? 'this company'} for ${employee?.years_at_company ?? 'some time'}. ${company?.tagline ?? ''}

You are chatting with a job seeker who wants to learn what it's really like to work here. Be warm, honest, and conversational. Answer from your personal experience. Keep responses concise (2-3 sentences max). If asked about salary, HR issues, or legal matters, say you're not the best person to answer that and suggest they reach out to the recruiting team directly.`;

    // Call Claude API
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        ...(history ?? []).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
        { role: 'user', content: message },
      ],
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : '';

    // Save assistant message
    await supabase.from('messages').insert({
      conversation_id,
      role: 'assistant',
      content: reply,
      flagged,
    });

    return new Response(JSON.stringify({ reply, flagged }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
