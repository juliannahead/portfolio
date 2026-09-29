# Julianna Head — Portfolio

A clean, futuristic, minimal portfolio site for **juliannahead.com**

- **Display / technical type:** Space Grotesk + JetBrains Mono
- **Body type:** Inter
- **No build step** — pure HTML / CSS / JS, ready to deploy to Cloudflare Pages.

## Files

| File | Purpose |
|------|---------|
| `index.html` | All page content and sections |
| `styles.css` | Design system + layout |
| `script.js` | Nav, scroll progress, reveal animations, mobile menu |
| `favicon.svg` | Gradient "JH" mark |
| `_headers` | Security + caching headers (Cloudflare Pages) |

## Run locally

Just open `index.html` in a browser, or serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to Cloudflare Pages

Since your domain `juliannahead.com` is already on Cloudflare, deploying is quick.

### Option A — Dashboard (drag & drop)
1. Go to **Cloudflare Dashboard → Workers & Pages → Create → Pages → Upload assets**.
2. Upload this folder.
3. After it deploys, open the project → **Custom domains → Set up a custom domain** → enter `juliannahead.com`. Cloudflare wires the DNS automatically.

### Option B — Git-connected (recommended for updates)
1. Push this folder to a GitHub repo.
2. Cloudflare Dashboard → **Pages → Connect to Git** → select the repo.
3. Build settings: **Framework preset = None**, **Build command = (blank)**, **Output directory = `/`**.
4. Add the custom domain `juliannahead.com` under the project's **Custom domains** tab.

### Option C — Wrangler CLI
```bash
npx wrangler pages deploy . --project-name=juliannahead
```
Then attach the custom domain in the dashboard (or via `wrangler pages`).

> Make sure you're logged into the correct Cloudflare account first:
> ```bash
> npx wrangler whoami      # check
> npx wrangler login       # switch / sign in
> ```

## Customizing

- **Email / socials:** update the `mailto:` and social links in the `#contact` section of `index.html`.
- **Work case studies:** each `<article class="case">` block in `#work`.
- **Capabilities:** the `.pillar` blocks in `#capabilities`.
- **Colors:** edit the `--accent` / `--accent-2` variables at the top of `styles.css`.
