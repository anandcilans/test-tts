# Deploy Frontend on Vercel + Local Backend (Docker)

Short guide: Next.js on **Vercel**, FastAPI on your **PC** (Docker), connected via **Cloudflare Tunnel**.

```text
Browser → Vercel (frontend) → Cloudflare Tunnel → localhost:8000 (Docker)
```

Your PC must stay on with Docker and the tunnel running.

---

## URL map (do not mix these up)

| URL | Where it goes | Example |
| --- | ------------- | ------- |
| Vercel frontend URL | `CORS_ORIGINS` in root `.env` | `https://your-app.vercel.app` |
| Cloudflare tunnel URL | `NEXT_PUBLIC_TTS_URL` (Vercel + local) | `https://….trycloudflare.com` |

- **CORS** = who may call your API (the page origin in the browser).
- **TTS URL** = where the frontend sends `/tts` requests.

Putting the tunnel URL in `CORS_ORIGINS` causes `OPTIONS /tts` → **400** and **Failed to fetch**.

---

## 1. Backend `.env` (repo root)

```env
SARVAM_API_KEY=your_sarvam_api_key
CORS_ORIGINS=http://localhost:3000,https://YOUR-VERCEL-URL.vercel.app
```

Rules:

- Keep `http://localhost:3000` for local Next.js.
- Add the **exact** URL from the browser address bar when you open the Vercel app (no trailing slash).
- If Vercel shows both a production domain and a long `*.vercel.app` deployment URL, add **both** if you use both:

```env
CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app,https://your-app-xxxx-team.vercel.app
```

You can set a placeholder Vercel URL first, then update after deploy and restart Docker.

---

## 2. Build and run Docker

From the repo root (`d:\tmp\test-tts`):

```powershell
docker build -t vani-tts .
docker run --env-file .env -p 8000:8000 vani-tts
```

Verify:

```powershell
curl http://localhost:8000/docs
```

### After changing `.env` only

You do **not** need a rebuild. Stop the old container and run again:

```powershell
docker ps
docker stop <container_id>
docker run --env-file .env -p 8000:8000 vani-tts
```

### After changing `main.py`, `Dockerfile`, or `requirements.txt`

Rebuild, then run:

```powershell
docker ps
docker stop <container_id>
docker build -t vani-tts .
docker run --env-file .env -p 8000:8000 vani-tts
```

---

## 3. Cloudflare Tunnel

In a **second** terminal:

```powershell
cloudflared tunnel --url http://localhost:8000
```

Copy the HTTPS URL (e.g. `https://random-words.trycloudflare.com`). Keep this terminal open.

Quick check:

```powershell
curl -X POST https://YOUR-TUNNEL.trycloudflare.com/tts `
  -H "Content-Type: application/json" `
  -d "@body.json" `
  --output test.wav
```

**Note:** Quick tunnel URLs change every restart. When they change, update `NEXT_PUBLIC_TTS_URL` on Vercel and redeploy.

---

## 4. Deploy frontend on Vercel

Assumption: `frontend/` is a normal folder in GitHub (not a broken submodule). Repo Root Directory on Vercel must be `frontend`.

1. Push the repo to GitHub.
2. [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. **Root Directory** → **Edit** → select **`frontend`** → Continue.
4. Framework Preset: **Next.js**.
5. **Environment Variables** → add:

   | Name | Value |
   | ---- | ----- |
   | `NEXT_PUBLIC_TTS_URL` | `https://YOUR-TUNNEL.trycloudflare.com` |

   No spaces around `=`. Paste the URL only.

6. **Deploy**.
7. Copy the live site URL from Vercel.

### If the site is `404: NOT_FOUND`

Root Directory is wrong or the deploy is empty:

1. Project → **Settings** → **General** → Root Directory = `frontend`
2. **Deployments** → **Redeploy** (disable build cache if available)

---

## 5. Wire Vercel URL into backend CORS

1. Put the Vercel URL into root `.env` `CORS_ORIGINS` (see section 1).
2. Restart Docker (section 2 — stop + `docker run --env-file .env …`).
3. Confirm tunnel is still running and matches `NEXT_PUBLIC_TTS_URL` on Vercel.

Local frontend (optional) — `frontend/.env.local`:

```env
NEXT_PUBLIC_TTS_URL=https://YOUR-TUNNEL.trycloudflare.com
```

---

## 6. End-to-end check

1. Open the Vercel URL in a browser.
2. Enter text → **Generate speech**.
3. Docker logs should show:

```text
OPTIONS /tts  200
POST /tts     200
```

Not:

```text
OPTIONS /tts  400 Bad Request
```

---

## Checklist

```text
[ ] docker build -t vani-tts . && docker run --env-file .env -p 8000:8000 vani-tts
[ ] cloudflared tunnel --url http://localhost:8000  (copy HTTPS URL)
[ ] Vercel Root Directory = frontend
[ ] Vercel env NEXT_PUBLIC_TTS_URL = tunnel URL
[ ] Deploy Ready (site loads UI, not 404)
[ ] CORS_ORIGINS includes exact Vercel URL
[ ] Docker restarted after CORS change
[ ] Generate speech works from Vercel
```

---

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `OPTIONS /tts` → 400, frontend “Failed to fetch” | Add Vercel origin to `CORS_ORIGINS`, restart Docker |
| `502` / connection refused | Docker and/or `cloudflared` not running |
| Tunnel URL changed | Update `NEXT_PUBLIC_TTS_URL` on Vercel → Redeploy |
| Site `404 NOT_FOUND` | Set Root Directory to `frontend`, redeploy |
| Env change ignored | `NEXT_PUBLIC_*` needs a Vercel redeploy; `.env` needs a new `docker run` |

---

## Security

- Do not commit `.env` or API keys.
- The tunnel exposes `/tts` publicly while it runs.
- Rotate `SARVAM_API_KEY` if the tunnel URL is shared widely.

For named (stable) tunnels and more detail, see `cloudflare-tunnel-vercel.md`.
