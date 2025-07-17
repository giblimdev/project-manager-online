// components/layout/header/Logo.tsx
import React, { JSX } from "react";
import Link from "next/link";

export default function Logo(): JSX.Element {
  return (
    <Link href="/" className="flex items-center space-x-3 group">
      {/* Logo visuel agrandi avec dégradé prononcé */}
      <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18">
        {/* Fond avec dégradé multicolore */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 via-blue-600 to-cyan-500 rounded-2xl shadow-xl transform group-hover:scale-110 transition-all duration-300 ease-out"></div>

        {/* Effet de brillance renforcé */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-white/10 to-transparent rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Icône Project Manager agrandie */}
        <div className="relative z-10 flex items-center justify-center">
          <svg
            className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white drop-shadow-lg"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        </div>

        {/* Bordure subtile avec dégradé */}
        <div className="absolute inset-0 rounded-2xl border-2 border-white/20 group-hover:border-white/40 transition-all duration-300"></div>

        {/* Particules décoratives */}
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg animate-pulse"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-gradient-to-br from-pink-400 to-red-500 rounded-full shadow-lg animate-pulse delay-300"></div>
      </div>

      {/* Texte agrandi avec dégradé */}
      <div className="flex flex-col">
        <span className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-pink-600 transition-all duration-300">
          ProjectManager
        </span>
        <span className="text-sm sm:text-base text-gray-500 hidden sm:block group-hover:text-gray-600 transition-colors duration-200">
          Gestion de projets
        </span>
      </div>
    </Link>
  );
}
