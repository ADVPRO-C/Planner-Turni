module.exports = {
  extends: ["react-app", "react-app/jest"],
  rules: {
    // Ignora warning per variabili non utilizzate se sono utilizzate in JSX
    "no-unused-vars": [
      "error",
      {
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    // Ignora warning per React Hooks se le dipendenze sono gestite correttamente
    "react-hooks/exhaustive-deps": "warn",
  },
};
