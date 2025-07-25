import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import {
  UsersIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalVolontari: 0,
    postazioniAttive: 0,
    turniSettimana: 0,
    turniIncompleti: 0,
    prossimiTurni: [],
    notifiche: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calcola le date per i prossimi 30 giorni
        const oggi = new Date();
        const dataInizio = oggi.toISOString().split("T")[0];
        const dataFine = new Date(oggi.getTime() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        // Carica i dati reali dal backend
        const [volontariRes, postazioniRes, turniRes] = await Promise.all([
          api.get("/volontari"),
          api.get("/postazioni"),
          api.get(
            `/turni?volontario_id=${user.id}&data_inizio=${dataInizio}&data_fine=${dataFine}&stato=assegnato`
          ),
        ]);

        // Calcola le statistiche dai dati reali
        const totalVolontari =
          volontariRes.data.pagination?.total ||
          volontariRes.data.volontari?.length ||
          0;
        const postazioniAttive = Array.isArray(postazioniRes.data)
          ? postazioniRes.data.length
          : postazioniRes.data.total || 0;

        // Processa i turni assegnati all'utente
        const prossimiTurni = Array.isArray(turniRes.data)
          ? turniRes.data.map((turno) => ({
              id: turno.id,
              luogo: turno.luogo,
              data: turno.data_turno,
              orario: `${turno.orario_inizio} - ${turno.orario_fine}`,
              volontari: turno.volontari_nomi
                ? turno.volontari_nomi.split(", ")
                : [],
              stato: turno.stato,
            }))
          : [];

        const newStats = {
          totalVolontari,
          postazioniAttive,
          turniSettimana: prossimiTurni.filter((t) => {
            const turnoDate = new Date(t.data);
            const weekFromNow = new Date(
              oggi.getTime() + 7 * 24 * 60 * 60 * 1000
            );
            return turnoDate <= weekFromNow;
          }).length,
          turniIncompleti: 0, // TODO: implementare quando avremo l'API dei turni
          prossimiTurni,
          notifiche: [], // TODO: implementare quando avremo l'API delle notifiche
        };

        setStats(newStats);
      } catch (err) {
        console.error("Errore nel caricamento delle statistiche:", err);

        // Se è un errore di autenticazione, non mostrare errore (verrà gestito dall'AuthContext)
        if (err.response?.status !== 401) {
          setError("Errore nel caricamento delle statistiche");
        }

        // Fallback con dati di base
        setStats({
          totalVolontari: 0,
          postazioniAttive: 0,
          turniSettimana: 0,
          turniIncompleti: 0,
          prossimiTurni: [],
          notifiche: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color = "blue" }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Caricamento statistiche...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Errore</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Benvenuto, {user?.nome} {user?.cognome}
        </h1>
        <p className="text-gray-600 mt-1">
          Ecco un riepilogo delle attività del sistema di gestione turni
        </p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Volontari Totali"
          value={stats.totalVolontari}
          icon={UsersIcon}
          color="blue"
        />
        <StatCard
          title="Postazioni Attive"
          value={stats.postazioniAttive}
          icon={MapPinIcon}
          color="green"
        />
        <StatCard
          title="Turni Questa Settimana"
          value={stats.turniSettimana}
          icon={CalendarIcon}
          color="purple"
        />
        <StatCard
          title="Turni Incompleti"
          value={stats.turniIncompleti}
          icon={ExclamationTriangleIcon}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prossimi Turni */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-primary-600" />I Miei
              Prossimi Turni
            </h3>
          </div>
          <div className="p-6">
            {stats.prossimiTurni.length > 0 ? (
              <div className="space-y-4">
                {stats.prossimiTurni.map((turno) => (
                  <div
                    key={turno.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {turno.luogo}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(turno.data)}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {turno.orario}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Stato:</span>{" "}
                      <span
                        className={`capitalize ${
                          turno.stato === "assegnato"
                            ? "text-blue-600"
                            : turno.stato === "completato"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {turno.stato}
                      </span>
                    </div>
                    {turno.volontari.length > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Con:</span>{" "}
                        {turno.volontari.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  Nessun turno assegnato nei prossimi 30 giorni
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  I tuoi turni confermati appariranno qui
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notifiche */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600" />
              Notifiche Recenti
            </h3>
          </div>
          <div className="p-6">
            {stats.notifiche.length > 0 ? (
              <div className="space-y-3">
                {stats.notifiche.map((notifica) => (
                  <div key={notifica.id} className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        notifica.tipo === "warning"
                          ? "bg-yellow-400"
                          : "bg-blue-400"
                      }`}
                    />
                    <p className="text-sm text-gray-700">
                      {notifica.messaggio}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nessuna notifica</p>
            )}
          </div>
        </div>
      </div>

      {/* Azioni Rapide per Admin */}
      {user?.ruolo === "admin" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Azioni Rapide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn-primary">
              Assegna Turni Automaticamente
            </button>
            <button className="btn-secondary">Gestisci Postazioni</button>
            <button className="btn-secondary">Visualizza Report</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
