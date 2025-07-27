# SelfHelo - AI Therapy & Mood Tracker Web App

**SelfHelo** is a personalized, voice-enabled web application designed to support emotional well-being and mental clarity. Featuring an AI therapist named **Hina**, the app offers journal tracking, mood reflection, personalized goal setting, and memory-based chat therapy — all crafted with expressive UI/UX for a calming experience.

---

## 🌟 Features

### 🧠 AI Therapist ("Hina")

* Emotionally intelligent AI built with Llama-3 (via Groq API)
* Memory-aware responses based on user's emotional history
* Friendly, kid-safe, therapist-like tone

### 📝 Journaling & Mood Tracker

* Write and save daily reflections
* Visualize emotions through mood screens (`mood.ejs`)
* Track mental state and current goals

### 🔐 Auth System

* Registration & Login using bcrypt password hashing
* JSON-based database per user (`/server/database/{user}.json`)

### 🎵 Music Therapy

* Play soothing tracks from the integrated music player
* Route: `/music-player.html`

### 💬 Routes & Views

* `/` → root page
* `/home/hi/:id` → home screen with user context
* `/home/:feature/:name` → dynamic mood/therapy/journal pages
* `/ai` → AI-related endpoints
* `/cred` and `/data/reg` → login & registration endpoints

---

## 🛠️ Tech Stack

* **Backend**: Node.js, Express.js
* **Frontend**: EJS templating, HTML/CSS/JS
* **AI**: Python (Groq API, Llama 3.1), therapist logic in `therapist.py`
* **Data**: JSON files per user & memory:

  * `/database/{user}.json` for user info
  * `/mem/{user}.json` for AI memory

---

## 🔧 Setup Instructions

### 1. Clone the repository

```bash
git clone git@github.com:souravdpal/improve.git
cd improve
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup your `.env` file

Create a file `server/.env` with:

```env
thkey=your_groq_api_key_here
```

### 4. Run the server

```bash
cd server
node server.js
```

The app runs at: `http://localhost:3000`

---

## 📁 Project Structure

```
self_helo/
├── public/                  # Frontend assets
│   ├── css/                 # Stylesheets
│   ├── js/                  # Page scripts
│   └── music-player.html    # Music therapy page
├── server/
│   ├── router/              # Express routers
│   ├── views/               # EJS templates (UI)
│   ├── python/              # Python AI logic
│   ├── mem/                 # AI memory storage
│   ├── database/            # User data JSONs
│   └── server.js            # Entry point
```

---

## 🚨 Security Notes

* Do **NOT** commit `.env` to GitHub
* Add `.env` to `.gitignore` to prevent exposing your Groq API key

---

## 👨‍💻 Author

**Sourav D. Pal**

> Passionate about AI, mental health tech, and full-stack development.

GitHub: [@souravdpal](https://github.com/souravdpal)

---

## 💖 Future Enhancements

* Persistent database support (MongoDB or PostgreSQL)
* Dark/light theme toggle
* Chat memory visualization
* Voice-to-text journaling

---

*This project is made with love, purpose, and empathy.*
