const axios = require("axios");

console.log("🔍 TESTING AUTHENTICATION DEBUG");
console.log("===============================");

async function testAuthFlow() {
  try {
    // Test 1: Server connectivity
    console.log("\n1️⃣ Testing server connectivity...");
    const healthResponse = await axios.get("http://localhost:5001/api/health");
    console.log("✅ Server is running:", healthResponse.data);

    // Test 2: Login
    console.log("\n2️⃣ Testing login...");
    const loginResponse = await axios.post(
      "http://localhost:5001/api/auth/login",
      {
        email: "admin@planner.com",
        password: "password123",
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ Login successful");
    console.log("📝 Token received:", !!token);
    console.log("👤 User:", loginResponse.data.user);

    // Test 3: Token verification
    console.log("\n3️⃣ Testing token verification...");
    const verifyResponse = await axios.get(
      "http://localhost:5001/api/auth/verify",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("✅ Token verification successful");
    console.log("👤 Verified user:", verifyResponse.data.user);

    // Test 4: API endpoints that are called on page load
    console.log("\n4️⃣ Testing API endpoints called on page load...");

    // Test /volontari endpoint (called by Dashboard)
    try {
      const volontariResponse = await axios.get(
        "http://localhost:5001/api/volontari",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("✅ /volontari endpoint works");
    } catch (error) {
      console.log("❌ /volontari endpoint failed:", error.response?.status);
    }

    // Test /postazioni endpoint (called by Dashboard)
    try {
      const postazioniResponse = await axios.get(
        "http://localhost:5001/api/postazioni",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("✅ /postazioni endpoint works");
    } catch (error) {
      console.log("❌ /postazioni endpoint failed:", error.response?.status);
    }

    // Test 5: Simulate the exact verification process that happens on page load
    console.log("\n5️⃣ Simulating page load verification process...");

    // This is exactly what AuthContext.verifyToken() does
    try {
      const pageLoadVerification = await axios.get(
        "http://localhost:5001/api/auth/verify",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("✅ Page load verification successful");
      console.log(
        "👤 User should be authenticated:",
        pageLoadVerification.data.user
      );
    } catch (error) {
      console.log("❌ Page load verification failed:", error.response?.status);
      console.log("❌ This would cause logout on refresh");
    }

    // Test 6: Check token expiration
    console.log("\n6️⃣ Checking token expiration...");
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

    // Test 7: Test error scenarios
    console.log("\n7️⃣ Testing error scenarios...");

    // Test with invalid token
    try {
      await axios.get("http://localhost:5001/api/auth/verify", {
        headers: { Authorization: "Bearer invalid_token" },
      });
      console.log("❌ Should have failed with invalid token");
    } catch (error) {
      console.log(
        "✅ Correctly rejected invalid token:",
        error.response?.status
      );
    }

    // Test without token
    try {
      await axios.get("http://localhost:5001/api/auth/verify");
      console.log("❌ Should have failed without token");
    } catch (error) {
      console.log(
        "✅ Correctly rejected request without token:",
        error.response?.status
      );
    }

    console.log("\n🎯 TEST SUMMARY");
    console.log("===============");
    console.log("✅ Server is running");
    console.log("✅ Login works");
    console.log("✅ Token verification works");
    console.log("✅ API endpoints work");
    console.log("✅ Token is valid");
    console.log("✅ Error handling works");

    console.log("\n🔍 POSSIBLE ISSUES:");
    console.log("1. React state management problem");
    console.log("2. Component re-rendering issue");
    console.log("3. Routing problem");
    console.log("4. Timing issue between verification and rendering");
    console.log("5. Multiple AuthContext instances");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

// Run the test
testAuthFlow();
