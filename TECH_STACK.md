# WhyWorkHere — Tech Stack & Setup Documentation

## What the App Does

WhyWorkHere is an employer branding platform that lets companies showcase employee video testimonials to job seekers. Job seekers can browse companies, watch videos, and chat directly with employees in real time. Employers manage their profile, upload videos, and respond to messages via an admin dashboard.

---

## Core Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo (~54) |
| Routing | Expo Router (file-based) |
| Backend | Supabase (Postgres, Auth, Realtime, Edge Functions) |
| Language | TypeScript |
| Build/Distribution | EAS (Expo Application Services) |

---

## Frontend Dependencies

| Package | Purpose |
|---------|---------|
| `expo-router` | File-based tab/screen navigation |
| `@react-navigation/bottom-tabs` | Bottom tab bar |
| `@supabase/supabase-js` | Supabase client (DB, Auth, Realtime) |
| `@react-native-async-storage/async-storage` | Persist company selection locally |
| `expo-av` | Video playback |
| `expo-image-picker` | Video upload from device library |
| `expo-notifications` | Push notification token registration |
| `expo-auth-session` | OAuth (Apple/Google — placeholder) |
| `expo-linking` | Deep link handling |
| `@expo/vector-icons` | Ionicons icon set |
| `expo-localization` | Detect device language for auto EN/ES |

---

## Environment Variables

Create a `.env` file in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Both values are found in your Supabase project under **Settings → API**.

---

## Supabase Setup

### Tables

| Table | Purpose |
|-------|---------|
| `companies` | Company profiles (name, tagline, logo, stats) |
| `profiles` | User accounts — links to `auth.users`, stores role (`employer` / `employee` / `jobseeker`) and `company_id` |
| `plans` | Subscription tiers: Starter (free), Growth ($49/mo), Pro ($149/mo) |
| `company_subscriptions` | Which plan a company is on |
| `employees` | Employee profiles linked to a company |
| `videos` | Employee testimonial videos with status (`pending` / `live` / `rejected`) |
| `conversations` | Chat threads between a job seeker and a company's employee |
| `messages` | Individual messages within a conversation |
| `push_tokens` | Expo push tokens per user/employee for notifications |

### Supabase Features Used

- **Auth** — Email/password sign-up and sign-in with session management
- **Row Level Security (RLS)** — Users can only read/write their own data
- **Realtime** — Chat screen subscribes to `postgres_changes` for live message delivery
- **Edge Functions** — `/functions/v1/push` sends push notifications to employees when a new message arrives
- **Storage** — Used for employer-uploaded video files

### Required RLS Policies

Run these in the Supabase SQL editor if not already present:

```sql
-- Profiles
alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on sign-up (bypasses RLS)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'jobseeker');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Auth Settings

In **Supabase → Authentication → Sign In / Providers → Email**:
- Disable **"Confirm email"** for development so users are signed in immediately after sign-up

---

## External Services

### EAS (Expo Application Services)
- Used to build and distribute iOS/Android binaries
- EAS Project ID is set in `app.json`
- Run `eas build` to create a build, `eas submit` to submit to app stores

### Push Notifications
- Powered by Expo Push Notifications
- Tokens are stored in the `push_tokens` Supabase table on app launch
- The `push` Edge Function reads the token and sends the notification when a job seeker messages an employee

### Auto-Translation
- EN ↔ ES translation via Google Translate (no API key required)
- Language detection is client-side (Spanish character/word recognition)
- Applied automatically to messages in the chat screen

### Deep Linking
- URL scheme: `workhere://company/{slug}`
- Web fallback: `https://whyworkhere.app/c/{slug}`
- Configured in `app.json` under `scheme`

---

## App Structure

```
app/
  (tabs)/
    _layout.tsx      # Tab bar config (Profile, Videos, Chat, Admin)
    index.tsx        # Profile tab — company overview
    explore.tsx      # Videos tab — employee testimonials
    chat.tsx         # Chat tab — real-time messaging with employees
    admin.tsx        # Admin tab — employer dashboard
  _layout.tsx        # Root layout — wraps providers

components/
  CompanyDirectory.tsx     # Browse/search companies
  DeepLinkHandler.tsx      # Handles workhere:// deep links
  EmployerOnboarding.tsx   # 2-step sign-up for new employers
  SignInSheet.tsx           # Sign-in modal for job seekers
  VideoPlayer.tsx           # Fullscreen video player
  LangToggle.tsx            # EN/ES language switcher

contexts/
  CompanyContext.tsx   # Currently selected company (persisted)
  LanguageContext.tsx  # EN/ES language preference

hooks/
  useAuth.ts              # Auth state + user profile (role, company_id)
  useCompany.ts           # Fetch company + videos data
  usePushNotifications.ts # Register push token on app launch

supabase/
  schema.sql         # Full DB schema + sample data
  migrations/        # Incremental schema changes
  functions/
    chat/            # AI chat edge function
    push/            # Push notification edge function
```

---

## Screens Overview

### Profile Tab
Company overview — name, tagline, employee count, star rating, recommend %, perks. Supports switching companies.

### Videos Tab
Grid of employee testimonial video cards. Tap to play fullscreen. Each card shows employee name, role, and tenure. "Ask a question" button routes to Chat.

### Chat Tab
Real-time messaging between a signed-in job seeker and a company employee. Messages are auto-translated EN↔ES. Push notification sent to the employee on new message.

### Admin Tab
Employer-only dashboard. Gates on `profile.role === 'employer'`. Shows:
- Company stats and plan tier
- Video upload and management
- Inbox of job seeker conversations with reply threading
- Plan upgrade UI (Starter / Growth / Pro)

New employers go through a 2-step onboarding:
1. Create account (name, email, password)
2. Set up company (name, tagline, headcount)

---

## Internationalization

Supported languages: **English**, **Spanish**

All UI strings live in `constants/translations.ts`. Language is detected from the device locale and can be toggled in the header via `LangToggle`. Chat messages are auto-translated regardless of language setting.

---

## Getting Started (Local Dev)

```bash
# Install dependencies
npm install

# Start the dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

Make sure your `.env` file is set up before starting.
