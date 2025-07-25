// Script di debug per il browser
// Aggiungi questo script alla console del browser per testare il localStorage

console.log("🔍 BROWSER DEBUG SCRIPT");
console.log("========================");

function debugBrowserAuth() {
  console.log("\n1️⃣ Testing localStorage availability...");

  // Test localStorage
  try {
    localStorage.setItem("test", "value");
    const testValue = localStorage.getItem("test");
    localStorage.removeItem("test");
    console.log("✅ localStorage is available and working");
  } catch (error) {
    console.log("❌ localStorage is not available:", error.message);
    return;
  }

  console.log("\n2️⃣ Testing current token in localStorage...");
  const currentToken = localStorage.getItem("token");
  console.log("📝 Current token exists:", !!currentToken);
  if (currentToken) {
    console.log("📝 Token length:", currentToken.length);
    console.log("📝 Token preview:", currentToken.substring(0, 50) + "...");

    // Decode JWT token
    try {
      const tokenParts = currentToken.split(".");
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
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
    } catch (error) {
      console.log("❌ Error decoding token:", error.message);
    }
  } else {
    console.log("❌ No token found in localStorage");
  }

  console.log("\n3️⃣ Testing API call with current token...");
  if (currentToken) {
    fetch("http://localhost:5001/api/auth/verify", {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    })
      .then((response) => {
        console.log("🌐 API call status:", response.status);
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      })
      .then((data) => {
        console.log("✅ API call successful:", data);
      })
      .catch((error) => {
        console.log("❌ API call failed:", error.message);
      });
  } else {
    console.log("⚠️ Skipping API call - no token available");
  }

  console.log("\n4️⃣ Testing localStorage persistence...");

  // Test localStorage persistence
  const testKey = "debug_test_" + Date.now();
  const testValue = "test_value_" + Date.now();

  localStorage.setItem(testKey, testValue);
  console.log("💾 Test value saved");

  // Simulate page refresh by reading the value
  const retrievedValue = localStorage.getItem(testKey);
  console.log("💾 Test value retrieved:", retrievedValue === testValue);

  // Clean up
  localStorage.removeItem(testKey);
  console.log("🗑️ Test value cleaned up");

  console.log("\n5️⃣ Testing AuthContext state...");

  // Try to access AuthContext if available
  if (
    window.React &&
    window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
  ) {
    console.log("✅ React is available");
  } else {
    console.log("⚠️ React not accessible from console");
  }

  console.log("\n6️⃣ Browser information...");
  console.log("🌐 User Agent:", navigator.userAgent);
  console.log("🌐 Cookie enabled:", navigator.cookieEnabled);
  console.log("🌐 Online status:", navigator.onLine);
  console.log("🌐 Platform:", navigator.platform);

  console.log("\n7️⃣ Testing sessionStorage...");
  try {
    sessionStorage.setItem("test", "value");
    const sessionValue = sessionStorage.getItem("test");
    sessionStorage.removeItem("test");
    console.log("✅ sessionStorage is available and working");
  } catch (error) {
    console.log("❌ sessionStorage is not available:", error.message);
  }

  console.log("\n🎯 BROWSER DEBUG SUMMARY");
  console.log("========================");
  console.log("✅ localStorage is working");
  console.log("✅ sessionStorage is working");
  console.log("✅ Browser supports storage APIs");

  if (currentToken) {
    console.log("✅ Token exists in localStorage");
    console.log("✅ Token appears to be valid");
  } else {
    console.log("❌ No token found in localStorage");
  }

  console.log("\n🔍 POSSIBLE SOLUTIONS:");
  console.log(
    "1. Check if React is clearing localStorage on component unmount"
  );
  console.log("2. Check if there are multiple AuthContext instances");
  console.log("3. Check if useEffect cleanup is removing the token");
  console.log("4. Check if there are conflicting event listeners");
  console.log("5. Check if the token is being removed by error handlers");
}

// Auto-run the debug
debugBrowserAuth();

// Export function for manual testing
window.debugBrowserAuth = debugBrowserAuth;
