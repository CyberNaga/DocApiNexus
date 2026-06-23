package com.example.docapinexusandroid

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            DocApiNexusScreen()
        }
    }
}

@Composable
fun DocApiNexusScreen() {
    val baseUrl = "http://10.0.2.2:8080"

    var username by remember { mutableStateOf("normaluser_auto") }
    var password by remember { mutableStateOf("Strong@12345") }
    var token by remember { mutableStateOf("") }

    var status by remember { mutableStateOf("Not logged in") }
    var restResponse by remember { mutableStateOf("REST API response will appear here.") }
    var graphqlResponse by remember { mutableStateOf("GraphQL API response will appear here.") }

    val scope = rememberCoroutineScope()
    val inputTextStyle = TextStyle(
        color = Color.White,
        fontSize = 16.sp,
        fontWeight = FontWeight.SemiBold,
        fontFamily = FontFamily.SansSerif
    )

    val inputColors = OutlinedTextFieldDefaults.colors(
        focusedTextColor = Color.White,
        unfocusedTextColor = Color.White,
        cursorColor = Color(0xFF38BDF8),

        focusedLabelColor = Color(0xFFBAE6FD),
        unfocusedLabelColor = Color(0xFFCBD5E1),

        focusedBorderColor = Color(0xFF38BDF8),
        unfocusedBorderColor = Color(0xFF64748B),

        focusedContainerColor = Color(0xFF111827),
        unfocusedContainerColor = Color(0xFF111827)
    )

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF08111F)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color(0xFF2563EB),
                            Color(0xFF7C3AED),
                            Color(0xFF08111F)
                        )
                    )
                )
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "DocApiNexus",
                color = Color.White,
                fontSize = 36.sp,
                fontWeight = FontWeight.ExtraBold,
                fontFamily = FontFamily.Monospace,
                textAlign = TextAlign.Center
            )

            Text(
                text = "API Security · REST · GraphQL · DevSecOps",
                color = Color(0xFFDBEAFE),
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(22.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xEE0F172A))
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text(
                        text = "Login Console",
                        color = Color.White,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                    )

                    OutlinedTextField(
                        value = username,
                        onValueChange = { username = it },
                        label = { Text("Username") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        textStyle = inputTextStyle,
                        colors = inputColors
                    )

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        textStyle = inputTextStyle,
                        colors = inputColors
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0891B2)),
                            onClick = {
                                scope.launch {
                                    status = registerUser(baseUrl, username, password)
                                }
                            }
                        ) {
                            Text("Register")
                        }

                        Button(
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED)),
                            onClick = {
                                scope.launch {
                                    val result = loginUser(baseUrl, username, password)
                                    token = result.first
                                    status = result.second
                                }
                            }
                        ) {
                            Text("Login")
                        }
                    }

                    Text(
                        text = status,
                        color = if (token.isNotBlank()) Color(0xFFBBF7D0) else Color(0xFFFECACA),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)),
                    onClick = {
                        scope.launch {
                            restResponse = callRestApi(baseUrl, token)
                        }
                    }
                ) {
                    Text("REST API")
                }

                Button(
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF9333EA)),
                    onClick = {
                        scope.launch {
                            graphqlResponse = callGraphqlApi(baseUrl, token)
                        }
                    }
                ) {
                    Text("GraphQL")
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            ResponseCard("REST API Response", "/api/users", restResponse)

            Spacer(modifier = Modifier.height(14.dp))

            ResponseCard("GraphQL API Response", "/graphql", graphqlResponse)
        }
    }
}

@Composable
fun ResponseCard(title: String, subtitle: String, body: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xEE0F172A))
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Text(
                text = title,
                color = Color.White,
                fontSize = 19.sp,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = subtitle,
                color = Color(0xFF93C5FD),
                fontSize = 13.sp
            )

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = body,
                color = Color(0xFFE0F2FE),
                fontSize = 13.sp
            )
        }
    }
}

suspend fun registerUser(baseUrl: String, username: String, password: String): String {
    return withContext(Dispatchers.IO) {
        val body = JSONObject()
            .put("username", username)
            .put("password", password)
            .toString()

        val result = httpRequest("$baseUrl/auth/register", "POST", body, null)

        "Register: HTTP ${result.first}\n${result.second}"
    }
}

suspend fun loginUser(baseUrl: String, username: String, password: String): Pair<String, String> {
    return withContext(Dispatchers.IO) {
        val body = JSONObject()
            .put("username", username)
            .put("password", password)
            .toString()

        val result = httpRequest("$baseUrl/auth/login", "POST", body, null)

        try {
            val json = JSONObject(result.second)
            val jwt = when {
                json.has("token") -> json.getString("token")
                json.has("accessToken") -> json.getString("accessToken")
                json.has("jwt") -> json.getString("jwt")
                else -> ""
            }

            if (jwt.isNotBlank()) {
                Pair(jwt, "Logged in as $username")
            } else {
                Pair("", "Login failed\n${result.second}")
            }
        } catch (error: Exception) {
            Pair("", "Login failed\n${result.second}")
        }
    }
}

suspend fun callRestApi(baseUrl: String, token: String): String {
    return withContext(Dispatchers.IO) {
        if (token.isBlank()) {
            return@withContext "Please login first."
        }

        val result = httpRequest("$baseUrl/api/users", "GET", null, token)

        "HTTP ${result.first}\n${result.second}"
    }
}

suspend fun callGraphqlApi(baseUrl: String, token: String): String {
    return withContext(Dispatchers.IO) {
        if (token.isBlank()) {
            return@withContext "Please login first."
        }

        val body = JSONObject()
            .put("query", "{ profile }")
            .toString()

        val result = httpRequest("$baseUrl/graphql", "POST", body, token)

        "HTTP ${result.first}\n${result.second}"
    }
}

fun httpRequest(urlText: String, method: String, body: String?, token: String?): Pair<Int, String> {
    val url = URL(urlText)
    val connection = url.openConnection() as HttpURLConnection

    connection.requestMethod = method
    connection.setRequestProperty("Content-Type", "application/json")

    if (!token.isNullOrBlank()) {
        connection.setRequestProperty("Authorization", "Bearer $token")
    }

    if (body != null) {
        connection.doOutput = true
        val writer = OutputStreamWriter(connection.outputStream)
        writer.write(body)
        writer.flush()
        writer.close()
    }

    val statusCode = connection.responseCode

    val stream = if (statusCode in 200..299) {
        connection.inputStream
    } else {
        connection.errorStream
    }

    val responseText = stream?.let {
        BufferedReader(InputStreamReader(it)).use { reader ->
            reader.readText()
        }
    } ?: ""

    connection.disconnect()

    return Pair(statusCode, responseText)
}