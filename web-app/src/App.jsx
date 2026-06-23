import { useState } from "react";
import "./App.css";

const gatewayBaseUrl = "http://localhost:8080";

function App() {
  const [username, setUsername] = useState("normaluser_auto");
  const [password, setPassword] = useState("Strong@12345");
  const [token, setToken] = useState("");
  const [loginMessage, setLoginMessage] = useState("Not logged in");

  const [restResponse, setRestResponse] = useState("REST API response will appear here.");
  const [graphqlResponse, setGraphqlResponse] = useState("GraphQL API response will appear here.");

  const formatJson = (data) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const registerUser = async () => {
    try {
      const response = await fetch(`${gatewayBaseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      setLoginMessage(`Register: ${response.status} - ${data.message || data.error || "Completed"}`);
    } catch (error) {
      setLoginMessage(`Register failed: ${error.message}`);
    }
  };

  const loginUser = async () => {
    try {
      const response = await fetch(`${gatewayBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      const jwt = data.token || data.accessToken || data.jwt;

      if (response.ok && jwt) {
        setToken(jwt);
        setLoginMessage(`Logged in as ${username}`);
      } else {
        setLoginMessage(data.error || "Login failed");
      }
    } catch (error) {
      setLoginMessage(`Login failed: ${error.message}`);
    }
  };

  const callRestApi = async () => {
    try {
      const response = await fetch(`${gatewayBaseUrl}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      setRestResponse(formatJson(data));
    } catch (error) {
      setRestResponse(`REST API failed: ${error.message}`);
    }
  };

  const callGraphqlApi = async () => {
    try {
      const response = await fetch(`${gatewayBaseUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: "{ profile }"
        })
      });

      const data = await response.json();
      setGraphqlResponse(formatJson(data));
    } catch (error) {
      setGraphqlResponse(`GraphQL API failed: ${error.message}`);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="badge">API Security · Microservices · DevSecOps</div>
        <h1>DocApiNexus</h1>
        <p>
          A local API security lab for REST, GraphQL, JWT authentication,
          microservices, Docker, Kubernetes, CI/CD security, and observability.
        </p>
      </section>

      <section className="login-card">
        <div className="login-header">
          <h2>Project Login Console</h2>
          <p>Authenticate through the API Gateway and test secured APIs.</p>
        </div>

        <div className="login-grid">
          <div className="field-group">
            <label>Username</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
            />
          </div>

          <div className="field-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
            />
          </div>
        </div>

        <div className="button-row">
          <button className="secondary-button" onClick={registerUser}>
            Register
          </button>
          <button className="primary-button" onClick={loginUser}>
            Login
          </button>
        </div>

        <div className={token ? "status-box success" : "status-box"}>
          {loginMessage}
        </div>
      </section>

      <section className="api-actions">
        <button onClick={callRestApi}>Call REST API</button>
        <button onClick={callGraphqlApi}>Call GraphQL API</button>
      </section>

      <section className="response-grid">
        <div className="response-card">
          <div className="response-title">
            <span>REST API</span>
            <small>/api/users</small>
          </div>
          <pre>{restResponse}</pre>
        </div>

        <div className="response-card">
          <div className="response-title">
            <span>GraphQL API</span>
            <small>/graphql</small>
          </div>
          <pre>{graphqlResponse}</pre>
        </div>
      </section>
    </main>
  );
}

export default App;