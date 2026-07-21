# Expose Local Backend + Deploy Frontend on Vercel

Guide for running the FastAPI backend on your local machine (Docker), exposing it publicly with **Cloudflare Tunnel**, and deploying the Next.js frontend to **Vercel**.

## Overview

```text
Browser → Vercel (frontend) → Cloudflare Tunnel URL → localhost:8000 (Docker) → Sarvam API
```

| Component | Where it runs |
| --------- | ------------- |
| Backend (FastAPI + Docker) | Your local PC |
| Public backend URL | Cloudflare Tunnel |
| Frontend (Next.js) | Vercel |

**Requirements:** Your PC must stay on with Docker and the tunnel running. This is a demo/dev setup, not a production backend architecture.

## Why Cloudflare Tunnel?

- No router port forwarding or static IP
- Free HTTPS URL
- Works behind NAT and firewalls (outbound connection only)
- Stable URL possible with a named tunnel + your own domain
- `SARVAM_API_KEY` stays on your machine

**Tradeoffs:**

- Quick tunnels get a **new random URL** every restart
- Anyone with the tunnel URL can call `/tts` (uses your Sarvam quota)
- For 24/7 uptime without your PC, deploy the backend to a cloud host instead

---

## Phase 1: Run backend locally

Build and run (if not already):

```bash
docker build -t vani-tts .
docker run --env-file .env -p 8000:8000 vani-tts
```

Verify locally:

```bash
curl http://localhost:8000/docs
```

Or test TTS:

```powershell
curl -X POST http://localhost:8000/tts `
  -H "Content-Type: application/json" `
  -d "@body.json" `
  --output output.wav
```

---

## Phase 2: Install Cloudflare Tunnel

On Windows (PowerShell):

```powershell
winget install --id Cloudflare.cloudflared
```

Or download from:  
https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

Verify:

```powershell
cloudflared --version
```

---

## Phase 3: Quick tunnel (fastest test)

No Cloudflare account required. Gives a temporary public URL:

```powershell
cloudflared tunnel --url http://localhost:8000
```

Copy the URL from the output, e.g.:

```text
https://random-words-here.trycloudflare.com
```

**Keep this terminal open** — closing it stops the tunnel.

Test the public URL:

```powershell
curl -X POST https://YOUR-URL.trycloudflare.com/tts `
  -H "Content-Type: application/json" `
  -d "@body.json" `
  --output test.wav
```

---

## Phase 4: Update backend CORS

The backend only allows origins listed in `CORS_ORIGINS`. Edit `.env` in the repo root:

```env
SARVAM_API_KEY=your_sarvam_api_key
CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app
```

Replace `https://your-app.vercel.app` with your actual Vercel URL (set this after Phase 5 if you do not have it yet).

Restart Docker so the new env loads:

```powershell
docker ps
docker stop <container_id>
docker run --env-file .env -p 8000:8000 vani-tts
```

---

## Phase 5: Deploy frontend to Vercel

1. Push the repo to GitHub (if not already).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Set **Root Directory** to `frontend`.
4. Add an environment variable:

   | Name | Value |
   | ---- | ----- |
   | `NEXT_PUBLIC_TTS_URL` | `https://YOUR-URL.trycloudflare.com` |

5. Deploy.
6. Copy your Vercel URL (e.g. `https://vani-tts.vercel.app`).
7. Add that URL to `CORS_ORIGINS` in `.env` and restart Docker.
8. Redeploy on Vercel if you changed `NEXT_PUBLIC_TTS_URL`.

---

## Phase 6: End-to-end test

1. Open your Vercel app in a browser.
2. Enter text → click **Generate speech**.
3. Confirm audio plays and download works.

### Troubleshooting

| Symptom | Fix |
| ------- | --- |
| CORS error in browser console | Add your Vercel URL to `CORS_ORIGINS`, restart Docker |
| 502 / connection refused | Ensure Docker and `cloudflared` are both running |
| Tunnel URL changed | Quick tunnel URLs change on restart — update `NEXT_PUBLIC_TTS_URL` on Vercel and redeploy |
| Empty or failed response | Test `/tts` with curl through the tunnel URL first |

---

## Named tunnel (stable URL)

Quick tunnels change URL on every restart. For a fixed URL, use a **named tunnel** with a domain on Cloudflare.

### 1. Log in

```powershell
cloudflared tunnel login
```

Pick a domain you manage in Cloudflare when the browser opens.

### 2. Create tunnel

```powershell
cloudflared tunnel create vani-tts
```

Note the tunnel UUID from the output.

### 3. Config file

Create `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: vani-tts
credentials-file: C:\Users\YOUR_USER\.cloudflared\TUNNEL-UUID.json

ingress:
  - hostname: tts.yourdomain.com
    service: http://localhost:8000
  - service: http_status:404
```

Replace `YOUR_USER`, `TUNNEL-UUID`, and `tts.yourdomain.com`.

### 4. DNS route

```powershell
cloudflared tunnel route dns vani-tts tts.yourdomain.com
```

### 5. Run tunnel

```powershell
cloudflared tunnel run vani-tts
```

Stable backend URL: `https://tts.yourdomain.com`

Use that as `NEXT_PUBLIC_TTS_URL` on Vercel. Add your Vercel app URL to `CORS_ORIGINS`.

### 6. Run on startup (optional)

```powershell
cloudflared service install
cloudflared service start
```

---

## Cloudflare Tunnel vs ngrok

| | Cloudflare Tunnel | ngrok |
| --- | --- | --- |
| Free tier | Yes | Yes (limited) |
| Stable URL | With own domain | Paid for custom domain |
| Account | Optional for quick tunnel | Required |
| Special headers | None needed | `ngrok-skip-browser-warning` (already in frontend for ngrok free tier) |

Both work. Cloudflare is better if you have a domain and want a free stable URL. ngrok is faster for a one-off demo.

---

## Checklist

```text
[ ] Docker backend running on localhost:8000
[ ] cloudflared tunnel running → public HTTPS URL
[ ] curl POST /tts through tunnel URL returns WAV
[ ] CORS_ORIGINS includes Vercel URL
[ ] NEXT_PUBLIC_TTS_URL set on Vercel
[ ] Frontend deployed; Generate speech works in browser
[ ] (Optional) Named tunnel + custom domain for stable URL
```

---

## Security notes

- Never commit `.env` or expose `SARVAM_API_KEY`.
- The tunnel exposes `/tts` to the internet — consider rate limiting or an API key for public demos.
- Rotate your Sarvam key if the tunnel URL is shared widely.
