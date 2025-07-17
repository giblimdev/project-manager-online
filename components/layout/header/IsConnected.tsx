// components/layout/header/IsConnected.tsx
"use client";

import React, { useState, useRef, useEffect, JSX } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  Settings,
  Users,
  FolderOpen,
  Briefcase,
  ChevronDown,
  LogIn,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth/auth-client";

export default function IsConnected(): JSX.Element {
  // ✅ Utilisation correcte du hook useSession
  const { data: session, isPending, error } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fermer le dropdown lors du redimensionnement
  useEffect(() => {
    const handleResize = (): void => {
      setIsDropdownOpen(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut();
      setIsDropdownOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const handleLogin = async (): Promise<void> => {
    try {
      router.push("/auth/signin");
    } catch (error) {
      console.error("Erreur lors de la redirection:", error);
    }
  };

  const handleMenuClick = (path: string): void => {
    setIsDropdownOpen(false);
    router.push(path);
  };

  // Gestion des erreurs
  if (error) {
    console.error("Erreur de session:", error);
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={handleLogin}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200"
        >
          <LogIn className="w-4 h-4" />
          <span className="hidden sm:block">Reconnexion</span>
        </button>
      </div>
    );
  }

  // État de chargement
  if (isPending) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="hidden sm:block">
          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
          <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Utilisateur non connecté
  if (!session?.user) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={handleLogin}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <LogIn className="w-4 h-4" />
          <span className="hidden sm:block">Connexion</span>
        </button>
      </div>
    );
  }

  // Générer les initiales pour l'avatar
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = getInitials(
    session.user.name || session.user.email || "U"
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton utilisateur */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg group-hover:scale-105 transition-transform duration-200">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "Avatar"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              userInitials
            )}
          </div>
          {/* Indicateur en ligne */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
        </div>

        {/* Informations utilisateur (desktop) */}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
            {session.user.name || "Utilisateur"}
          </p>
          <p className="text-xs text-gray-500 truncate max-w-32">
            {session.user.email}
          </p>
        </div>

        {/* Flèche dropdown */}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Menu déroulant */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 transform transition-all duration-200 origin-top-right">
          {/* En-tête du menu */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "Avatar"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  userInitials
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {session.user.name || "Utilisateur"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-2">
            {/* Profil */}
            <button
              onClick={() => handleMenuClick("/profile")}
              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200 group"
            >
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors duration-200">
                <Settings className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Profil</p>
                <p className="text-xs text-gray-500">
                  Modifier mes informations
                </p>
              </div>
            </button>

            {/* Mes équipes */}
            <button
              onClick={() => handleMenuClick("/teams")}
              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors duration-200 group"
            >
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors duration-200">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Mes équipes</p>
                <p className="text-xs text-gray-500">Gérer mes équipes</p>
              </div>
            </button>

            {/* Mes projets */}
            <button
              onClick={() => handleMenuClick("/projects")}
              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 group"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                <FolderOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Mes projets</p>
                <p className="text-xs text-gray-500">Voir mes projets</p>
              </div>
            </button>

            {/* Mes services */}
            <button
              onClick={() => handleMenuClick("/services")}
              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors duration-200 group"
            >
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors duration-200">
                <Briefcase className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Mes services</p>
                <p className="text-xs text-gray-500">Gérer mes services</p>
              </div>
            </button>
          </div>

          {/* Séparateur */}
          <div className="border-t border-gray-100 my-2"></div>

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 group"
          >
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors duration-200">
              <LogOut className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Déconnexion</p>
              <p className="text-xs text-red-500">Se déconnecter du compte</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
