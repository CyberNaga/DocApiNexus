const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 6000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  const startTime = Date.now();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    httpRequestDuration
    .labels(req.method, req.route?.path || req.originalUrl, String(res.statusCode))
    .observe(durationMs / 1000);

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: "audit-service",
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

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100),
      action VARCHAR(100) NOT NULL,
      service VARCHAR(100),
      details JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Audit logs table is ready");
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Authorization header missing"
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Token missing"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      error: "Invalid or expired token"
    });
  }
}

app.get("/health", (req, res) => {
  res.json({
    service: "DocApiNexus Audit Service",
    status: "healthy"
  });
});

app.post("/audit/log", verifyToken, async (req, res) => {
  try {
    const { action, service, details } = req.body;
    const username = req.user.username;

    if (!action) {
      return res.status(400).json({
        error: "action is required"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO audit_logs (username, action, service, details)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, action, service, details, created_at;
      `,
      [username, action, service || "unknown", details || {}]
    );

    res.status(201).json({
      message: "Audit log created",
      log: result.rows[0]
    });
  } catch (error) {
    console.error("Audit log insert error:", error);
    res.status(500).json({
      error: "Failed to create audit log"
    });
  }
});

app.get("/audit/logs", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, action, service, details, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 50;
    `);

    res.json({
      service: "Audit Service",
      total: result.rows.length,
      logs: result.rows
    });
  } catch (error) {
    console.error("Audit log fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch audit logs"
    });
  }
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`DocApiNexus Audit Service running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize audit service database:", error);
    process.exit(1);
  });