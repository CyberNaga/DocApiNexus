const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db/database");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// Temporary in-memory user store.
// Later this will be replaced with database storage.
//const users = [];

app.get("/", (req, res) => {
  res.json({
    project: "DocApiNexus",
    service: "Auth Service",
    status: "running",
    endpoints: ["/auth/register", "/auth/login", "/auth/profile", "/health"]
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "auth-service",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.post("/auth/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required"
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at",
      [username, hashedPassword, role || "USER"]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    res.status(500).json({
      error: "Registration failed"
    });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required"
      });
    }

    const result = await pool.query(
      "SELECT id, username, password_hash, role FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid username or password"
      });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid username or password"
      });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN
      }
    );

    res.json({
      message: "Login successful",
      tokenType: "Bearer",
      accessToken: token,
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      error: "Login failed"
    });
  }
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

app.get("/auth/profile", authenticateToken, (req, res) => {
  res.json({
    message: "Protected profile accessed successfully",
    user: req.user
  });
});

app.listen(PORT, () => {
  console.log(`DocApiNexus Auth Service running on http://localhost:${PORT}`);
});