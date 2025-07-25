import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const Cronologia = () => {
  const { user: _user } = useAuth();
  const [turni, setTurni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dataInizio: "",
    dataFine: "",
    postazione: "",
    volontario: "",
  });
  const [selectedTurno, setSelectedTurno] = useState(null);

  useEffect(() => {
    // Simula il caricamento dei turni passati
    setTurni([
      {
        id: 1,
        data: "2024-01-10",
        orario_inizio: "09:00",
        orario_fine: "11:00",
        postazione: "Piazza del Duomo",
        indirizzo: "Piazza del Duomo, Milano",
        volontari: [
          { nome: "Mario Rossi", sesso: "M" },
          { nome: "Anna Bianchi", sesso: "F" },
          { nome: "Giuseppe Verdi", sesso: "M" },
        ],
        stato: "completato",
        note: "Turno completato con successo",
      },
      {
        id: 2,
        data: "2024-01-09",
        orario_inizio: "11:00",
        orario_fine: "13:00",
        postazione: "Stazione Centrale",
        indirizzo: "Piazza Duca d'Aosta, Milano",
        volontari: [
          { nome: "Paolo Neri", sesso: "M" },
          { nome: "Maria Gialli", sesso: "F" },
        ],
        stato: "completato",
        note: "Buona affluenza di pubblico",
      },
      {
        id: 3,
        data: "2024-01-08",
        orario_inizio: "15:00",
        orario_fine: "17:00",
        postazione: "Galleria Vittorio Emanuele II",
        indirizzo: "Galleria Vittorio Emanuele II, Milano",
        volontari: [
          { nome: "Luca Bianchi", sesso: "M" },
          { nome: "Sofia Rossi", sesso: "F" },
          { nome: "Marco Verdi", sesso: "M" },
        ],
        stato: "completato",
        note: "Materiale distribuito completamente",
      },
      {
        id: 4,
        data: "2024-01-07",
        orario_inizio: "09:00",
        orario_fine: "11:00",
        postazione: "Piazza del Duomo",
        indirizzo: "Piazza del Duomo, Milano",
        volontari: [
          { nome: "Giovanni Neri", sesso: "M" },
          { nome: "Elena Bianchi", sesso: "F" },
        ],
        stato: "completato",
        note: "Turno regolare",
      },
    ]);
    setLoading(false);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (stato) => {
    switch (stato) {
      case "completato":
        return "bg-green-100 text-green-800";
      case "cancellato":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSessoIcon = (sesso) => {
    return sesso === "M" ? "👨" : "👩";
  };

  const handleExportPDF = () => {
    // Funzione per esportare in PDF
    console.log("Esportazione PDF...");
  };

  const handleViewDetails = (turno) => {
    setSelectedTurno(turno);
  };

  const filteredTurni = turni.filter((turno) => {
    if (
      filters.dataInizio &&
      new Date(turno.data) < new Date(filters.dataInizio)
    )
      return false;
    if (filters.dataFine && new Date(turno.data) > new Date(filters.dataFine))
      return false;
    if (
      filters.postazione &&
      !turno.postazione.toLowerCase().includes(filters.postazione.toLowerCase())
    )
      return false;
    if (
      filters.volontario &&
      !turno.volontari.some((v) =>
        `${v.nome}`.toLowerCase().includes(filters.volontario.toLowerCase())
      )
    )
      return false;
    return true;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cronologia</h1>
          <p className="text-gray-600 mt-1">
            Visualizzazione dei turni passati e statistiche
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportPDF}
            className="btn-secondary flex items-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Esporta PDF
          </button>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Turni Totali</p>
              <p className="text-2xl font-semibold text-gray-900">
                {turni.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100">
              <UsersIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completati</p>
              <p className="text-2xl font-semibold text-gray-900">
                {turni.filter((t) => t.stato === "completato").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-100">
              <MapPinIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Postazioni</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(turni.map((t) => t.postazione)).size}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-100">
              <UsersIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Volontari Coinvolti
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {
                  new Set(turni.flatMap((t) => t.volontari.map((v) => v.nome)))
                    .size
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 mr-2 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filtri</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Data Inizio</label>
            <input
              type="date"
              className="form-input"
              value={filters.dataInizio}
              onChange={(e) =>
                setFilters({ ...filters, dataInizio: e.target.value })
              }
            />
          </div>
          <div>
            <label className="form-label">Data Fine</label>
            <input
              type="date"
              className="form-input"
              value={filters.dataFine}
              onChange={(e) =>
                setFilters({ ...filters, dataFine: e.target.value })
              }
            />
          </div>
          <div>
            <label className="form-label">Postazione</label>
            <input
              type="text"
              placeholder="Cerca postazione..."
              className="form-input"
              value={filters.postazione}
              onChange={(e) =>
                setFilters({ ...filters, postazione: e.target.value })
              }
            />
          </div>
          <div>
            <label className="form-label">Volontario</label>
            <input
              type="text"
              placeholder="Cerca volontario..."
              className="form-input"
              value={filters.volontario}
              onChange={(e) =>
                setFilters({ ...filters, volontario: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Lista Turni */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Turni Passati ({filteredTurni.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Data</th>
                <th className="table-header">Postazione</th>
                <th className="table-header">Orari</th>
                <th className="table-header min-w-[150px]">Volontari</th>
                <th className="table-header">Stato</th>
                <th className="table-header">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTurni.map((turno) => (
                <tr key={turno.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {formatDate(turno.data)}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">
                        {turno.postazione}
                      </div>
                      <div className="text-sm text-gray-500">
                        {turno.indirizzo}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {turno.orario_inizio} - {turno.orario_fine}
                    </div>
                  </td>
                  <td className="table-cell min-w-[150px]">
                    <div className="flex flex-wrap gap-1">
                      {turno.volontari.map((volontario, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center text-xs"
                        >
                          <span className="mr-1">
                            {getSessoIcon(volontario.sesso)}
                          </span>
                          {volontario.nome}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        turno.stato
                      )}`}
                    >
                      {turno.stato === "completato"
                        ? "Completato"
                        : "Cancellato"}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(turno)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Visualizza dettagli"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dettagli Turno */}
      {selectedTurno && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Dettagli Turno
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Data</label>
                  <p className="text-gray-900">
                    {formatDate(selectedTurno.data)}
                  </p>
                </div>
                <div>
                  <label className="form-label">Postazione</label>
                  <p className="text-gray-900">{selectedTurno.postazione}</p>
                  <p className="text-sm text-gray-500">
                    {selectedTurno.indirizzo}
                  </p>
                </div>
                <div>
                  <label className="form-label">Orari</label>
                  <p className="text-gray-900">
                    {selectedTurno.orario_inizio} - {selectedTurno.orario_fine}
                  </p>
                </div>
                <div>
                  <label className="form-label">Volontari</label>
                  <div className="space-y-1">
                    {selectedTurno.volontari.map((volontario, index) => (
                      <div key={index} className="flex items-center">
                        <span className="mr-2">
                          {getSessoIcon(volontario.sesso)}
                        </span>
                        <span className="text-gray-900">{volontario.nome}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="form-label">Stato</label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      selectedTurno.stato
                    )}`}
                  >
                    {selectedTurno.stato === "completato"
                      ? "Completato"
                      : "Cancellato"}
                  </span>
                </div>
                {selectedTurno.note && (
                  <div>
                    <label className="form-label">Note</label>
                    <p className="text-gray-900">{selectedTurno.note}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setSelectedTurno(null)}
                  className="btn-secondary"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cronologia;
