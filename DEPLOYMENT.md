# Deployment Guide | AeroLearn OS

This application is built with a lightweight Express backend serving static modern frontend assets. It can be deployed to any free cloud hosting platform in minutes.

---

## Deploy to Render (Recommended - Free Web Service)

1. **Create a GitHub Repository:**
   - Initialize git in the project root:
     ```bash
     git init
     git add .
     git commit -m "Initial commit of AeroLearn OS"
     ```
   - Create a private or public repository on GitHub and push your code:
     ```bash
     git remote add origin https://github.com/<your-username>/pdf-learning-dashboard.git
     git branch -M main
     git push -u origin main
     ```

2. **Link to Render:**
   - Go to [render.com](https://render.com) and create a free account.
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository.

3. **Configure Settings:**
   - **Name:** `aerolearn-os`
   - **Environment:** `Node`
   - **Build Command:** `npm install && node generate_curriculum.js`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

4. **Environment Variables:**
   - Add the following in Render's **Environment** tab:
     - `PORT`: `10000` (or leave default, Render sets `PORT` automatically)
     - `GEMINI_API_KEY`: `<your_gemini_api_key>` (Optional - fallback runs automatically if omitted)
     - `GEMINI_MODEL`: `gemini-flash-lite-latest`

5. **Deploy:**
   - Click **Create Web Service**. Your live learning dashboard will be online at `https://aerolearn-os.onrender.com`.

---

## Deploy to Railway

1. Install Railway CLI or connect via web at [railway.app](https://railway.app).
2. Create **New Project** > **Deploy from GitHub repo**.
3. Add variable `GEMINI_API_KEY` under project settings.
4. Railway will automatically detect `npm start` from `package.json` and deploy.

---

## Security Verification Checklist Before Pushing

- [x] `.env` is ignored in `.gitignore`.
- [x] No API keys are hardcoded in `public/app.js` or `public/index.html`.
- [x] `server.js` serves API requests without exposing API keys to the browser.
