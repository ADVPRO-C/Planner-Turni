import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import {
  QuestionMarkCircleIcon,
  PaperClipIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const Assistenza = () => {
  const { user } = useAuth();

  // Rimosso toast di benvenuto - ora gestito al login

  const [formData, setFormData] = useState({
    argomento: "",
    titolo: "",
    priorita: "normale",
    email: user?.email || "",
    telefono: "",
    descrizione: "",
  });
  const [allegati, setAllegati] = useState([]);
  const [loading, setLoading] = useState(false);

  const argomenti = [
    { value: "problema-tecnico", label: "Problema tecnico" },
    { value: "domanda", label: "Domanda" },
    { value: "nuova-funzionalita", label: "Aggiunta nuova funzionalità" },
  ];

  const prioritaOptions = [
    { value: "normale", label: "Normale", color: "text-blue-600" },
    { value: "urgente", label: "Urgente", color: "text-red-600" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Configurazione sicurezza file
    const maxSizeImages = 1.5 * 1024 * 1024; // 1.5MB per immagini
    const maxSizePDF = 5 * 1024 * 1024; // 5MB per PDF
    const allowedTypes = {
      "application/pdf": { maxSize: maxSizePDF, name: "PDF" },
      "image/jpeg": { maxSize: maxSizeImages, name: "JPEG" },
      "image/jpg": { maxSize: maxSizeImages, name: "JPG" },
      "image/png": { maxSize: maxSizeImages, name: "PNG" },
    };

    // Estensioni pericolose da bloccare sempre
    const dangerousExtensions = [
      ".exe",
      ".bat",
      ".cmd",
      ".com",
      ".pif",
      ".scr",
      ".vbs",
      ".js",
      ".jar",
      ".app",
      ".deb",
      ".pkg",
      ".dmg",
      ".rpm",
      ".msi",
      ".run",
      ".bin",
      ".sh",
      ".ps1",
      ".php",
      ".asp",
      ".jsp",
      ".py",
      ".rb",
      ".pl",
    ];

    const validFiles = files.filter((file) => {
      const fileName = file.name.toLowerCase();

      // 1. Controllo estensioni pericolose
      if (dangerousExtensions.some((ext) => fileName.endsWith(ext))) {
        toast.error(
          `❌ File ${file.name} bloccato: tipo di file potenzialmente pericoloso`,
          {
            duration: 5000,
          }
        );
        return false;
      }

      // 2. Controllo tipo MIME
      if (!allowedTypes[file.type]) {
        toast.error(
          `❌ Tipo file non supportato: ${file.name}. Formati consentiti: PDF, JPEG, JPG, PNG`,
          {
            duration: 5000,
          }
        );
        return false;
      }

      // 3. Controllo dimensione specifica per tipo
      const typeConfig = allowedTypes[file.type];
      if (file.size > typeConfig.maxSize) {
        const maxSizeMB = (typeConfig.maxSize / (1024 * 1024)).toFixed(1);
        toast.error(
          `❌ File ${file.name} troppo grande. Limite per ${typeConfig.name}: ${maxSizeMB}MB`,
          {
            duration: 5000,
          }
        );
        return false;
      }

      // 4. Controllo nome file (no caratteri speciali pericolosi)
      // eslint-disable-next-line no-control-regex
      if (/[<>:"/\\|?*\x00-\x1f]/.test(fileName)) {
        toast.error(`❌ Nome file ${file.name} contiene caratteri non validi`, {
          duration: 5000,
        });
        return false;
      }

      // 5. Controllo dimensione minima (evita file vuoti o corrotti)
      if (file.size < 100) {
        // 100 bytes minimo
        toast.error(`❌ File ${file.name} troppo piccolo o corrotto`, {
          duration: 5000,
        });
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      toast.success(`✅ ${validFiles.length} file aggiunti correttamente`);
    }

    setAllegati((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setAllegati((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validazione
      if (!formData.argomento || !formData.titolo || !formData.descrizione) {
        toast.error("Compila tutti i campi obbligatori");
        return;
      }

      // Prepara i dati per l'invio
      const formDataToSend = new FormData();

      // Aggiungi i dati del form
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // Aggiungi informazioni utente
      formDataToSend.append("nomeUtente", `${user?.nome} ${user?.cognome}`);
      formDataToSend.append("ruoloUtente", user?.ruolo || "volontario");

      // Aggiungi allegati - IMPORTANTE: il nome del campo deve essere "allegato" per multer
      allegati.forEach((file) => {
        formDataToSend.append("allegato", file);
      });

      // Invia la richiesta usando api helper
      // Per FormData, axios gestisce automaticamente Content-Type multipart/form-data
      // NON impostare manualmente Content-Type, axios lo farà automaticamente con il boundary corretto
      await api.post("/assistenza/invia", formDataToSend);

      toast.success("Richiesta di assistenza inviata con successo!");

      // Reset del form
      setFormData({
        argomento: "",
        titolo: "",
        priorita: "normale",
        email: user?.email || "",
        telefono: "",
        descrizione: "",
      });
      setAllegati([]);
    } catch (error) {
      console.error("Errore nell'invio:", error);
      if (error.response?.status === 400) {
        toast.error(error.response?.data?.details || error.response?.data?.message || "Errore nella validazione dei dati");
      } else if (error.response?.status === 401) {
        toast.error("Sessione scaduta. Effettua nuovamente l'accesso.");
      } else {
        toast.error(error.response?.data?.message || "Errore di connessione. Riprova più tardi.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <QuestionMarkCircleIcon className="h-8 w-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">
            Assistenza Tecnica
          </h1>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-blue-800 text-sm">
              Se riscontri qualche bug nel programma puoi segnalarlo tramite il
              modulo contatti sottostante, e provvederemo ad esaminare la
              richiesta nel più breve tempo possibile.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Dettagli della Richiesta
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Argomento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Argomento *
              </label>
              <select
                name="argomento"
                value={formData.argomento}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Seleziona un argomento</option>
                {argomenti.map((arg) => (
                  <option key={arg.value} value={arg.value}>
                    {arg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priorità */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorità *
              </label>
              <div className="space-y-2">
                {prioritaOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="priorita"
                      value={option.value}
                      checked={formData.priorita === option.value}
                      onChange={handleInputChange}
                      className="mr-2 text-primary-600 focus:ring-primary-500"
                    />
                    <span className={`text-sm font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Titolo */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titolo *
            </label>
            <input
              type="text"
              name="titolo"
              value={formData.titolo}
              onChange={handleInputChange}
              required
              placeholder="Inserisci un titolo descrittivo"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Contatti */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="Opzionale"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Descrizione */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione *
            </label>
            <textarea
              name="descrizione"
              value={formData.descrizione}
              onChange={handleInputChange}
              required
              rows={6}
              placeholder="Descrivi dettagliatamente il problema o la richiesta..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Allegati */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allegati
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center">
                <PaperClipIcon className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <label className="cursor-pointer">
                    <span className="text-sm text-gray-600">
                      Clicca per allegare file o trascina qui
                    </span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Formati supportati: PDF (max 5MB), JPEG/JPG/PNG (max 1.5MB)
                </p>
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ File eseguibili e script sono bloccati per sicurezza
                </p>
              </div>

              {/* Lista allegati */}
              {allegati.length > 0 && (
                <div className="mt-4 space-y-2">
                  {allegati.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <div className="flex items-center">
                        <PaperClipIcon className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-700">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                argomento: "",
                titolo: "",
                priorita: "normale",
                email: user?.email || "",
                telefono: "",
                descrizione: "",
              });
              setAllegati([]);
            }}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Invio in corso...
              </div>
            ) : (
              "Invia Richiesta"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Assistenza;
