const db = require("../config/database");

const ALLOWED_CONGREGATION_TABLES = new Set(['volontari', 'postazioni', 'slot_orari', 'disponibilita', 'assegnazioni', 'assegnazioni_volontari', 'esperienze']);

const normalizeCode = (code) => (code ? code.toString().padStart(3, '0') : null);

const resolveCongregazioneId = async (req, options = {}) => {
  const {
    allowNullForSuperAdmin = true,
    queryKey = 'congregazione_id',
    headerKey = 'x-congregazione-id',
  } = options;
  const { ruolo, congregazione_id: defaultId } = req.user || {};

  if (ruolo === "super_admin") {
    const rawId = req.query[queryKey];
    if (rawId) {
      const parsed = parseInt(rawId, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    const headerValue = req.headers?.[headerKey];
    if (headerValue) {
      const parsedHeader = parseInt(headerValue, 10);
      if (!Number.isNaN(parsedHeader)) {
        return parsedHeader;
      }
    }

    const codeKey = options.codeQueryKey || "congregazione_codice";
    const rawCode = req.query[codeKey];

    if (rawCode) {
      const normalized = normalizeCode(rawCode);
      const row = await db.oneOrNone(
        "SELECT id FROM congregazioni WHERE codice = $1",
        [normalized]
      );
      if (row) {
        return row.id;
      }
    }

    return allowNullForSuperAdmin ? null : defaultId || null;
  }

  return defaultId;
};

const enforceSameCongregazione = (req, targetCongregazioneId) => {
  if (!targetCongregazioneId) return;
  const { ruolo, congregazione_id: userCongregationId } = req.user || {};

  if (ruolo === "super_admin") {
    return;
  }

  if (userCongregationId !== targetCongregazioneId) {
    const err = new Error("Accesso non autorizzato alla congregazione richiesta");
    err.statusCode = 403;
    throw err;
  }
};

const getEntityCongregazione = async (table, id) => {
  if (!id) return null;
  if (!ALLOWED_CONGREGATION_TABLES.has(table)) {
    throw new Error(`Tabella non valida per controllo congregazione: ${table}`);
  }
  const query = `SELECT congregazione_id FROM ${table} WHERE id = $1`;
  const row = await db.oneOrNone(query, [id]);
  return row ? row.congregazione_id : null;
};

const ensureEntityAccess = async (req, table, id) => {
  const entityCongId = await getEntityCongregazione(table, id);
  if (!entityCongId) {
    return null;
  }
  enforceSameCongregazione(req, entityCongId);
  return entityCongId;
};


module.exports = {
  resolveCongregazioneId,
  enforceSameCongregazione,
  normalizeCode,
  getEntityCongregazione,
  ensureEntityAccess,
};
