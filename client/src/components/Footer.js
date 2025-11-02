import React from "react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-l border-gray-200 shadow-sm">
      <div className="flex items-center justify-end px-6 py-3">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="font-medium">Versione 1.0 Beta</span>
          <span className="text-gray-300">|</span>
          <span>© 2025 | Developed by D.Arena</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

