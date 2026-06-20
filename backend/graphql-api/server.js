const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
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

const PORT = process.env.PORT || 4000;

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
    }
  }
});

const schema = new GraphQLSchema({
  query: RootQuery
});

app.get("/", (req, res) => {
  res.json({
    project: "DocApiNexus",
    service: "GraphQL API",
    status: "running",
    graphqlEndpoint: "/graphql"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "graphql-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
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