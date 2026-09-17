# Deployment guide

## 1. Create dedicated accounts or projects

You need:

- A Cloudflare account with Workers enabled.
- An OpenAI API project dedicated to this interactive paper.

A ChatGPT subscription does not include OpenAI API usage. Add billing to the API account, create a low project budget, and configure usage alerts. Start with a conservative budget appropriate to the expected audience.

## 2. Create a restricted project API key

Create the API key inside the dedicated OpenAI project. It needs permission to make model requests. It does not need permissions for files, fine-tuning, vector stores, batches, videos, or unrelated services.

Never paste the key into `wrangler.jsonc`, `site-config.js`, GitHub, or browser JavaScript.

## 3. Customize before first deployment

In `wrangler.jsonc`:

- Replace `replace-with-paper-short-name` with a unique Worker name using lowercase letters, digits, and hyphens.
- Replace the paper title, authors, and contact email.
- Review `DAILY_QUESTION_LIMIT` and `MONTHLY_REQUEST_CAP`.
- Keep observability enabled during testing.

Make the same public-facing metadata changes in `public/site-config.js`.

## 4. Install and authenticate Wrangler

From this folder in PowerShell:

```powershell
npm install
npx.cmd wrangler login
```

Complete the Cloudflare authorization in the browser. If the localhost callback page says it refused to connect after approval, return to PowerShell and check whether Wrangler nevertheless reports successful authorization.

## 5. Upload secrets

Run:

```powershell
.\cloudflare-set-secrets.cmd
```

Enter:

1. The dedicated OpenAI project API key.
2. A long random value for `RATE_LIMIT_SALT`.

The salt is used to hash the visitor IP address together with the UTC date before the daily counter is stored. The raw IP address is not written to Durable Object storage by this application.

## 6. Deploy

Run:

```powershell
.\cloudflare-deploy.cmd
```

Wrangler will display a URL of the form:

```text
https://paper-short-name.account-subdomain.workers.dev
```

Changing the `name` field later generally targets a separately named Worker. Re-upload secrets and test the new Worker before removing the old one.

## 7. Diagnose errors

If the page says the assistant is temporarily unavailable:

1. Open the Worker in Cloudflare.
2. Open **Observability** and inspect the `POST /api/chat` request.
3. Look for `OpenAI 401`, `403`, `429`, or `Paper source unavailable`.

Common causes:

- The API key was added to a differently named Worker.
- The OpenAI project lacks billing or has reached a project limit.
- The API key lacks model-request permission.
- `public/paper/paper.md` was moved without updating `src/paper-config.js`.

## 8. Publishing and domains

The free `workers.dev` URL is sufficient for a pilot. A departmental production service should eventually use an institutionally managed domain or subdomain. Coordinate with departmental and university IT before presenting the service as officially operated by the university.

