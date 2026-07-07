# Disclose Media — Client Reporting Portal

Live Meta Ads reporting dashboard for all Disclose Media clients.

## Deploy to Vercel (step-by-step)

### 1. Get a long-lived Meta access token

1. Go to [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
2. Select your app → click **Generate Access Token**
3. Add permissions: `ads_read`, `ads_management`, `pages_read_engagement`, `business_management`
4. Copy the short-lived token
5. Exchange for a long-lived token (60 days) by visiting:
   ```
   https://graph.facebook.com/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id=YOUR_APP_ID
     &client_secret=YOUR_APP_SECRET
     &fb_exchange_token=YOUR_SHORT_LIVED_TOKEN
   ```
   Or use a **System User Token** in Business Manager for a permanent token.

### 2. Push to GitHub

1. Create a new repo at github.com
2. Run in this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/disclose-reports.git
   git push -u origin main
   ```

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
2. Add environment variable:
   - Name: `META_ACCESS_TOKEN`
   - Value: your long-lived token from step 1
3. Click Deploy

### 4. Add custom domain (Hostinger DNS)

1. In Vercel: Settings → Domains → Add `reports.disclosemedia.co.nz`
2. Vercel will show you a CNAME record, e.g.:
   - **Name:** `reports`
   - **Value:** `cname.vercel-dns.com`
3. In Hostinger: Domains → DNS Zone → Add CNAME record with those values
4. Wait 5–30 minutes for DNS to propagate

## Local development

```bash
npm install
cp .env.example .env.local
# Add your token to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
