const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token di accesso richiesto" });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ message: "Token non valido" });
    }

    req.user = payload;
    next();
  });
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Token di accesso richiesto" });
    }

    const { ruolo } = req.user;

    if (ruolo === "super_admin") {
      return next();
    }

    if (!allowedRoles.includes(ruolo)) {
      return res.status(403).json({ message: "Accesso non autorizzato" });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
