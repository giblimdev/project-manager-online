import React from "react";
import {
  Layers,
  BookOpen,
  FileCode,
  Settings,
  CheckCircle2,
  Database,
  Shield,
} from "lucide-react";

//
// Constantes mockées (viendront de la DB plus tard)
//
const DEV_DATA = {
  stack: {
    framework: ["Next.js 15+ avec TypeScript strict", "App Router", "Server Components et Actions"],
    libraries: ["Prisma", "Zustand", "BetterAuth", "Tailwind CSS"],
  },
  pages: {
    general: ["Accueil (Home)", "À propos (About)", "Contactez-nous (Contact Us)"],
    business: ["Gestion des projets", "Gestion des tâches", "Gestion des utilisateurs", "Tableaux de bord"],
  },
};

//
// Dictionnaire pour aider à générer les fichiers (prompt réutilisable)
//
const FILE_PROMPTS: Record<
  string,
  { role: string; imports: string[]; exports: string[]; dependencies: string[] }
> = {
  "app/layout.tsx": {
    role: "Layout global de l’app (html, body, providers globaux, bannière cookies).",
    imports: ["React", "globals.css", "@/components/CookieBanner"],
    exports: ["RootLayout"],
    dependencies: ["react", "tailwindcss"],
  },
  "lib/auth/auth-client.tsx": {
    role: "Config client BetterAuth, expose useSession et helpers côté client.",
    imports: ["better-auth/react"],
    exports: ["authClient"],
    dependencies: ["better-auth"],
  },
  "lib/auth/auth-server.ts": {
    role: "Config serveur BetterAuth (sessions, middleware).",
    imports: ["better-auth/server"],
    exports: ["authServer", "getSession"],
    dependencies: ["better-auth"],
  },
  "components/CookieBanner.tsx": {
    role: "Bannière RGPD (accepter/refuser/configurer).",
    imports: ["React", "zustand", "js-cookie", "@/lib/rgpd"],
    exports: ["CookieBanner"],
    dependencies: ["zustand", "js-cookie"],
  },
};

//
// Page
//
export default function DevelopmentHelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">
        {/* En-tête */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-indigo-800 mb-4">
            Aide au Développement
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Documentation et guide pour le développement de l'application
          </p>
          <nav className="flex flex-wrap justify-center gap-4">
            <a href="#stack" className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors">
              Stack Technique
            </a>
            <a href="#presentation" className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors">
              Présentation
            </a>
            <a href="#files" className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors">
              Fichiers
            </a>
          </nav>
        </header>

        {/* Stack Technique */}
        <section id="stack" className="mb-12">
          <h2 className="text-3xl font-semibold text-indigo-700 mb-6 pb-2 border-b-2 border-indigo-200">
            Stack Technique
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-medium text-blue-800 mb-4 flex items-center">
                <Layers className="h-5 w-5 mr-2" /> Framework
              </h3>
              <ul className="space-y-2">
                {DEV_DATA.stack.framework.map((item) => (
                  <li key={item} className="flex items-center">
                    <div className="h-2 w-2 bg-blue-600 rounded-full mr-2"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-xl font-medium text-purple-800 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" /> Bibliothèques utilisées
              </h3>
              <div className="flex flex-wrap gap-2">
                {DEV_DATA.stack.libraries.map((lib) => (
                  <span key={lib} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {lib}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Présentation des pages */}
        <section id="presentation" className="mb-12">
          <h2 className="text-3xl font-semibold text-indigo-700 mb-6 pb-2 border-b-2 border-indigo-200">
            Présentation de l'application
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
                <FileCode className="h-5 w-5 text-indigo-600 mr-2" /> Pages générales
              </h3>
              <ul className="space-y-3">
                {DEV_DATA.pages.general.map((page) => (
                  <li key={page} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 mr-3" />
                    {page}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
                <Database className="h-5 w-5 text-green-600 mr-2" /> Sections métier
              </h3>
              <ul className="space-y-2">
                {DEV_DATA.pages.business.map((item) => (
                  <li key={item} className="text-gray-700">• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Fichiers réutilisables */}
        <section id="files" className="mb-12">
          <h2 className="text-3xl font-semibold text-indigo-700 mb-6 pb-2 border-b-2 border-indigo-200">
            Fichiers réutilisables (Prompt aide)
          </h2>
          <div className="grid gap-6">
            {Object.entries(FILE_PROMPTS).map(([file, def]) => (
              <div key={file} className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                  <Settings className="h-5 w-5 text-blue-600 mr-2" /> {file}
                </h3>
                <p className="text-sm text-gray-700 mb-2">{def.role}</p>
                <div className="text-sm text-gray-600">
                  <strong>Imports:</strong> {def.imports.join(", ")} <br />
                  <strong>Exports:</strong> {def.exports.join(", ")} <br />
                  <strong>Dépendances:</strong> {def.dependencies.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
