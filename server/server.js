const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const port = process.env.PORT || 3000;
const fs = require("fs");
const bcrypt = require("bcrypt");
const homedata = require('./router/data')
const ai  = require('./router/ai')
const thera  = require('./router/therapy');
let dbPath = "./database";
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
  let data = req.body;

  if (!data.user || !data.password || !data.name) {
    return res.status(400).json({ msg: "Missing fields" });
  }

  console.log(`Received registration request for user: ${data.user}`); // Improved debug log
  let file_pth = path.join(__dirname, "database", `${data.user}.json`);
  try {
    let key = await bcrypt.hash(data.password, 10);
    data.key = key;
    delete data.password;
    fs.writeFileSync(file_pth, JSON.stringify(data, null, 2), "utf-8");
    res.status(200).json({ msg: "User registered successfully!" });
  } catch (err) {
    console.error("Registration error:", err); // Log error for debugging
    res.status(400).json({ msg: "Error, try again!" });
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

app.use('/home',homedata);
app.use('/ai' ,ai)
app.use('/home',thera)


console.log("✅ Everything above listen() passed...");
app.listen(port, () => {
  console.log(`Your app is listening at http://localhost:${port}`);
});