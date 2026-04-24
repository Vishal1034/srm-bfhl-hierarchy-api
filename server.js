const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { processData } = require("./src/processor");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

const identity = {
  fullName: process.env.FULL_NAME || "John Doe",
  dob: process.env.DOB_DDMMYYYY || "17091999",
  email: process.env.EMAIL_ID || "john.doe@college.edu",
  roll: process.env.COLLEGE_ROLL_NUMBER || "21CS1001"
};

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/bfhl", (req, res) => {
  try {
    const payload = req.body || {};
    const result = processData(payload.data, identity);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
