// Script per testare il problema del refresh
// Questo script simula il processo di verifica del token durante il refresh

console.log("🔄 REFRESH DEBUG SCRIPT");
console.log("========================");

function debugRefreshProcess() {
  console.log("\n1️⃣ Simulating page load process...");

  // Simulate the useEffect that runs on page load
  const simulatePageLoad = () => {
    console.log("📄 Page load simulation started");

    // Step 1: Check if token exists
    const token = localStorage.getItem("token");
    console.log("🔍 Step 1 - Token check:", !!token);

    if (token) {
      console.log("🔍 Step 2 - Token found, starting verification...");

      // Step 2: Verify token
      fetch("http://localhost:5001/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          console.log("🌐 Verification response status:", response.status);

          if (response.ok) {
            console.log("✅ Token verification successful");
            return response.json();
          } else {
            console.log("❌ Token verification failed");
            throw new Error(`HTTP ${response.status}`);
          }
        })
        .then((data) => {
          console.log("✅ User authenticated:", data.user);
          console.log("✅ Setting user state...");
          // Simulate setting user state
          console.log("✅ User state set successfully");
        })
        .catch((error) => {
          console.log("❌ Verification error:", error.message);
          console.log("🗑️ Removing invalid token...");
          localStorage.removeItem("token");
          console.log("🗑️ Token removed from localStorage");
          console.log("❌ Setting user to null...");
          // Simulate setting user to null
          console.log("❌ User state set to null");
        });
    } else {
      console.log("❌ No token found, user not authenticated");
    }
  };

  // Run the simulation
  simulatePageLoad();
}

function debugTokenRemoval() {
  console.log("\n2️⃣ Testing token removal scenarios...");

  const scenarios = [
    {
      name: "Network error during verification",
      test: () => {
        console.log("🌐 Testing network error scenario...");
        const token = localStorage.getItem("token");
        if (token) {
          // Simulate network error
          fetch("http://localhost:5001/api/auth/verify", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then((response) => {
              if (!response.ok) {
                console.log("❌ Network error detected, removing token");
                localStorage.removeItem("token");
              }
            })
            .catch((error) => {
              console.log("❌ Network error caught, removing token");
              localStorage.removeItem("token");
            });
        }
      },
    },
    {
      name: "CORS error during verification",
      test: () => {
        console.log("🌐 Testing CORS error scenario...");
        const token = localStorage.getItem("token");
        if (token) {
          // Try to call a non-existent endpoint to simulate CORS error
          fetch("http://localhost:5001/api/nonexistent", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).catch((error) => {
            console.log("❌ CORS/Network error caught");
            // Don't remove token for CORS errors
          });
        }
      },
    },
    {
      name: "Token expiration check",
      test: () => {
        console.log("⏰ Testing token expiration...");
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const tokenParts = token.split(".");
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const now = Math.floor(Date.now() / 1000);
              const expiresAt = payload.exp;

              if (expiresAt <= now) {
                console.log("❌ Token is expired, removing...");
                localStorage.removeItem("token");
              } else {
                console.log("✅ Token is still valid");
              }
            }
          } catch (error) {
            console.log("❌ Error decoding token:", error.message);
            localStorage.removeItem("token");
          }
        }
      },
    },
  ];

  scenarios.forEach((scenario) => {
    console.log(`\n📋 Running scenario: ${scenario.name}`);
    scenario.test();
  });
}

function debugAuthContext() {
  console.log("\n3️⃣ Testing AuthContext behavior...");

  // Check if AuthContext is available
  if (window.React) {
    console.log("✅ React is available");
  } else {
    console.log("❌ React not available");
  }

  // Check if there are any global event listeners that might interfere
  console.log("🔍 Checking for potential interference...");

  // Test if localStorage is being cleared by other scripts
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;

  localStorage.setItem = function (key, value) {
    console.log(
      "🔍 localStorage.setItem called:",
      key,
      value ? "value" : "null"
    );
    originalSetItem.call(this, key, value);
  };

  localStorage.removeItem = function (key) {
    console.log("🔍 localStorage.removeItem called:", key);
    originalRemoveItem.call(this, key);
  };

  console.log("✅ localStorage monitoring enabled");
  console.log("📝 Any localStorage operations will now be logged");
}

// Run all debug functions
debugRefreshProcess();
setTimeout(debugTokenRemoval, 2000);
setTimeout(debugAuthContext, 4000);

// Export functions for manual testing
window.debugRefreshProcess = debugRefreshProcess;
window.debugTokenRemoval = debugTokenRemoval;
window.debugAuthContext = debugAuthContext;
