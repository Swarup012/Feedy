# SSL/HTTPS Setup for Subdomain Architecture

## 🔒 Problem
When accessing `notion.faddy.site` or other organization subdomains, the browser shows "Not Secure" warning because the SSL certificate doesn't cover wildcard subdomains.

## ✅ Solution Overview
You need a **wildcard SSL certificate** that covers `*.faddy.site` in addition to `faddy.site`.

---

## 📋 Requirements

### Option 1: Let's Encrypt with Certbot (FREE - Recommended)
**Pros:** Free, automatic renewal, widely trusted
**Cons:** Requires shell access, 90-day validity (auto-renewed)

### Option 2: Cloudflare SSL (FREE - Easiest)
**Pros:** Free, automatic, includes DDoS protection, CDN
**Cons:** Traffic goes through Cloudflare

### Option 3: Commercial SSL Certificate
**Pros:** Longer validity, support
**Cons:** Costs money ($50-200/year)

---

## 🚀 RECOMMENDED: Setup with Cloudflare (Easiest)

### Step 1: Add Domain to Cloudflare
1. Go to https://dash.cloudflare.com
2. Click "Add a Site"
3. Enter `faddy.site`
4. Choose the FREE plan
5. Cloudflare will scan your DNS records

### Step 2: Update Nameservers
1. Cloudflare will provide 2 nameservers (e.g., `alex.ns.cloudflare.com`)
2. Go to your domain registrar (where you bought faddy.site)
3. Replace your current nameservers with Cloudflare's nameservers
4. Wait 1-24 hours for propagation (usually 1-2 hours)

### Step 3: Configure DNS in Cloudflare
Add these DNS records in Cloudflare:

```
Type    Name    Content                 Proxy Status    TTL
A       @       <YOUR_EC2_IP>          Proxied         Auto
A       *       <YOUR_EC2_IP>          Proxied         Auto
CNAME   www     faddy.site             Proxied         Auto
```

The `*` record is crucial - it covers ALL subdomains including `notion.faddy.site`

### Step 4: Configure SSL/TLS Settings
1. In Cloudflare Dashboard → SSL/TLS → Overview
2. Set SSL/TLS encryption mode to: **"Full (strict)"**
3. Go to SSL/TLS → Edge Certificates
4. Enable:
   - ✅ Always Use HTTPS
   - ✅ Automatic HTTPS Rewrites
   - ✅ Minimum TLS Version: 1.2

### Step 5: Update Your EC2 Setup
Since Cloudflare handles SSL termination, your Docker container can run on HTTP:

```yaml
# docker-compose.prod.yml stays the same
services:
  frontend:
    ports:
      - "5173:5173"  # HTTP is fine, Cloudflare handles HTTPS
```

### Step 6: Test
1. Wait for DNS propagation (check with `nslookup faddy.site`)
2. Visit `https://faddy.site` - Should show 🔒 Secure
3. Visit `https://notion.faddy.site` - Should show 🔒 Secure
4. Visit `https://anysubdomain.faddy.site` - Should show 🔒 Secure

---

## 🔧 ALTERNATIVE: Let's Encrypt with Nginx Reverse Proxy

If you prefer self-hosted SSL without Cloudflare:

### Step 1: Install Nginx on EC2
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Step 2: Create Nginx Config
Create `/etc/nginx/sites-available/faddy.site`:

```nginx
# Main domain
server {
    listen 80;
    server_name faddy.site www.faddy.site;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Wildcard subdomain
server {
    listen 80;
    server_name *.faddy.site;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/faddy.site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 3: Get Wildcard SSL Certificate
```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Get wildcard certificate (DNS challenge required)
sudo certbot certonly --manual --preferred-challenges dns -d faddy.site -d *.faddy.site

# Certbot will ask you to create a TXT record in your DNS
# Go to your DNS provider and add:
# Type: TXT
# Name: _acme-challenge
# Value: <value provided by certbot>

# Wait a few minutes, then press Enter in certbot

# Start nginx
sudo systemctl start nginx
```

### Step 4: Update Nginx Config for SSL
Edit `/etc/nginx/sites-available/faddy.site`:

```nginx
# Main domain - HTTP redirect
server {
    listen 80;
    server_name faddy.site www.faddy.site;
    return 301 https://$server_name$request_uri;
}

# Main domain - HTTPS
server {
    listen 443 ssl http2;
    server_name faddy.site www.faddy.site;
    
    ssl_certificate /etc/letsencrypt/live/faddy.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/faddy.site/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Wildcard subdomain - HTTP redirect
server {
    listen 80;
    server_name *.faddy.site;
    return 301 https://$host$request_uri;
}

# Wildcard subdomain - HTTPS
server {
    listen 443 ssl http2;
    server_name *.faddy.site;
    
    ssl_certificate /etc/letsencrypt/live/faddy.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/faddy.site/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Setup Auto-Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
# Check it with:
sudo systemctl status certbot.timer
```

---

## 🔍 Troubleshooting

### Issue: "Not Secure" still showing
**Check:**
```bash
# Verify SSL certificate covers wildcard
echo | openssl s_client -servername notion.faddy.site -connect faddy.site:443 2>/dev/null | openssl x509 -noout -text | grep DNS
```

Should show:
```
DNS:faddy.site, DNS:*.faddy.site
```

### Issue: DNS not resolving
```bash
# Check DNS propagation
nslookup notion.faddy.site
dig notion.faddy.site

# Should point to your EC2 IP
```

### Issue: Port 80/443 blocked
```bash
# Check AWS Security Group
# In EC2 → Security Groups → Inbound Rules
# Should have:
# Type: HTTP, Port: 80, Source: 0.0.0.0/0
# Type: HTTPS, Port: 443, Source: 0.0.0.0/0
```

### Issue: Nginx not proxying correctly
```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check if Next.js is running
curl http://localhost:5173

# Verify Docker container is up
docker ps
```

---

## 📊 Comparison: Cloudflare vs Let's Encrypt

| Feature | Cloudflare | Let's Encrypt + Nginx |
|---------|------------|----------------------|
| **Cost** | Free | Free |
| **Setup Time** | 10 minutes | 30-60 minutes |
| **SSL Renewal** | Automatic | Automatic (90 days) |
| **DDoS Protection** | ✅ Yes | ❌ No |
| **CDN/Caching** | ✅ Yes | ❌ No |
| **Analytics** | ✅ Yes | ❌ No |
| **Control** | Less (proxy) | Full control |
| **IP Visibility** | Hidden | Exposed |
| **Certificate Validity** | 15 years | 90 days |

---

## ✅ Recommended Approach

**For most users:** Use **Cloudflare** (easiest, fastest, includes DDoS protection)

**If you need full control:** Use **Let's Encrypt + Nginx**

---

## 🎯 Quick Checklist

- [ ] Choose SSL solution (Cloudflare or Let's Encrypt)
- [ ] Update DNS records to include wildcard `*` entry
- [ ] Get wildcard SSL certificate (`*.faddy.site`)
- [ ] Configure reverse proxy (if using Nginx)
- [ ] Update AWS Security Group (allow ports 80, 443)
- [ ] Test main domain: `https://faddy.site`
- [ ] Test subdomain: `https://notion.faddy.site`
- [ ] Test random subdomain: `https://test.faddy.site`
- [ ] Verify "Secure" 🔒 badge in browser

---

## 📞 Need Help?

After implementing one of these solutions, test with:
```bash
# Check SSL certificate
curl -vI https://notion.faddy.site

# Should show successful SSL handshake and 200 OK
```
