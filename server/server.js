const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const port = process.env.PORT || 3000;
const fs = require("fs");
const bcrypt = require("bcrypt");
const homedata = require('./router/data')
const ai = require('./router/ai')
const thera = require('./router/therapy');
const { json } = require("stream/consumers");
let dbPath = "./database";
let fai= require('./router/fai')
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath);
  console.log("📁 Created 'database' folder");
}

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.json()); // Required to parse JSON body
app.use(cors());

app.get("/", (req, res) => {
  res.render("root", { var: "null" }); // Passing data to EJS
});

app.get("/home/hi/:id", (req, res) => {
  let id = req.params.id;
  res.render("home", { id }); // Passing data to EJS
});

app.get("/voice.json", (req, res) => {
  res.type("application/json");
  res.sendFile(path.join(__dirname, "voice.json"));
});

app.get("/sounds/:id", (req, res) => {
  let id = req.params.id;
  res.sendFile(path.join(__dirname, "..", "public", "assets", "sounds", `${id}.mp3`));
});

app.get("/home/:feature/:name", (req, res) => {
  const feature = req.params.feature;
  const name = req.params.name;
  try {
    res.render(`${feature}`, { name });
  } catch (err) {
    res.status(404).send("Page not found");
  }
});

app.post("/data/reg", async (req, res) => {
  const data = req.body;

  if (!data.user || !data.password || !data.name) {
    return res.status(400).json({ msg: "Missing fields" });
  }

  const userFilePath = path.join(__dirname, "database", `${data.user}.json`);
  const indexFilePath = path.join(__dirname, "database", "index.json");

  // Block if user file already exists
  if (fs.existsSync(userFilePath)) {
    return res.status(409).json({ msg: "User already exists!" });
  }

  try {
    // Encrypt password
    const hashed = await bcrypt.hash(data.password, 10);
    data.key = hashed;
    delete data.password;

    // Save user's personal file
    fs.writeFileSync(userFilePath, JSON.stringify(data, null, 2), "utf-8");

    const newEntry = {
      username: data.user,
      name: data.name,
      XP: 0,
      level: 1,
      pack: "free"
    };

    // Read existing index.json or create empty array
    let indexData = [];
    if (fs.existsSync(indexFilePath)) {
      try {
        const file = fs.readFileSync(indexFilePath, "utf-8");
        const parsed = JSON.parse(file);
        indexData = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        console.warn("Corrupted index.json — resetting.");
        indexData = [];
      }
    }

    // Check if user already exists in index
    const exists = indexData.some(u => u.username === data.user);
    if (exists) {
      return res.status(409).json({ msg: "User already in index!" });
    }

    // Append new entry
    indexData.push(newEntry);

    // Save index.json
    fs.writeFileSync(indexFilePath, JSON.stringify(indexData, null, 2), "utf-8");

    res.status(200).json({ msg: "User registered successfully!" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ msg: "Internal server error" });
  }
});

app.post("/cred", async (req, res) => {
  let { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: "Missing fields" });
  }

  console.log(`Login attempt for user: ${username}`); // Improved debug log
  let filedata = path.join(__dirname, "database", `${username}.json`);
  try {
    let filedataget = fs.readFileSync(filedata, "utf-8");
    let maindata = JSON.parse(filedataget);
    let hashpass = maindata.key;
    let check = await bcrypt.compare(password, hashpass);
    if (check) {
      res.status(200).json({ msg: "Login successful" });
    } else {
      res.status(400).json({ msg: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Login error:", err); // Log error for debugging
    res.status(400).json({ msg: "Invalid credentials" });
  }
});
app.post("/home/leaderboard/:id", async (req, res) => {
  const {
    username,
    page = 1,
    limit = 10,
    users = false,
    searchFilter,
    fidME
  } = req.body;

  const filePath = path.join(__dirname, "database", "index.json");

  try {
    // Read and parse leaderboard data
    let fileData = fs.readFileSync(filePath, "utf-8");
    let leaderboard;

    try {
      const parsed = JSON.parse(fileData);
      leaderboard = Array.isArray(parsed) ? parsed : [parsed]; // fix if object
    } catch (e) {
      console.warn("index.json is malformed, returning empty leaderboard.");
      return res.status(200).json({ leaderboard: [] });
    }

    let filteredData = leaderboard;

    // 1. Filter only current user (if users = true)
    if (users && username) {
      filteredData = leaderboard.filter(user => user.name === username);
    }

    // 2. Apply search filter
    if (searchFilter && searchFilter.trim() !== "") {
      const filter = searchFilter.toLowerCase();
      filteredData = leaderboard.filter(user =>
        Object.values(user).some(val =>
          typeof val === "string" && val.toLowerCase().includes(filter)
        )
      );
      return res.status(200).json({ leaderboard: filteredData });
    }

    // 3. Find-Me mode (get surrounding ranks)
    if (fidME && username) {
      const idx = leaderboard.findIndex(user => user.name === username);
      if (idx !== -1) {
        const start = Math.max(0, idx - 5);
        const end = Math.min(leaderboard.length, idx + 6);
        const aroundUser = leaderboard.slice(start, end);
        return res.status(200).json({
          leaderboard: aroundUser,
          userRank: idx + 1,
          user: leaderboard[idx]
        });
      } else {
        return res.status(404).json({ msg: "User not found in leaderboard" });
      }
    }

    // 4. Paginated response (default behavior)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    res.status(200).json({ leaderboard: paginatedData });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ msg: "Internal server error" });
  }
});

app.use('/home', homedata);
app.use('/ai', ai)
app.use('/home', thera)
app.use('/ai' ,fai)


console.log("✅ Everything above listen() passed...");
app.listen(port, () => {
  console.log(`Your app is listening at http://localhost:${port}`);
});