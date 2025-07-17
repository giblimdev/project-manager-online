// components/layout/header/Nav.tsx
"use client";

import React, { JSX } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface NavProps {
  isMobile?: boolean;
  onItemClick?: () => void;
}

const navItems: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Projets", href: "/projects" },
  { label: "Teams", href: "/teams" },
  { label: "Services", href: "/services" },
  { label: "À propos", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Nav({
  isMobile = false,
  onItemClick,
}: NavProps): JSX.Element {
  const pathname = usePathname();

  const handleItemClick = (): void => {
    if (onItemClick) {
      onItemClick();
    }
  };

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
    </nav>
  );
}
