import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import { toastSuccess, toastError, toastLoading, toast } from "../utils/toast";
import {
  DocumentCheckIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Autorizzazioni = () => {
  const { user } = useAuth();
  const [documenti, setDocumenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [descrizione, setDescrizione] = useState("");
  const fileInputRef = useRef(null);

  const isAdmin = user?.ruolo === "admin" || user?.ruolo === "super_admin";

  // Carica i documenti
  const loadDocumenti = async () => {
    setLoading(true);
    try {
      const response = await api.get("/documenti");
      setDocumenti(response.data.documenti || []);
    } catch (error) {
      console.error("Errore nel caricamento dei documenti:", error);
      toastError("Errore nel caricamento dei documenti");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocumenti();
  }, []);

  // Gestisce la selezione del file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      toastError("Solo file PDF sono consentiti");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toastError("Il file non può superare 10MB");
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  // Gestisce il caricamento del documento
  const handleUpload = async () => {
    if (!selectedFile) {
      toastError("Seleziona un file PDF");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("documento", selectedFile);
      if (descrizione.trim()) {
        formData.append("descrizione", descrizione.trim());
      }

      await api.post("/documenti", formData);

      toastSuccess("Documento caricato con successo");
      setShowUploadModal(false);
      setSelectedFile(null);
      setDescrizione("");
      // Reset input file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      loadDocumenti();
    } catch (error) {
      console.error("Errore nel caricamento:", error);
      toastError(
        error.response?.data?.message || "Errore nel caricamento del documento"
      );
    } finally {
      setUploading(false);
    }
  };

  // Gestisce l'eliminazione di un documento
  const handleDelete = async (documentoId, nomeDocumento) => {
    if (
      !window.confirm(
        `Sei sicuro di voler eliminare "${nomeDocumento}"? Questa azione non può essere annullata.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/documenti/${documentoId}`);
      toastSuccess("Documento eliminato con successo");
      loadDocumenti();
    } catch (error) {
      console.error("Errore nell'eliminazione:", error);
      toastError(
        error.response?.data?.message || "Errore nell'eliminazione del documento"
      );
    }
  };

  // Apre/scarica un documento
  const handleDownload = async (documentoId) => {
    try {
      // Mostra un messaggio di caricamento
      const loadingToast = toastLoading("Caricamento documento...");
      
      // Usa l'API helper che gestisce automaticamente l'autenticazione
      const response = await api.get(`/documenti/${documentoId}/download`, {
        responseType: "blob", // Importante: indica ad axios di trattare la risposta come blob
      });

      // Crea un blob URL e aprilo in una nuova scheda
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      
      // Pulisci il blob URL dopo un po' (opzionale, per liberare memoria)
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      
      toast.dismiss(loadingToast);
      toastSuccess("Documento aperto");
    } catch (error) {
      console.error("Errore nell'apertura del documento:", error);
      toastError(
        error.response?.data?.message || "Errore nell'apertura del documento"
      );
    }
  };

  // Formatta la dimensione del file
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // Formatta la data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento documenti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Autorizzazioni
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Documenti PDF di autorizzazioni e permessi per la congregazione
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn-primary flex items-center gap-2 text-lg px-6 py-3"
              >
                <DocumentArrowUpIcon className="h-6 w-6" />
                Carica Documento
              </button>
            )}
          </div>
        </div>

        {/* Lista Documenti */}
        {documenti.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <DocumentCheckIcon className="mx-auto h-20 w-20 text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Nessun documento caricato
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                {isAdmin
                  ? "Inizia caricando il primo documento di autorizzazione"
                  : "Non ci sono documenti disponibili al momento"}
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="btn-primary flex items-center gap-2 text-lg px-6 py-3 mx-auto"
                >
                  <DocumentArrowUpIcon className="h-6 w-6" />
                  Carica Primo Documento
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {documenti.map((documento) => (
              <div
                key={documento.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <DocumentCheckIcon className="h-10 w-10 text-primary-600 flex-shrink-0" />
                  {isAdmin && (
                    <button
                      onClick={() =>
                        handleDelete(documento.id, documento.nome_originale)
                      }
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Elimina documento"
                    >
                      <TrashIcon className="h-6 w-6" />
                    </button>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2 break-words">
                  {documento.nome_originale}
                </h3>

                {documento.descrizione && (
                  <p className="text-base text-gray-600 mb-4">
                    {documento.descrizione}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-500">
                    <strong className="text-gray-700">Dimensione:</strong>{" "}
                    {formatFileSize(documento.dimensione_file)}
                  </div>
                  <div className="text-sm text-gray-500">
                    <strong className="text-gray-700">Caricato il:</strong>{" "}
                    {formatDate(documento.created_at)}
                  </div>
                  {documento.creato_da && (
                    <div className="text-sm text-gray-500">
                      <strong className="text-gray-700">Caricato da:</strong>{" "}
                      {documento.creato_da}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDownload(documento.id)}
                  className="w-full btn-primary flex items-center justify-center gap-2 text-lg py-3"
                >
                  <DocumentArrowDownIcon className="h-6 w-6" />
                  Apri Documento
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal Upload */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Carica Documento
                </h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setDescrizione("");
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Seleziona File PDF
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="block w-full text-lg text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-md file:border-0 file:text-lg file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-base text-gray-600">
                      File selezionato: <strong>{selectedFile.name}</strong> (
                      {formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Descrizione (opzionale)
                  </label>
                  <textarea
                    value={descrizione}
                    onChange={(e) => setDescrizione(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Aggiungi una descrizione opzionale per questo documento..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setDescrizione("");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="flex-1 btn-secondary text-lg py-3"
                    disabled={uploading}
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="flex-1 btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Caricamento..." : "Carica"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Autorizzazioni;
