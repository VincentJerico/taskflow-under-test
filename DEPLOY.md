# Deploying TaskFlow (Render)

TaskFlow is a Node/Express app, so it runs on any host that supports a persistent Node process.
This guide uses **[Render](https://render.com)** (free tier). A [`render.yaml`](render.yaml) Blueprint
is included, so setup is a few clicks.

## One-time deploy (Blueprint)
1. Push this repo to GitHub (already done).
2. Go to **https://dashboard.render.com** and sign in (GitHub login is easiest).
3. **New → Blueprint**.
4. Connect / select the **`taskflow-under-test`** repo. Render reads `render.yaml`.
5. Click **Apply**. Render builds (`npm ci`) and starts (`npm start`).
6. When it's live, Render gives you a URL like `https://taskflow-under-test.onrender.com`.
   The health check hits `/health`; open the root URL to use the app.

That's it — no environment variables to set by hand (the Blueprint defines them).

## Notes & caveats
- **PORT:** the app already reads `process.env.PORT`, which Render provides automatically.
- **Free tier sleeps:** after ~15 min idle the service spins down; the next request wakes it (a slow
  first load). Fine for a demo.
- **Data persistence (important):** on the **free** plan the disk is **ephemeral** — registered users
  and tasks reset on restart, redeploy, or wake-from-sleep. That's acceptable for a "try it live"
  demo. To persist data, use a paid instance and a disk:
  1. In `render.yaml`, uncomment the `disk:` block and the `/var/data/taskflow.db` `DATABASE_PATH`.
  2. Change `plan: free` to a paid plan (disks require it).
  3. Redeploy.
- **Auto-deploy:** `autoDeploy: true` means every push to the default branch redeploys.

## Adding the live URL to the README
After the first deploy, add the URL to the top of `README.md`, e.g.:
```md
**Live demo:** https://taskflow-under-test.onrender.com  (free tier — first load may be slow)
```

## Alternative hosts
The same app runs on **Railway** or **Fly.io** with minimal changes (both support persistent Node +
disks). Vercel is **not** recommended here: its serverless model doesn't fit an always-on Express
server with file-based SQLite (data won't persist without swapping to a hosted DB like Turso/libSQL).
