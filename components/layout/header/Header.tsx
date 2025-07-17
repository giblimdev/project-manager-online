// components/layout/header/Header.tsx
"use client";

import React, { useState, useEffect, JSX } from "react";
import Logo from "@/components/layout/header/Logo";
import Nav from "./Nav";
import IsConnected from "./IsConnected";
import { Menu, X } from "lucide-react";

export default function Header(): JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Détection du scroll pour l'effet de header
  useEffect(() => {
    const handleScroll = (): void => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fermer le menu mobile lors du redimensionnement
  useEffect(() => {
    const handleResize = (): void => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Bloquer le scroll quand le menu mobile est ouvert
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 
          transition-all duration-300 ease-in-out 
          ${
            isScrolled
              ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200"
              : "bg-white/80 backdrop-blur-sm"
          }
        `}
      >
        <div className="m-3 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex-shrink-0 z-10">
              <Logo />
            </div>

            {/* Navigation Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <Nav />
            </div>

            {/* Connexion + Menu Burger */}
            <div className="flex items-center space-x-4">
              {/* Connexion - Toujours visible */}
              <div className="flex-shrink-0">
                <IsConnected />
              </div>

              {/* Menu Burger - Mobile uniquement */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-600" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menu Mobile */}
        <div
          className={`
            md:hidden absolute top-full left-0 right-0
            bg-white border-t border-gray-200
            transform transition-all duration-300 ease-in-out
            ${
              isMobileMenuOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none"
            }
          `}
        >
          <div className="container mx-auto px-4 py-4">
            <Nav
              isMobile={true}
              onItemClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      </header>

      {/* Overlay Mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Spacer pour compenser le header fixe */}
      <div className="h-16 md:h-20" />
    </>
  );
}
