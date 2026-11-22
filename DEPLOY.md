# 🚀 Deployment Guide

The whole stack ships as four containers behind **one public URL**. nginx serves
the React SPA and reverse-proxies `/api/*` to the Quarkus backend, so there is no
CORS to configure and nothing to wire up in the browser.

```
            ┌─────────────────────────── one public URL (:80) ───────────────────────────┐
  browser ──▶  frontend (nginx)  ──/api/*──▶  codeforces (Quarkus :3000)  ──▶  mongodb
                 └ React SPA                                               └──▶  redis
```

---

## 1. Local / single-server deployment

Everything runs with Docker Compose. Only the frontend port (`80`) is published;
the API, MongoDB and Redis stay on the internal network.

```bash
# 1. Secrets
cp .env.example .env
# edit .env → set CODEFORCES_API_KEY and CODEFORCES_API_SECRET

# 2. Build and start the full stack
docker compose -f docker-compose.prod.yml up --build -d

# 3. Open it
open http://localhost        # or http://<your-server-ip>
```

Useful commands:

```bash
docker compose -f docker-compose.prod.yml logs -f        # tail all logs
docker compose -f docker-compose.prod.yml ps             # container status
docker compose -f docker-compose.prod.yml down           # stop (keeps data)
docker compose -f docker-compose.prod.yml down -v        # stop + wipe DB/cache
```

> **Dev vs prod compose**
> `docker-compose.yml` is for development — it publishes the raw API on `:8080`
> (Swagger at `/q/swagger-ui`) and you run Vite separately with `npm run dev`.
> `docker-compose.prod.yml` is the all-in-one container build used below.

---

## 2. Deploy to a cloud VM (DigitalOcean / EC2 / Hetzner / …)

Any Linux box with Docker works. Example on a fresh Ubuntu droplet:

```bash
# on the server
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
git clone https://github.com/DevDodiya/Codeforces-Analyzer.git
cd Codeforces-Analyzer
cp .env.example .env && nano .env          # add your Codeforces key + secret
sudo docker compose -f docker-compose.prod.yml up --build -d
```

Open port **80** in the provider's firewall / security group and visit the
server's IP. To serve on a domain with HTTPS, put Caddy or an nginx reverse
proxy (or the provider's load balancer) in front of port 80 — Caddy gets you
automatic Let's Encrypt certificates in two lines.

---

## 3. Split deployment (managed frontend + backend host)

If you prefer a static host (Vercel / Netlify / Cloudflare Pages) for the SPA
and a separate box for the API:

**Frontend** — build pointing at the public API URL:

```bash
cd frontend
VITE_API_BASE_URL=https://api.your-domain.com npm run build
# deploy the frontend/dist folder to your static host
```

**Backend** — run just the API + data stores on a server:

```bash
docker compose up --build -d      # the dev compose: API on :8080 + mongo + redis
```

Then set the API host's CORS to your frontend origin (see Notes below).

---

## Notes

- **Secrets** live only in `.env` (git-ignored). Never commit real keys. The CI
  pipeline and this repo contain no credentials.
- **CORS** is wide open (`*`) for convenience. In the single-URL setup (section 1
  & 2) it is irrelevant because the browser only ever talks to the nginx origin.
  For a split deployment (section 3), restrict `quarkus.http.cors.origins` in
  `src/main/resources/application.properties` to your frontend domain.
- **Data** persists in the `mongo_data` and `redis_data` Docker volumes across
  restarts. `down -v` removes them.
- **Backend port** is `3000` inside the container (`quarkus.http.port`). The
  nginx proxy and compose files already account for this.
