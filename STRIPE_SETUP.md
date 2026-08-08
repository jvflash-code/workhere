# Stripe Billing Setup

One-time steps to activate real subscription billing. All done in the Stripe
and Supabase dashboards — no terminal required. Use **test/sandbox** mode until
you're ready to charge real cards.

## 1. Secret key
- [x] Supabase → Edge Functions → Secrets → `STRIPE_SECRET_KEY` = your `sk_test_...` key

## 2. Database migration
- [ ] Supabase → SQL Editor → paste `supabase/migrations/20260808000000_stripe_billing.sql` → **Run**
  (adds Stripe columns + a unique index on `company_id`)

## 3. Create prices in Stripe
Stripe → Products → create each as a **recurring** price, then copy its `price_...` ID:

| Product | Amount | Interval | Secret name to store it under |
|---------|--------|----------|-------------------------------|
| Growth  | $49    | Monthly  | `STRIPE_PRICE_GROWTH_MONTHLY` |
| Growth  | $39/mo | Yearly   | `STRIPE_PRICE_GROWTH_ANNUAL`  |
| Pro     | $149   | Monthly  | `STRIPE_PRICE_PRO_MONTHLY`    |
| Pro     | $119/mo| Yearly   | `STRIPE_PRICE_PRO_ANNUAL`     |

- [ ] Growth monthly
- [ ] Growth annual
- [ ] Pro monthly
- [ ] Pro annual

## 4. Add price IDs as Supabase secrets
- [ ] Supabase → Edge Functions → Secrets → add the 4 secrets above, each value = its `price_...` ID

## 5. Deploy the functions
Supabase → Edge Functions → Deploy new function (paste from editor):
- [ ] `create-checkout` — paste `supabase/functions/create-checkout/index.ts` — **JWT verification ON**
- [ ] `stripe-webhook` — paste `supabase/functions/stripe-webhook/index.ts` — **JWT verification OFF**

## 6. Register the webhook in Stripe
Stripe → Developers → Webhooks → Add endpoint:
- [ ] URL: `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
- [ ] Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Copy the signing secret (`whsec_...`) → Supabase secret `STRIPE_WEBHOOK_SECRET`

## 7. Test
- [ ] Admin tab → Upgrade → pick Growth/Pro → Stripe Checkout opens
- [ ] Pay with test card `4242 4242 4242 4242`, any future expiry, any CVC
- [ ] Return to the app — the plan updates (written by the webhook, read on focus)

## Going live later
Swap the sandbox values for live ones: `STRIPE_SECRET_KEY` → `sk_live_...`,
recreate the 4 prices in live mode and update their secrets, and add a live
webhook endpoint for `STRIPE_WEBHOOK_SECRET`. No code changes needed.

## Not yet implemented
- Self-serve **downgrade/cancel** (currently shows a "contact support" note).
  Add via Stripe's Customer Portal when needed.
