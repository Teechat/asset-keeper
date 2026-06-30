# AssetKeeper — Complete Setup Guide

## Prerequisites

- [Node.js 20+](https://nodejs.org/) — **install this first**
- A [LINE account](https://line.me/) (you already have one)
- A free [Supabase account](https://supabase.com/)
- A free [Vercel account](https://vercel.com/)
- A [GitHub account](https://github.com/) (for Vercel deployment)

---

## Step 1: Install Node.js

Download and install from: https://nodejs.org/ (choose "LTS")

After install, open a new terminal and verify:
```
node --version   # should print v20.x.x
npm --version    # should print 10.x.x
```

---

## Step 2: Install Dependencies

Open PowerShell in the `asset-keeper` folder and run:
```
npm install
```

---

## Step 3: Create a LINE Official Account & Messaging API

1. Go to https://manager.line.biz/ → **Create a LINE Official Account**
2. After creating, go to **Settings → Messaging API → Enable Messaging API**
3. You'll get a **Channel ID** and **Channel Secret**
4. Go to the [LINE Developers Console](https://developers.line.biz/)
5. Open your channel → **Messaging API** tab
6. Issue a **Channel Access Token** (long-lived)
7. Save: `LINE_CHANNEL_ACCESS_TOKEN` and `LINE_CHANNEL_SECRET`

### Configure webhook
- Webhook URL: `https://YOUR-APP.vercel.app/api/webhook` (set after Vercel deploy)
- Enable **Use Webhook**: ON
- Disable **Auto-reply messages**: OFF
- Disable **Greeting messages**: OFF (our code sends welcome message)

---

## Step 4: Create a Supabase Project

1. Go to https://supabase.com/ → **New Project**
2. Choose a name, password, region (Southeast Asia)
3. Wait for project to provision (~1 minute)
4. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### Run database migration
1. Go to **SQL Editor** in Supabase dashboard
2. Paste the contents of `supabase/migrations/001_initial.sql`
3. Click **Run**

### Enable pg_cron (for scheduled reminders)
1. Go to **Database → Extensions**
2. Search for `pg_cron` → Enable it
3. After deploying to Vercel, paste and run `supabase/migrations/002_cron_jobs.sql`
   (update the URL and secret values first)

---

## Step 5: Set Up LINE LIFF App

1. In [LINE Developers Console](https://developers.line.biz/) → your channel
2. Go to **LIFF** tab → **Add**
3. Settings:
   - **LIFF app name**: AssetKeeper Dashboard
   - **Size**: Full
   - **Endpoint URL**: `https://YOUR-APP.vercel.app/dashboard`
   - **Scope**: `profile openid`
4. Copy the **LIFF ID** → `NEXT_PUBLIC_LIFF_ID`

---

## Step 6: Deploy to Vercel

### Upload to GitHub
```bash
git init
git add .
git commit -m "Initial AssetKeeper setup"
git remote add origin https://github.com/YOUR-USERNAME/asset-keeper.git
git push -u origin main
```

### Deploy on Vercel
1. Go to https://vercel.com/ → **Import Project** → connect your GitHub repo
2. Add all environment variables (see `.env.local.example`)
3. Click **Deploy**
4. Copy your Vercel URL (e.g., `https://asset-keeper-xyz.vercel.app`)

---

## Step 7: Configure Environment Variables

Create `.env.local` (copy from `.env.local.example`):

```env
LINE_CHANNEL_ACCESS_TOKEN=your_token_here
LINE_CHANNEL_SECRET=your_secret_here
NEXT_PUBLIC_LIFF_ID=your_liff_id
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CRON_SECRET=make_up_any_random_string_here
```

Also add all these in the Vercel dashboard under **Settings → Environment Variables**.

---

## Step 8: Set Up LINE Rich Menu

After deployment, set up the Rich Menu so users see navigation buttons at the bottom of the LINE chat.

Use the [LINE Official Account Manager](https://manager.line.biz/):
1. Go to **Chat** → **Rich menus** → **Create new**
2. Set up 3 buttons:
   - **My Assets** → Action: `Message` → Text: `/list`
   - **Add New** → Action: `URI` → URL: `https://YOUR-APP.vercel.app/dashboard?action=add`
   - **Dashboard** → Action: `URI` → URL: `https://YOUR-APP.vercel.app/dashboard`

---

## Step 9: Set Up External Cron (Alternative to Supabase cron)

If pg_cron doesn't work, use [cron-job.org](https://cron-job.org/) (free):

1. Create account at https://cron-job.org/
2. Add two jobs:
   - **Daily 8AM reminder**: `https://your-app.vercel.app/api/reminders?mode=daily&secret=YOUR_CRON_SECRET` → every day at 01:00 UTC
   - **Advance check**: Same URL with `mode=check` → every day at 09:00 UTC

---

## Testing

### Test the webhook locally
```bash
npm run dev
# Then use ngrok to expose localhost:3000:
npx ngrok http 3000
# Set the ngrok URL as webhook in LINE Developers Console
```

### Test reminder sending
Visit in browser (while dev server is running):
```
http://localhost:3000/api/reminders?mode=check&secret=YOUR_CRON_SECRET
```

---

## Running Locally

```bash
npm run dev
```

Opens at http://localhost:3000 → redirects to /dashboard

---

## Cost Summary

| Service | Cost |
|---------|------|
| Vercel (hosting) | Free (Hobby) |
| Supabase (database) | Free (500MB) |
| LINE Official Account | Free (300 push msg/month) |
| cron-job.org (scheduler) | Free |
| **Total** | **฿0/month** |

300 free LINE push messages/month is enough for:
- 1 daily morning alert = 30 messages (only sent when tasks are due soon)
- ~10-20 advance reminders per month
- For family use, each family member = separate user, each gets their own reminders
