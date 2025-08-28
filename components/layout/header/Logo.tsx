import React, { JSX } from "react";
import Link from "next/link";

export default function Logo(): JSX.Element {
  return (
    <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
      {/* Logo container with responsive sizing */}
      <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 via-blue-600 to-cyan-500 rounded-xl shadow-lg transform group-hover:scale-105 transition-all duration-300 ease-out"></div>

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-white/10 to-transparent rounded-xl opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>

        {/* Project Manager icon */}
        <div className="relative z-10 flex items-center justify-center">
          <svg
            className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white drop-shadow-md"
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

        {/* Subtle gradient border */}
        <div className="absolute inset-0 rounded-xl border-2 border-white/20 group-hover:border-white/30 transition-all duration-300"></div>

        {/* Decorative particles */}
        <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-md animate-pulse"></div>
        <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-br from-pink-400 to-red-500 rounded-full shadow-md animate-pulse delay-300"></div>
      </div>

      {/* Responsive text */}
      <div className="flex flex-col">
        <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-pink-600 transition-all duration-300">
          ProjectManager
        </span>
        <span className="text-xs sm:text-sm lg:text-base text-gray-500 group-hover:text-gray-600 transition-colors duration-200 hidden sm:block">
          Gestion de projets
        </span>
      </div>
    </Link>
  );
} 