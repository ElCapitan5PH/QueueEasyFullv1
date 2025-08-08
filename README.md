
# QueueEasy — Full MVP (React + Vercel Serverless + MongoDB Atlas)

## What you get
- React + Vite + Tailwind frontend (PWA-ready)
- Vercel **serverless API** under `/api/*` for shops & bookings
- MongoDB Atlas database (free tier)
- Seed route to create demo data

## Deploy in ~10 minutes
1) **Upload to GitHub** (repo root must contain `index.html`, `package.json`, `src/`, `public/`, `api/`, `vercel.json`).
2) **Import to Vercel** → Framework: **Vite** → Build: `npm run build` → Output: `dist`.
3) **Env Vars in Vercel → Settings → Environment Variables**:
   - `MONGODB_URI` = your Atlas URI (with user/pass)
   - (optional) `MONGODB_DB` = `queueeasy`
4) **Redeploy**.
5) Visit `/api/seed` to create demo shop + bookings.
6) Open your site root. Use tabs: **Book / Queue Board / Admin**.
   - Admin code from seed: **1234**

## Troubleshooting
- **404** → Ensure Output Directory is `dist` and files are at repo root (not nested).
- **Build errors** → Make sure `vite` exists in `devDependencies` (already included).
- **DB errors** → Verify `MONGODB_URI` and Atlas network access (0.0.0.0/0 for demo).

## Next
- Auth (Firebase)
- Payments (Stripe)
- Notifications (Twilio/SendGrid)
- Realtime (Pusher/Ably) instead of polling
