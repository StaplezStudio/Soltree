# Netlify Deployment Instructions

## Quick Setup for GitHub → Netlify

1. **Upload to GitHub:**
   - Create a new repository on GitHub
   - Upload the project files from `why/soltreez-netlify-ready.zip`
   - Make sure all files are in the root directory

2. **Connect to Netlify:**
   - Go to https://app.netlify.com
   - Click "New site from Git"
   - Choose GitHub and select your repository
   - Use these build settings:
     - **Build command:** `npm run build:netlify`
     - **Publish directory:** `client/dist`

3. **Environment Variables (if needed):**
   - In Netlify dashboard, go to Site settings → Environment variables
   - Add any required environment variables with `VITE_` prefix

## Build Configuration

The project includes:
- `netlify.toml` - Netlify configuration file
- `client/package.json` - Frontend-only dependencies
- `client/vite.config.ts` - Optimized Vite build config
- SPA routing redirects configured

## Key Features for Netlify:
- ✅ Frontend-only build (no server required)
- ✅ SPA routing with proper redirects
- ✅ Optimized bundle splitting
- ✅ Clean dependency management
- ✅ Production-ready configuration

The site will automatically deploy on every push to your main branch.