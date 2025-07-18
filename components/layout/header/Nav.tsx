// components/layout/header/Nav.tsx
"use client";

import React, { JSX, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface DropdownItem {
  label: string;
  href: string;
  description?: string;
}

interface NavProps {
  isMobile?: boolean;
  onItemClick?: () => void;
}

const navItems: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "HowTo", href: "/HowTo" },
  { label: "Documentation", href: "/doc" },
  { label: "Services", href: "/services" },
  { label: "À propos", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const toolsDropdownItems: DropdownItem[] = [
  {
    label: "Projets",
    href: "/projects",
    description: "Gérez vos projets agiles",
  },
  {
    label: "Teams",
    href: "/teams",
    description: "Organisez vos équipes",
  },
  {
    label: "Blog",
    href: "/blog",
    description: "Articles et actualités",
  },
];

export default function Nav({
  isMobile = false,
  onItemClick,
}: NavProps): JSX.Element {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleItemClick = (): void => {
    if (onItemClick) {
      onItemClick();
    }
    setIsDropdownOpen(false);
  };

  // Vérifier si une des pages tools est active
  const isToolsActive = toolsDropdownItems.some((item) =>
    pathname.startsWith(item.href)
  );

  if (isMobile) {
    return (
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleItemClick}
              className={`
                block px-4 py-3 rounded-lg text-base font-medium
                transition-colors duration-200
                ${
                  isActive
                    ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              {item.label}
            </Link>
          );
        })}

        {/* Tools section pour mobile */}
        <div className="pt-2 border-t border-gray-200">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Tools
          </div>
          {toolsDropdownItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleItemClick}
                className={`
                  block px-4 py-3 rounded-lg text-base font-medium
                  transition-colors duration-200
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex items-center space-x-8">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              relative px-3 py-2 text-sm font-medium
              transition-colors duration-200
              ${
                isActive ? "text-blue-600" : "text-gray-700 hover:text-gray-900"
              }
            `}
          >
            {item.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </Link>
        );
      })}

      {/* Dropdown Tools pour desktop */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`
            relative flex items-center px-3 py-2 text-sm font-medium
            transition-colors duration-200
            ${
              isToolsActive
                ? "text-blue-600"
                : "text-gray-700 hover:text-gray-900"
            }
          `}
        >
          Tools
          <ChevronDown
            className={`ml-1 h-4 w-4 transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
          {isToolsActive && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            {toolsDropdownItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleItemClick}
                  className={`
                    block px-4 py-3 transition-colors duration-200
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <div className="font-medium text-sm">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {item.description}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
