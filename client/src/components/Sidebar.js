import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  HomeIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  BellIcon,
  CogIcon,
  ChartBarIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "clsx";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleExpanded = (itemKey) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemKey)) {
      newExpanded.delete(itemKey);
    } else {
      newExpanded.add(itemKey);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: HomeIcon,
      path: "/",
      adminOnly: false,
    },
    {
      key: "postazioni",
      label: "Postazioni",
      icon: MapPinIcon,
      path: "/postazioni",
      adminOnly: false,
      subItems: [
        { label: "Elenco Postazioni", path: "/postazioni" },
        {
          label: "Gestione Postazioni",
          path: "/postazioni/gestione",
          adminOnly: true,
        },
      ],
    },
    {
      key: "volontari",
      label: "Proclamatori",
      icon: UsersIcon,
      path: "/volontari",
      adminOnly: false,
      subItems: [
        { label: "Elenco Volontari", path: "/volontari" },
        {
          label: "Gestione Volontari",
          path: "/volontari/gestione",
          adminOnly: true,
        },
        { label: "Disponibilità", path: "/volontari/disponibilita" },
        {
          label: "Riepilogo Disponibilità",
          path: "/volontari/riepilogo-disponibilita",
          adminOnly: true,
        },
      ],
    },
    {
      key: "cronologia",
      label: "Cronologia",
      icon: ClockIcon,
      path: "/cronologia",
      adminOnly: false,
      subItems: [
        { label: "Turni Passati", path: "/cronologia" },
        {
          label: "Statistiche",
          path: "/cronologia/statistiche",
          adminOnly: true,
        },
        {
          label: "Report Mensili",
          path: "/cronologia/report",
          adminOnly: true,
        },
      ],
    },
    {
      key: "turni",
      label: "Gestione Turni",
      icon: ChartBarIcon,
      path: "/turni",
      adminOnly: true,
      subItems: [
        { label: "Gestione Turni", path: "/turni/gestione" },
        { label: "Turni Incompleti", path: "/turni/incompleti" },
        { label: "Notifiche", path: "/turni/notifiche" },
      ],
    },
    {
      key: "notifiche",
      label: "Notifiche",
      icon: BellIcon,
      path: "/notifiche",
      adminOnly: true,
    },
    {
      key: "impostazioni",
      label: "Impostazioni",
      icon: CogIcon,
      path: "/impostazioni",
      adminOnly: true,
    },
  ];

  const renderMenuItem = (item) => {
    // Controlla se l'utente ha i permessi per vedere questo elemento
    if (item.adminOnly && user?.ruolo !== "admin") {
      return null;
    }

    const Icon = item.icon;
    const isExpanded = expandedItems.has(item.key);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <div key={item.key}>
        <Link
          to={hasSubItems ? "#" : item.path}
          onClick={
            hasSubItems
              ? (e) => {
                  e.preventDefault();
                  toggleExpanded(item.key);
                }
              : undefined
          }
          className={clsx(
            "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200",
            isActive(item.path) && !hasSubItems
              ? "bg-primary-100 text-primary-700 border-r-2 border-primary-600"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
          <span className="flex-1">{item.label}</span>
          {hasSubItems &&
            (isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            ))}
        </Link>

        {hasSubItems && isExpanded && (
          <div className="ml-8 mt-1 space-y-1">
            {item.subItems.map((subItem) => {
              // Controlla se l'utente ha i permessi per vedere questo sub-elemento
              if (subItem.adminOnly && user?.ruolo !== "admin") {
                return null;
              }

              return (
                <Link
                  key={subItem.path}
                  to={subItem.path}
                  className={clsx(
                    "block px-4 py-2 text-sm rounded-md transition-colors duration-200",
                    isActive(subItem.path)
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  {subItem.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <h1 className="ml-3 text-lg font-semibold text-gray-900">
            Planner Turni
          </h1>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map(renderMenuItem)}
      </nav>

      {/* Copyright */}
      <div className="px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          © 2025 | Developed by D.Arena
        </p>
      </div>

      {/* User Profile Section */}
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <UserCircleIcon className="h-8 w-8 text-gray-400" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.nome} {user?.cognome}
            </p>
            <p className="text-xs text-gray-500 truncate capitalize">
              {user?.ruolo || "volontario"}
            </p>
          </div>
          <button
            onClick={logout}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            title="Logout"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
