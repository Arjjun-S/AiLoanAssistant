# 🚀 Deployment Guide for Render

Follow these step-by-step instructions to deploy your AI Loan Assistant on Render (free tier).

---

## Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Render Account** - Create free account at [render.com](https://render.com)
3. **OpenRouter API Key** - Get from [openrouter.ai/keys](https://openrouter.ai/keys)

---

## Step 1: Prepare Your Code

### 1.1 Create a GitHub Repository

```bash
# Navigate to your project
cd loan-assistant-mvp

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - AI Loan Assistant MVP"

# Add your GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/loan-assistant-mvp.git

# Push to GitHub
git push -u origin main
```

### 1.2 Project Structure Should Look Like:
```
loan-assistant-mvp/
├── client/           # Frontend (React)
├── server/           # Backend (Node.js)
└── README.md
```

---

## Step 2: Deploy Backend on Render

### 2.1 Create New Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository

### 2.2 Configure the Service

| Setting | Value |
|---------|-------|
| **Name** | `loan-assistant-api` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 2.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

| Key | Value |
|-----|-------|
| `OPENROUTER_API_KEY` | `your_openrouter_api_key_here` |
| `PORT` | `3001` |
| `FRONTEND_URL` | `https://your-frontend-url.vercel.app` (update after deploying frontend) |

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Note your backend URL: `https://loan-assistant-api.onrender.com`

---

## Step 3: Deploy Frontend on Vercel

### 3.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### 3.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Select your GitHub repository
3. Click **"Import"**

### 3.3 Configure Build Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3.4 Add Environment Variable

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://loan-assistant-api.onrender.com` |

> Replace with your actual Render backend URL from Step 2.4

### 3.5 Deploy

1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. Note your frontend URL: `https://loan-assistant.vercel.app`

---

## Step 4: Update CORS on Backend

After frontend is deployed, update the Render environment variable:

1. Go to Render dashboard → Your web service
2. Click **"Environment"**
3. Update `FRONTEND_URL` to your Vercel URL
4. Click **"Save Changes"**
5. The service will automatically redeploy

---

## Step 5: Test Your Deployment

1. Open your Vercel URL in a browser
2. You should see the AI Loan Assistant
3. Test the full loan application flow:
   - Select a loan type
   - Enter amount and tenure
   - Provide personal details
   - Complete KYC verification
   - Get approval/rejection
   - Download PDF (if approved)

---

## 🔧 Troubleshooting

### Backend Not Starting

Check the Render logs:
1. Go to your web service
2. Click **"Logs"**
3. Look for error messages

Common issues:
- Missing `OPENROUTER_API_KEY`
- Build failed - check `package.json` scripts

### CORS Errors

If you see CORS errors in browser console:
1. Verify `FRONTEND_URL` is set correctly on Render
2. Make sure it includes the full URL with `https://`
3. Redeploy the backend after changing environment variables

### PDF Downloads Not Working

The free tier has disk limitations. PDFs are stored in memory and should work for demo purposes.

---

## 📊 Monitoring

### Render Dashboard
- View logs and metrics
- Monitor resource usage
- Check deployment status

### Vercel Dashboard
- View deployment logs
- Monitor build times
- Check analytics

---

## 🎯 Demo Tips

1. **Keep the backend warm**: Free tier services sleep after 15 mins of inactivity. Visit the health endpoint before demo: `https://your-backend.onrender.com/health`

2. **Use test data**:
   - High income (approved): Salary ₹75,000, PAN: `ABCDE1234F`
   - Low income (rejected): Salary ₹20,000
   - Low credit (rejected): PAN: `LMNOP9012H`

3. **Show the architecture**: Explain the 5 agents during the demo

---

## 🔗 Quick Links

- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **OpenRouter**: https://openrouter.ai/keys
- **API Health Check**: `https://your-backend.onrender.com/health`

---

## 📝 After Deployment Checklist

- [ ] Backend deployed on Render
- [ ] Frontend deployed on Vercel
- [ ] `FRONTEND_URL` updated on Render
- [ ] `VITE_API_URL` set on Vercel
- [ ] Test full loan flow
- [ ] Test PDF download
- [ ] Verify approval/rejection scenarios

---

**🎉 Congratulations! Your AI Loan Assistant is now live!**
