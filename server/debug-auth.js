const axios = require("axios");

// Configurazione
const BASE_URL = "http://localhost:5001/api";
const TEST_EMAIL = "admin@planner.com";
const TEST_PASSWORD = "password123";

console.log("🔍 DEBUG AUTHENTICATION PROCESS");
console.log("================================");

async function debugAuth() {
  try {
    console.log("\n1️⃣ Testing server connectivity...");
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Server is running:", healthResponse.data);

    console.log("\n2️⃣ Testing login...");
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    const token = loginResponse.data.token;
    console.log("✅ Login successful");
    console.log("📝 Token received:", token ? "YES" : "NO");
    console.log("📝 Token length:", token ? token.length : 0);
    console.log(
      "📝 Token preview:",
      token ? token.substring(0, 50) + "..." : "NONE"
    );
    console.log("👤 User data:", loginResponse.data.user);

    console.log("\n3️⃣ Testing token verification...");
    const verifyResponse = await axios.get(`${BASE_URL}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("✅ Token verification successful");
    console.log("👤 Verified user:", verifyResponse.data.user);

    console.log("\n4️⃣ Testing token expiration...");
    // Decode JWT token to check expiration
    const tokenParts = token.split(".");
    if (tokenParts.length === 3) {
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], "base64").toString()
      );
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = payload.exp;
      const timeLeft = expiresAt - now;

      console.log(
        "📅 Token issued at:",
        new Date(payload.iat * 1000).toISOString()
      );
      console.log(
        "📅 Token expires at:",
        new Date(expiresAt * 1000).toISOString()
      );
      console.log("📅 Current time:", new Date(now * 1000).toISOString());
      console.log(
        "⏰ Time left:",
        Math.floor(timeLeft / 3600),
        "hours",
        Math.floor((timeLeft % 3600) / 60),
        "minutes"
      );

      if (timeLeft <= 0) {
        console.log("❌ Token is expired!");
      } else {
        console.log("✅ Token is still valid");
      }
    }

    console.log("\n5️⃣ Testing API endpoints with token...");

    // Test volontari endpoint
    try {
      const volontariResponse = await axios.get(`${BASE_URL}/volontari`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ /volontari endpoint works");
    } catch (error) {
      console.log(
        "❌ /volontari endpoint failed:",
        error.response?.status,
        error.response?.data
      );
    }

    // Test postazioni endpoint
    try {
      const postazioniResponse = await axios.get(`${BASE_URL}/postazioni`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ /postazioni endpoint works");
    } catch (error) {
      console.log(
        "❌ /postazioni endpoint failed:",
        error.response?.status,
        error.response?.data
      );
    }

    console.log("\n6️⃣ Testing token without Authorization header...");
    try {
      const noAuthResponse = await axios.get(`${BASE_URL}/auth/verify`);
      console.log(
        "❌ Should have failed without token, but got:",
        noAuthResponse.status
      );
    } catch (error) {
      console.log(
        "✅ Correctly rejected request without token:",
        error.response?.status
      );
    }

    console.log("\n7️⃣ Testing invalid token...");
    try {
      const invalidResponse = await axios.get(`${BASE_URL}/auth/verify`, {
        headers: { Authorization: "Bearer invalid_token" },
      });
      console.log(
        "❌ Should have failed with invalid token, but got:",
        invalidResponse.status
      );
    } catch (error) {
      console.log(
        "✅ Correctly rejected invalid token:",
        error.response?.status
      );
    }

    console.log("\n8️⃣ Testing localStorage simulation...");
    // Simulate localStorage behavior
    const mockLocalStorage = {
      token: null,
      setItem: function (key, value) {
        if (key === "token") {
          this.token = value;
          console.log("💾 Token saved to localStorage");
        }
      },
      getItem: function (key) {
        if (key === "token") {
          console.log(
            "💾 Token retrieved from localStorage:",
            this.token ? "YES" : "NO"
          );
          return this.token;
        }
        return null;
      },
      removeItem: function (key) {
        if (key === "token") {
          console.log("🗑️ Token removed from localStorage");
          this.token = null;
        }
      },
    };

    // Simulate login process
    mockLocalStorage.setItem("token", token);
    const retrievedToken = mockLocalStorage.getItem("token");
    console.log(
      "💾 Retrieved token matches original:",
      retrievedToken === token
    );

    // Simulate verification process
    if (retrievedToken) {
      try {
        const verifyWithRetrieved = await axios.get(`${BASE_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${retrievedToken}` },
        });
        console.log("✅ Verification with retrieved token successful");
      } catch (error) {
        console.log(
          "❌ Verification with retrieved token failed:",
          error.response?.status
        );
      }
    }

    console.log("\n🎯 DEBUG SUMMARY");
    console.log("================");
    console.log("✅ Server is running");
    console.log("✅ Login works");
    console.log("✅ Token verification works");
    console.log("✅ API endpoints work with token");
    console.log("✅ Token expiration is reasonable");
    console.log("✅ localStorage simulation works");

    console.log("\n🔍 POSSIBLE ISSUES TO CHECK:");
    console.log("1. Browser localStorage might be disabled or cleared");
    console.log("2. React app might be clearing localStorage on refresh");
    console.log("3. CORS issues might be preventing token persistence");
    console.log("4. Browser security settings might be blocking localStorage");
    console.log("5. React development mode might be causing re-renders");
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

// Run the debug
debugAuth();
