import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
});

// plan_id + billing_period -> the env var holding that Stripe price id
const PRICE_ENV: Record<string, string> = {
  growth_monthly: 'STRIPE_PRICE_GROWTH_MONTHLY',
  growth_annual: 'STRIPE_PRICE_GROWTH_ANNUAL',
  pro_monthly: 'STRIPE_PRICE_PRO_MONTHLY',
  pro_annual: 'STRIPE_PRICE_PRO_ANNUAL',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { company_id, plan_id, billing_period } = await req.json();

    if (!company_id) return json({ error: 'company_id is required' }, 400);
    if (plan_id !== 'growth' && plan_id !== 'pro') {
      return json({ error: 'plan_id must be "growth" or "pro"' }, 400);
    }
    const period = billing_period === 'annual' ? 'annual' : 'monthly';

    const priceEnv = PRICE_ENV[`${plan_id}_${period}`];
    const priceId = Deno.env.get(priceEnv);
    if (!priceId) {
      return json({ error: `Missing Stripe price. Set the ${priceEnv} secret.` }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Reuse this company's Stripe customer if we already have one
    const { data: existing } = await supabase
      .from('company_subscriptions')
      .select('stripe_customer_id')
      .eq('company_id', company_id)
      .maybeSingle();

    let customerId: string | undefined = existing?.stripe_customer_id ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { company_id } });
      customerId = customer.id;
      await supabase
        .from('company_subscriptions')
        .upsert({ company_id, stripe_customer_id: customerId }, { onConflict: 'company_id' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${supabaseUrl}/functions/v1/stripe-webhook?redirect=success`,
      cancel_url: `${supabaseUrl}/functions/v1/stripe-webhook?redirect=cancel`,
      metadata: { company_id, plan_id, billing_period: period },
      subscription_data: { metadata: { company_id, plan_id, billing_period: period } },
    });

    return json({ url: session.url });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
