// Configurazione dell'applicazione client

const config = {
  // API Configuration
  API_URL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",

  // Environment
  ENV: process.env.REACT_APP_ENV || "development",

  // Feature Flags
  ENABLE_PDF_EXPORT: process.env.REACT_APP_ENABLE_PDF_EXPORT !== "false",
  ENABLE_NOTIFICATIONS: process.env.REACT_APP_ENABLE_NOTIFICATIONS !== "false",

  // App Configuration
  APP_NAME: "Planner Turni",
  APP_VERSION: "1.0.0",

  // Date/Time Configuration
  DATE_FORMAT: "dd/MM/yyyy",
  TIME_FORMAT: "HH:mm",
  DATETIME_FORMAT: "dd/MM/yyyy HH:mm",

  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // File Upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ["image/jpeg", "image/png", "application/pdf"],

  // UI Configuration
  SIDEBAR_WIDTH: 256,
  HEADER_HEIGHT: 64,

  // Colors (from Tailwind config)
  colors: {
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
    },
    secondary: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
  },
};

export default config;
