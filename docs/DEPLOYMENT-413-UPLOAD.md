# Fixing 413 Request Entity Too Large (logo/image upload)

If hotel logo or profile image upload fails with **413 Request Entity Too Large** (even for small images, e.g. 41 KB), the limit is set by your **host or reverse proxy**, not by the app.

## What we already do

- **Next.js** is configured to allow request bodies up to **10 MB** (`serverActions.bodySizeLimit` in `next.config.js`).
- The app shows a clear toast when it receives 413, and suggests using a smaller image or increasing the server limit.

## What you need to do on the server

### DigitalOcean App Platform

- Check [DO App Platform docs](https://docs.digitalocean.com/products/app-platform/) for **request size** or **body size** limits.
- If there is an environment or app setting for max request body size, set it to at least **10 MB** (or 10485760 bytes).
- If you use a **custom Dockerfile** or **Nginx** in front of the app, increase the body size there (see below).

### Nginx (if you use it in front of Next.js)

Add or update in your Nginx config (e.g. `server` or `http` block):

```nginx
client_max_body_size 10M;
```

Then reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Other proxies / load balancers

- Increase the **maximum request body size** (or equivalent) to at least **10 MB** so uploads are not rejected before they reach Next.js.

After increasing the limit, redeploy or reload the server and try the upload again.
