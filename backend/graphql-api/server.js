const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const client = require("prom-client");
const { graphqlHTTP } = require("express-graphql");
const {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLList
} = require("graphql");

require("dotenv").config();

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(cors());
app.use(express.json());

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
        service: "graphql-api",
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

const PORT = process.env.PORT || 4000;
client.collectDefaultMetrics();

const httpRequestDuration = new client.Histogram({
  name: "graphql_api_http_request_duration_seconds",
  help: "HTTP request duration in seconds for GraphQL API",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});
const JWT_SECRET = process.env.JWT_SECRET;

const users = [
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
];

const UserType = new GraphQLObjectType({
  name: "User",
  fields: {
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    role: { type: GraphQLString }
  }
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    message: {
      type: GraphQLString,
      resolve() {
        return "DocApiNexus GraphQL API is running";
      }
    },
    users: {
      type: new GraphQLList(UserType),
      resolve() {
        return users;
      }
    },
    user: {
      type: UserType,
      args: {
        id: { type: GraphQLInt }
      },
      resolve(parent, args) {
        return users.find((user) => user.id === args.id);
      }
    },
    profile: {
  type: GraphQLString,
  resolve(parent, args, context) {
    if (!context.user) {
      throw new Error("Unauthorized. Valid JWT token required.");
    }

    return `Welcome ${context.user.username}. Your role is ${context.user.role}`;
  }
}
  }
});

const schema = new GraphQLSchema({
  query: RootQuery
});

function getUserFromToken(req) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

app.use(
  "/graphql",
  graphqlHTTP((req) => ({
    schema,
    graphiql: true,
    context: {
      user: getUserFromToken(req)
    }
  }))
);

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "graphql-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true
  })
);

app.listen(PORT, () => {
  console.log(`DocApiNexus GraphQL API running on http://localhost:${PORT}`);
  console.log(`GraphQL endpoint available at http://localhost:${PORT}/graphql`);
});