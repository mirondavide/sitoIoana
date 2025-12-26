# Admin Panel Setup Guide

## Overview
You now have a password-protected admin panel that allows you to add products without writing code! This guide will walk you through the setup process.

## What Was Created

### New Files:
1. **admin.html** - The admin interface with a form for adding products
2. **js/admin.js** - Client-side logic for the admin form
3. **netlify/functions/upload-image.js** - Serverless function to upload images to Cloudinary
4. **netlify/functions/save-product.js** - Serverless function to save products and commit to GitHub
5. **netlify.toml** - Netlify configuration
6. **package.json** - Dependencies for serverless functions
7. **.gitignore** - Ignore node_modules and build files

## Setup Steps

### Step 1: Create Netlify Account (5 minutes)

1. Go to https://netlify.com
2. Sign up for a free account (use GitHub login for easier integration)
3. Click "Add new site" → "Import an existing project"
4. Choose "GitHub" and authorize Netlify
5. Select your repository: `mirondavide/sitoIoana`
6. Configure build settings:
   - **Build command**: Leave empty
   - **Publish directory**: `.` (just a dot)
   - **Branch to deploy**: `main`
7. Click "Deploy site"
8. Wait for deployment to complete (~1 minute)
9. Note your site URL (e.g., `https://random-name-123456.netlify.app`)

### Step 2: Enable Netlify Identity (5 minutes)

1. In Netlify dashboard, go to **Site Settings** → **Identity**
2. Click **"Enable Identity"**
3. Under **Registration**, select **"Invite only"**
4. Scroll to **Services** → **Git Gateway**
5. Click **"Enable Git Gateway"**
6. Go to **Identity** tab (top navigation)
7. Click **"Invite users"**
8. Enter your email address
9. Check your email and click the invitation link
10. Set your password

### Step 3: Create Cloudinary Account (5 minutes)

1. Go to https://cloudinary.com
2. Sign up for a free account
3. After login, go to **Dashboard**
4. Note these credentials (you'll need them):
   - **Cloud name**: (shown at top)
   - **API Key**: (click "API Keys" in sidebar)
   - **API Secret**: (click eye icon to reveal)

### Step 4: Create GitHub Personal Access Token (5 minutes)

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `Netlify Admin Panel`
4. Expiration: Choose "No expiration" or "1 year"
5. Select scopes: **Check `repo` (Full control of private repositories)**
6. Click **"Generate token"** at bottom
7. **IMPORTANT**: Copy the token immediately (you won't see it again!)

### Step 5: Add Environment Variables to Netlify (5 minutes)

1. In Netlify dashboard, go to **Site Settings** → **Environment Variables**
2. Click **"Add a variable"** and add each of these:

```
CLOUDINARY_CLOUD_NAME = your_cloud_name_from_step3
CLOUDINARY_API_KEY = your_api_key_from_step3
CLOUDINARY_API_SECRET = your_api_secret_from_step3
GITHUB_TOKEN = your_token_from_step4
GITHUB_REPO = mirondavide/sitoIoana
GITHUB_BRANCH = main
```

3. Click **"Save"** for each variable

### Step 6: Redeploy Site (2 minutes)

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Wait for deployment to complete (~1-2 minutes)

### Step 7: Test Admin Panel (5 minutes)

1. Navigate to: `https://your-site-url.netlify.app/admin`
2. You should see a login screen (Netlify Identity)
3. Login with the email/password you set in Step 2
4. You should now see the admin form!
5. Try adding a test product:
   - Fill in all required fields (marked with *)
   - Upload an image
   - Click "Aggiungi Prodotto"
6. Wait 30-60 seconds for the site to rebuild
7. Check your homepage - the new product should appear!

## How to Use the Admin Panel

### Accessing the Admin Panel:
- URL: `https://your-site-url.netlify.app/admin`
- You'll need to login with your Netlify Identity credentials

### Adding a Product:

1. **Nome Prodotto** (Required) - Product name
2. **Prezzo** (Required) - Price in format: `18.00` (with 2 decimals)
3. **Descrizione** (Required) - Product description
4. **Categorie** (Required) - Check at least one category:
   - Asilo, Bimbo, Bimba, Cucina, Tovagliette, Grembiuli, Regalo, Borse, Decorazioni
5. **Prodotto in evidenza** (Optional) - Check to show in "I più amati" section
6. **Immagini** (Required) - Upload 1 or more images:
   - Max 5MB per image
   - Formats: WebP, JPG, PNG (auto-converted to WebP)
7. **Altezza/Larghezza** (Optional) - Product dimensions
8. Click **"Aggiungi Prodotto"**

### After Submitting:
- Images are uploaded to Cloudinary (hosted in the cloud)
- Product is added to `products.json`
- Changes are committed to GitHub automatically
- Netlify rebuilds the site (takes 30-60 seconds)
- New product appears on your website!

## Sharing Access with Others

To give someone else admin access:

1. In Netlify dashboard, go to **Identity** tab
2. Click **"Invite users"**
3. Enter their email address
4. They'll receive an invitation email
5. They click the link and set their password
6. Share the admin URL: `https://your-site-url.netlify.app/admin`
7. They can now login and add products!

**Note**: Each person's commits will show in your GitHub history with their email.

## Troubleshooting

### "Unauthorized" error:
- Make sure you're logged in to Netlify Identity
- Click the logout button and login again

### "Error uploading image":
- Check image file size (must be under 5MB)
- Verify Cloudinary credentials in Netlify environment variables

### "Error saving product":
- Check GitHub token has `repo` permissions
- Verify GITHUB_TOKEN is set in Netlify environment variables
- Check that GITHUB_REPO is exactly: `mirondavide/sitoIoana`

### Product not appearing on site:
- Wait at least 60 seconds for Netlify to rebuild
- Check **Deploys** tab in Netlify - should show a new deploy
- If deploy failed, check the deploy logs for errors

### Images showing as URLs instead of local paths:
- This is intentional! Cloudinary hosts images, so products.json will contain full URLs
- The site will display them correctly

## Cost

Everything is **FREE** with generous limits:
- **Netlify**: 100GB bandwidth, 300 build minutes/month
- **Cloudinary**: 25GB storage, 25 credits/month
- **GitHub**: Unlimited commits

This should be more than enough for a product catalog site!

## Security

- ✅ Admin panel is password-protected (Netlify Identity)
- ✅ Only invited users can access
- ✅ All API keys stored as environment variables (not in code)
- ✅ HTTPS automatically enabled
- ✅ All commits tracked in GitHub with user email

## Next Steps

1. Follow the setup steps above
2. Test adding a product
3. Invite others if needed
4. Update your DNS to point to Netlify (optional)
5. Consider adding a custom domain in Netlify settings

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Look at Netlify deploy logs: **Deploys** → Click on latest deploy → **Deploy log**
3. Check browser console for errors (F12 → Console tab)
4. Verify all environment variables are set correctly

Enjoy your new admin panel! 🎉
