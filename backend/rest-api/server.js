const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

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

app.get("/api/users", (req, res) => {
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