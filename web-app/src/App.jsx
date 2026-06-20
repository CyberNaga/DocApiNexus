import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [username, setUsername] = useState("dheena");
  const [password, setPassword] = useState("Test@12345");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [restData, setRestData] = useState(null);
  const [graphqlData, setGraphqlData] = useState(null);

  const authBaseUrl = "http://localhost:5000";
  const restBaseUrl = "http://localhost:3000";
  const graphqlUrl = "http://localhost:4000/graphql";

  async function registerUser() {
    try {
      const response = await axios.post(`${authBaseUrl}/auth/register`, {
        username,
        password,
        role: "ADMIN"
      });

      setMessage(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setMessage(JSON.stringify(error.response?.data || error.message, null, 2));
    }
  }

  async function loginUser() {
    try {
      const response = await axios.post(`${authBaseUrl}/auth/login`, {
        username,
        password
      });

      setToken(response.data.accessToken);
      setMessage("Login successful. JWT token saved in frontend state.");
    } catch (error) {
      setMessage(JSON.stringify(error.response?.data || error.message, null, 2));
    }
  }

  async function callProtectedRestApi() {
    try {
      const response = await axios.get(`${restBaseUrl}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setRestData(response.data);
    } catch (error) {
      setRestData(error.response?.data || error.message);
    }
  }

  async function callProtectedGraphqlApi() {
    try {
      const response = await axios.post(
        graphqlUrl,
        {
          query: `
            {
              profile
            }
          `
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setGraphqlData(response.data);
    } catch (error) {
      setGraphqlData(error.response?.data || error.message);
    }
  }

  return (
    <div className="container">
      <h1>DocApiNexus Web App</h1>
      <p>React frontend connected to Auth, REST, and GraphQL services.</p>

      <div className="card">
        <h2>Login/Register</h2>

        <label>Username</label>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <div className="button-row">
          <button onClick={registerUser}>Register</button>
          <button onClick={loginUser}>Login</button>
        </div>
      </div>

      <div className="card">
        <h2>JWT Token</h2>
        <textarea value={token} readOnly rows="5" />
      </div>

      <div className="card">
        <h2>API Tests</h2>
        <div className="button-row">
          <button onClick={callProtectedRestApi}>Call Protected REST API</button>
          <button onClick={callProtectedGraphqlApi}>Call Protected GraphQL API</button>
        </div>
      </div>

      <div className="card">
        <h2>Message</h2>
        <pre>{message}</pre>
      </div>

      <div className="card">
        <h2>REST API Response</h2>
        <pre>{JSON.stringify(restData, null, 2)}</pre>
      </div>

      <div className="card">
        <h2>GraphQL API Response</h2>
        <pre>{JSON.stringify(graphqlData, null, 2)}</pre>
      </div>
    </div>
  );
}

export default App;