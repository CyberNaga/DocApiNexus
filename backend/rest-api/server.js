const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

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

app.get("/api/users", authenticateToken, (req, res) => {
  res.json([
    {
      id: 1,
      name: "Dheena",
      role: "Security Engineer"
    },
    {
      id: 2,
      name: "DocApiNexus",
      role: "API Project"
    }
  ]);
});

app.listen(PORT, () => {
  console.log(`DocApiNexus REST API running on http://localhost:${PORT}`);
});