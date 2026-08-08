import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

function landing(title: string, message: string) {
  const body = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body{font-family:-apple-system,system-ui,sans-serif;background:#f5f5f5;margin:0;
    min-height:100vh;display:flex;align-items:center;justify-content:center}
  .card{background:#fff;border-radius:16px;padding:32px;max-width:340px;text-align:center;
    box-shadow:0 8px 30px rgba(0,0,0,.08)}
  h1{font-size:20px;color:#1A5CFF;margin:0 0 8px}
  p{color:#555;font-size:14px;line-height:1.5;margin:0}
  a{display:inline-block;margin-top:20px;background:#1A5CFF;color:#fff;text-decoration:none;
    padding:12px 24px;border-radius:12px;font-weight:600}
</style></head>
<body><div class="card"><h1>${title}</h1><p>${message}</p>
<a href="workhere://">Return to WhyWorkHere</a></div></body></html>`;
  return new Response(body, { headers: { 'Content-Type': 'text/html' } });
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // Human-facing landing pages that Stripe redirects to after checkout
  if (req.method === 'GET') {
    if (url.searchParams.get('redirect') === 'cancel') {
      return landing('Checkout canceled', 'No charge was made. You can choose a plan again anytime from the app.');
    }
    return landing("You're all set!", 'Your subscription is now active. Head back to the app to see your new plan.');
  }

  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature as string,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      undefined,
      cryptoProvider
    );
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${String(err)}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const md = session.metadata ?? {};
        if (md.company_id) {
          await supabase.from('company_subscriptions').upsert(
            {
              company_id: md.company_id,
              plan_id: md.plan_id ?? 'starter',
              billing_period: md.billing_period ?? 'monthly',
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              status: 'active',
            },
            { onConflict: 'company_id' }
          );
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as any;
        await supabase
          .from('company_subscriptions')
          .update({
            status: sub.status,
            renews_at: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        await supabase
          .from('company_subscriptions')
          .update({ plan_id: 'starter', status: 'canceled' })
          .eq('stripe_subscription_id', sub.id);
        break;
      }
    }
  } catch (err) {
    return new Response(`Handler error: ${String(err)}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
