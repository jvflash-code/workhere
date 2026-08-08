# WhyWorkHere

A mobile app that lets job seekers hear what it's really like to work somewhere —
watch short employee testimonial videos and chat (via AI personas or the real
team) to get honest answers before they apply. Employers get a dashboard to
manage their team, upload videos, and reply to candidates.

Built with **Expo / React Native** (Expo Router) and **Supabase** (Postgres,
Auth, Storage, Edge Functions).

## Features

**Job seekers**
- Browse a directory of companies (with deep links to a specific company)
- View a company profile: stats, perks, and employee testimonial videos
- Chat with an AI persona of a real employee, powered by Claude
- Account tab: manage your display name and resume past conversations
- Automatic message translation (EN ⇄ ES) and an unread badge on the Chat tab

**Employers (Admin tab)**
- Upload employee testimonial videos to Supabase Storage and moderate them
- Manage the team (add / edit / remove employees)
- Inbox: read job-seeker conversations by real email and reply to them
- Subscription / plan management UI

## Tech stack

| Layer | Tech |
|-------|------|
| App | Expo, React Native, Expo Router, TypeScript |
| Backend | Supabase (Postgres, Auth, Storage, Realtime) |
| Functions | Supabase Edge Functions (Deno) |
| AI | Claude (Anthropic) via the `chat` edge function |
| Push | Expo Push Notifications |

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` in the project root with your Supabase project values:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

3. Start the app:

   ```bash
   npx expo start
   ```

   Open it in a development build, an iOS/Android simulator, or Expo Go.

## Supabase setup

**Database** — apply the schema and migrations:

```bash
supabase db push          # applies supabase/migrations/*
```

`supabase/schema.sql` documents the full schema (companies, employees, videos,
conversations, messages, profiles, plans, subscriptions, push tokens) and seeds
a sample company.

**Edge functions** — deploy from `supabase/functions/`:

```bash
supabase functions deploy chat     # AI employee chat (needs ANTHROPIC_API_KEY)
supabase functions deploy push     # Expo push notifications
supabase functions deploy inbox    # employer inbox: list / thread / reply
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into every function
automatically; the `chat` function additionally needs `ANTHROPIC_API_KEY` set as
a function secret.

## Project structure

```
app/(tabs)/        Screens: index (company profile), explore (videos),
                   chat, account, admin
components/        Shared UI (CompanyDirectory, VideoPlayer, SignInSheet, …)
contexts/          CompanyContext, LanguageContext, UnreadContext
hooks/             useAuth, useCompany, usePushNotifications
lib/               Supabase client
supabase/          schema.sql, migrations/, functions/
utils/             translation helpers
```
