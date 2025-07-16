// app/page.tsx
// Page d'accueil principale de l'application AgileCore
// Utilise Next.js 15+, TypeScript strict, Shadcn icons et Framer Motion

"use client";

import React, { JSX } from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  Lightbulb,
  Folder,
  Settings,
  Play,
  FileText,
  ArrowRight,
  Compass,
  Sparkles,
  Link,
} from "lucide-react";

interface RoadmapStep {
  id: number;
  title: string;
  emoji: string;
  description: string;
  icon: React.ReactNode;
}

const roadmapSteps: RoadmapStep[] = [
  {
    id: 1,
    title: "Définir l'idée",
    emoji: "💡",
    description:
      "Renseignez la vision produit sous forme d'initiative stratégique. Cela permet d'aligner les objectifs métier avec les besoins utilisateurs.",
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    id: 2,
    title: "Créer un projet à partir d'un template",
    emoji: "📁",
    description:
      "Sélectionnez un modèle prêt à l'emploi (ex : application web, mobile, SaaS…) avec une structure d'epics, workflows et bonnes pratiques préconfigurés.",
    icon: <Folder className="w-6 h-6" />,
  },
  {
    id: 3,
    title: "Structurer le backlog",
    emoji: "🔧",
    description:
      "Organisez votre travail en Initiatives → Epics → Features → User Stories pour garder une vision claire de la stratégie à l'exécution.",
    icon: <Settings className="w-6 h-6" />,
  },
  {
    id: 4,
    title: "Planifier les sprints",
    emoji: "🏃",
    description:
      "Sélectionnez les user stories à réaliser, estimer leur complexité (story points), et définissez la capacité de l'équipe pour chaque sprint.",
    icon: <Play className="w-6 h-6" />,
  },
  {
    id: 5,
    title: "Créer les fichiers & dossiers de l'app",
    emoji: "🗂️",
    description:
      "Chaque user story est liée à une ou plusieurs tâches techniques. Le système génère automatiquement l'architecture des dossiers et fichiers à créer dans votre projet Next.js/TypeScript.",
    icon: <FileText className="w-6 h-6" />,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function HomePage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center items-center gap-3 mb-6">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Rocket className="w-12 h-12 text-blue-600" />
              </motion.div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900">
                Bienvenue sur{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AgileCore
                </span>
              </h1>
            </div>

            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Une plateforme de gestion de projets agile pensée pour les équipes
              modernes. De l'idée à la livraison, pilotez votre produit avec
              clarté, flexibilité et puissance.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              {" "}
              <Sparkles className="w-5 h-5" />
              Démarrer un nouveau projet
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />{" "}
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="flex justify-center items-center gap-3 mb-4">
              <Compass className="w-8 h-8 text-blue-600" />
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Roadmap de création d'un projet
              </h2>
            </div>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Suivez ces étapes pour créer votre projet agile de manière
              optimale
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {roadmapSteps.map((step) => (
              <motion.div
                key={step.id}
                variants={itemVariants}
                className="group relative bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300"
              >
                <div className="absolute top-6 right-6 text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
                  {step.emoji}
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                    <div className="text-blue-600">{step.icon}</div>
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full text-sm font-bold text-slate-600">
                    {step.id}
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {step.title}
                </h3>

                <p className="text-slate-600 leading-relaxed">
                  {step.description}
                </p>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-slate-600"
          >
            Besoin d'aide pour démarrer ? Consultez notre{" "}
            <a
              href="#"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              documentation
            </a>{" "}
            ou contactez l'équipe produit.
          </motion.p>
        </div>
      </footer>
    </div>
  );
}
