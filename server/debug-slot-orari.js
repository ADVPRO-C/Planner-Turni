// Script di debug per testare il problema con gli slot orari
const Joi = require("joi");

// Schema di validazione attuale
const postazioneSchema = Joi.object({
  luogo: Joi.string().min(2).max(255).required(),
  indirizzo: Joi.string().max(500),
  giorni_settimana: Joi.array()
    .items(Joi.number().min(1).max(7))
    .min(1)
    .required(),
  stato: Joi.string().valid("attiva", "inattiva").default("attiva"),
  max_proclamatori: Joi.number().min(1).max(10).default(3),
  slot_orari: Joi.array()
    .items(
      Joi.object({
        orario_inizio: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required(),
        orario_fine: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required(),
        max_volontari: Joi.number().min(1).max(10).default(3),
      })
    )
    .min(1)
    .required(),
});

// Test data che simula quello che viene inviato dal frontend
const testData = {
  luogo: "Test Postazione",
  indirizzo: "Via Test 123",
  giorni_settimana: [1, 2, 3],
  stato: "attiva",
  max_proclamatori: 3,
  slot_orari: [
    {
      orario_inizio: "09:00:00", // Formato con secondi (da input time)
      orario_fine: "11:00:00", // Formato con secondi (da input time)
      max_volontari: 3,
    },
  ],
};

console.log("=== DEBUG SLOT ORARI ===");
console.log("Dati di test:", JSON.stringify(testData, null, 2));

// Test validazione
const { error, value } = postazioneSchema.validate(testData);

if (error) {
  console.log("❌ Errore di validazione:");
  console.log("Messaggio:", error.details[0].message);
  console.log("Path:", error.details[0].path.join("."));
  console.log("Value:", error.details[0].context?.value);
} else {
  console.log("✅ Validazione superata");
  console.log("Dati validati:", JSON.stringify(value, null, 2));
}

// Test con formato corretto (senza secondi)
const testDataCorrect = {
  ...testData,
  slot_orari: [
    {
      orario_inizio: "09:00", // Formato senza secondi
      orario_fine: "11:00", // Formato senza secondi
      max_volontari: 3,
    },
  ],
};

console.log("\n=== TEST CON FORMATO CORRETTO ===");
const { error: errorCorrect, value: valueCorrect } =
  postazioneSchema.validate(testDataCorrect);

if (errorCorrect) {
  console.log("❌ Errore di validazione:");
  console.log("Messaggio:", errorCorrect.details[0].message);
} else {
  console.log("✅ Validazione superata con formato corretto");
}

// Test pattern regex
console.log("\n=== TEST PATTERN REGEX ===");
const pattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const testTimes = [
  "09:00:00",
  "09:00",
  "14:30:00",
  "14:30",
  "23:59:59",
  "23:59",
];

testTimes.forEach((time) => {
  const matches = pattern.test(time);
  console.log(`${time} -> ${matches ? "✅" : "❌"}`);
});

console.log("\n=== SOLUZIONE PROPOSTA ===");
console.log("1. Modificare il pattern regex per accettare anche i secondi");
console.log("2. Oppure modificare il frontend per inviare solo HH:MM");
console.log(
  "3. Aggiungere pulizia delle disponibilità quando gli slot cambiano"
);
