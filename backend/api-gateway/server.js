const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 8080;

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:5000";

const REST_API_URL =
  process.env.REST_API_URL || "http://localhost:3000";

const GRAPHQL_API_URL =
  process.env.GRAPHQL_API_URL || "http://localhost:4000";

const AUDIT_SERVICE_URL =
  process.env.AUDIT_SERVICE_URL || "http://localhost:6000";

app.use(helmet());
app.use(cors());

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
        service: "api-gateway",
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

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later."
  }
});

app.use(apiLimiter);

app.get("/health", (req, res) => {
  res.json({
    service: "DocApiNexus API Gateway",
    status: "healthy",
    routes: {
            auth: "/auth",
            rest: "/api",
            graphql: "/graphql",
            audit: "/audit"
            },
            upstreams: {
            authService: AUTH_SERVICE_URL,
            restApi: REST_API_URL,
            graphqlApi: GRAPHQL_API_URL,
            auditService: AUDIT_SERVICE_URL
            }
  });
});

app.use(
  "/auth",
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl,
    on: {
  proxyReq: (proxyReq, req) => {
    if (req.requestId) {
      proxyReq.setHeader("x-request-id", req.requestId);
    }
  }
}
  })
);

app.use(
  "/api",
  createProxyMiddleware({
    target: REST_API_URL,
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl,
    on: {
  proxyReq: (proxyReq, req) => {
    if (req.requestId) {
      proxyReq.setHeader("x-request-id", req.requestId);
    }
  }
}
  })
);

app.use(
  "/graphql",
  createProxyMiddleware({
    target: GRAPHQL_API_URL,
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl,
    on: {
  proxyReq: (proxyReq, req) => {
    if (req.requestId) {
      proxyReq.setHeader("x-request-id", req.requestId);
    }
  }
}
  })
);
    
app.use(
  "/audit",
  createProxyMiddleware({
    target: AUDIT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl,
    on: {
  proxyReq: (proxyReq, req) => {
    if (req.requestId) {
      proxyReq.setHeader("x-request-id", req.requestId);
    }
  }
}
  })
);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found in API Gateway",
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`DocApiNexus API Gateway running on http://localhost:${PORT}`);
  console.log(`Auth Service target: ${AUTH_SERVICE_URL}`);
  console.log(`REST API target: ${REST_API_URL}`);
  console.log(`GraphQL API target: ${GRAPHQL_API_URL}`);
});