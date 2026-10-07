# FoodSense Platform 🥗

Social-impact web app translating food microbiology into everyday advice for university students (Merul Badda, Dhaka).

**Goal:** 301–400 lives reached, 30%+ improvement in correct survey responses (Aug–Nov 2026). SDG 3 • 4 • 12.

## Quick start (runs without Supabase)

```powershell
cd "$env:USERPROFILE\OneDrive\Desktop\foodsense-platform"
npm.cmd install
npm.cmd run dev
# open http://localhost:3000
```

Demo data is built-in. All public pages + games + admin work in demo mode.

## Connect Supabase (live data)

1. Create project at https://supabase.com
2. SQL Editor → paste + run `supabase/schema.sql`
3. Storage → create **public** bucket `foodsense-media`
4. Authentication → Add user (your admin email/password)
5. Copy `.env.example` to `.env.local` and fill:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
6. Restart dev server. Admin login at `/admin/login`.

## Routes

- `/` homepage + Impact Tracker
- `/articles` Science Pantry + `/articles/[slug]`
- `/posters` masonry + download counting
- `/videos` 9:16 vertical grid
- `/surveys` + `/surveys/[id]` anonymous forms
- `/play` Red Flag game + Nutrition Hacker
- `/about` team
- `/admin` Overview, Feed Publisher, Media, Team, Survey Builder

## Reporting impact

Admin → Overview → Download Responses CSV. Compute in Excel:
`improvement = (endline_correct% − baseline_correct%) / baseline_correct%`
