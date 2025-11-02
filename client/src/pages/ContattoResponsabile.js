import React from "react";
import { UserIcon } from "@heroicons/react/24/outline";

const ContattoResponsabile = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contatto Responsabile</h1>
          <p className="mt-2 text-gray-600">
            Informazioni di contatto del responsabile della congregazione
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <UserIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Sezione in fase di sviluppo
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Questa sezione è attualmente in fase di sviluppo. Le informazioni
              di contatto del responsabile saranno disponibili prossimamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContattoResponsabile;

