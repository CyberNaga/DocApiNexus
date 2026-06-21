const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const crypto = require("crypto");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const pool = require("./db/database");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  const startTime = Date.now();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: "rest-api",
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
      })
    );
  });

  next();
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

app.get("/", (req, res) => {
  res.json({
    project: "DocApiNexus",
    service: "REST API",
    status: "running",
    message: "Welcome to DocApiNexus REST API"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});


function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Access token missing"
    });
  }

  jwt.verify(token, JWT_SECRET, (error, decodedUser) => {
    if (error) {
      return res.status(403).json({
        error: "Invalid or expired token"
      });
    }

    req.user = decodedUser;
    next();
  });
}

app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, role, created_at FROM users ORDER BY id ASC"
    );

    res.json({
      service: "REST API",
      source: "PostgreSQL database",
      requestedBy: req.user.username,
      users: result.rows
    });
  } catch (error) {
    console.error("REST users fetch error:", error.message);

    res.status(500).json({
      error: "Failed to fetch users from database"
    });
  }
});

app.listen(PORT, () => {
  console.log(`DocApiNexus REST API running on http://localhost:${PORT}`);
});