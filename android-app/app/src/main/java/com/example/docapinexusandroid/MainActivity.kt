package com.example.docapinexusandroid

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class MainActivity : ComponentActivity() {

    private val gatewayBaseUrl = "http://10.0.2.2:8080"

    private val authBaseUrl = gatewayBaseUrl
    private val restBaseUrl = gatewayBaseUrl
    private val graphqlUrl = "$gatewayBaseUrl/graphql"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            DocApiNexusApp()
        }
    }

    @Composable
    fun DocApiNexusApp() {
        var username by remember { mutableStateOf("androiduser") }
        var password by remember { mutableStateOf("Test@12345") }
        var token by remember { mutableStateOf("") }
        var message by remember { mutableStateOf("") }
        var restResponse by remember { mutableStateOf("") }
        var graphqlResponse by remember { mutableStateOf("") }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(18.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text(
                text = "DocApiNexus Android App",
                style = MaterialTheme.typography.headlineSmall
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = username,
                onValueChange = { username = it },
                label = { Text("Username") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))

            Row {
                Button(
                    onClick = {
                        registerUser(username, password) {
                            message = it
                        }
                    }
                ) {
                    Text("Register")
                }

                Spacer(modifier = Modifier.width(12.dp))

                Button(
                    onClick = {
                        loginUser(username, password) { response, jwt ->
                            message = response
                            token = jwt
                        }
                    }
                ) {
                    Text("Login")
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            Button(
                onClick = {
                    callProtectedRestApi(token) {
                        restResponse = it
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Call Protected REST API")
            }

            Spacer(modifier = Modifier.height(10.dp))

            Button(
                onClick = {
                    callProtectedGraphqlApi(token) {
                        graphqlResponse = it
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Call Protected GraphQL API")
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text("JWT Token", style = MaterialTheme.typography.titleMedium)
            Text(token.ifEmpty { "No token yet" })

            Spacer(modifier = Modifier.height(20.dp))

            Text("Message", style = MaterialTheme.typography.titleMedium)
            Text(message)

            Spacer(modifier = Modifier.height(20.dp))

            Text("REST API Response", style = MaterialTheme.typography.titleMedium)
            Text(restResponse)

            Spacer(modifier = Modifier.height(20.dp))

            Text("GraphQL API Response", style = MaterialTheme.typography.titleMedium)
            Text(graphqlResponse)
        }
    }

    private fun registerUser(username: String, password: String, callback: (String) -> Unit) {
        thread {
            try {
                val json = JSONObject()
                json.put("username", username)
                json.put("password", password)
                json.put("role", "ADMIN")

                val response = postJson("$authBaseUrl/auth/register", json.toString(), null)

                runOnUiThread {
                    callback(response)
                }
            } catch (e: Exception) {
                runOnUiThread {
                    callback("Register error: ${e.message}")
                }
            }
        }
    }

    private fun loginUser(username: String, password: String, callback: (String, String) -> Unit) {
        thread {
            try {
                val json = JSONObject()
                json.put("username", username)
                json.put("password", password)

                val response = postJson("$authBaseUrl/auth/login", json.toString(), null)
                val responseJson = JSONObject(response)
                val accessToken = responseJson.optString("accessToken", "")

                runOnUiThread {
                    callback(response, accessToken)
                }
            } catch (e: Exception) {
                runOnUiThread {
                    callback("Login error: ${e.message}", "")
                }
            }
        }
    }

    private fun callProtectedRestApi(token: String, callback: (String) -> Unit) {
        thread {
            try {
                val response = getJson("$restBaseUrl/api/users", token)

                runOnUiThread {
                    callback(response)
                }
            } catch (e: Exception) {
                runOnUiThread {
                    callback("REST API error: ${e.message}")
                }
            }
        }
    }

    private fun callProtectedGraphqlApi(token: String, callback: (String) -> Unit) {
        thread {
            try {
                val json = JSONObject()
                json.put("query", "{ profile }")

                val response = postJson(graphqlUrl, json.toString(), token)

                runOnUiThread {
                    callback(response)
                }
            } catch (e: Exception) {
                runOnUiThread {
                    callback("GraphQL API error: ${e.message}")
                }
            }
        }
    }

    private fun postJson(urlString: String, jsonBody: String, token: String?): String {
        val url = URL(urlString)
        val connection = url.openConnection() as HttpURLConnection

        connection.requestMethod = "POST"
        connection.setRequestProperty("Content-Type", "application/json")

        if (!token.isNullOrEmpty()) {
            connection.setRequestProperty("Authorization", "Bearer $token")
        }

        connection.doOutput = true

        val writer = OutputStreamWriter(connection.outputStream)
        writer.write(jsonBody)
        writer.flush()
        writer.close()

        return connection.inputStream.bufferedReader().readText()
    }

    private fun getJson(urlString: String, token: String): String {
        val url = URL(urlString)
        val connection = url.openConnection() as HttpURLConnection

        connection.requestMethod = "GET"
        connection.setRequestProperty("Content-Type", "application/json")

        if (token.isNotEmpty()) {
            connection.setRequestProperty("Authorization", "Bearer $token")
        }

        return connection.inputStream.bufferedReader().readText()
    }
}