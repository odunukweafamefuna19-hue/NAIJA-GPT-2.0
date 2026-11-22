
require("dotenv").config({ path: "naija-config.env" });

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Public Supabase configuration
app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY
  });
});

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    name: "NAIJA GPT",
    version: "2.0.0",
    status: "ONLINE"
  });
});

// AI chat route
app.use("/api/chat", require("./routes/chat"));

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Page not found."
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(500).json({
    success: false,
    message: "Internal server error."
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log("NAIJA GPT 2.0 IS ONLINE");
  console.log(`Server running on port ${PORT}`);
});

