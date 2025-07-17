// app/page.tsx
import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Users,
  Target,
  Zap,
  BarChart3,
  GitBranch,
  MessageSquare,
  Clock,
  Shield,
  CheckCircle,
  Star,
  Rocket,
  Brain,
  Layers,
  Play,
  TrendingUp,
  Globe,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Rocket className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              ProjectManager
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-4">
              La plateforme de gestion de projet agile qui surpasse Jira
            </p>

            <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
              Révolutionnez votre façon de travailler avec une interface
              moderne, des fonctionnalités IA intégrées et une collaboration
              temps réel
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Commencer gratuitement
                <ArrowRight className="inline-block ml-2 w-5 h-5" />
              </Link>

              <Link
                href="/demo"
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors duration-200"
              >
                <Play className="inline-block mr-2 w-5 h-5" />
                Voir la démo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir ProjectManager ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une plateforme complète qui combine la puissance de Jira avec la
              simplicité moderne
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <div className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                IA Intégrée
              </h3>
              <p className="text-gray-600">
                Estimation automatique, priorisation intelligente et détection
                des dépendances
              </p>
            </div>

            <div className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Temps Réel
              </h3>
              <p className="text-gray-600">
                Collaboration instantanée avec synchronisation en temps réel
              </p>
            </div>

            <div className="group p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Scrum Natif
              </h3>
              <p className="text-gray-600">
                Artefacts et événements Scrum intégrés avec génération
                automatique
              </p>
            </div>

            <div className="group p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analytics Avancés
              </h3>
              <p className="text-gray-600">
                Rapports automatiques avec insights IA et prédictions
              </p>
            </div>

            <div className="group p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl border border-pink-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Intégrations
              </h3>
              <p className="text-gray-600">
                Connecté nativement avec GitHub, GitLab, Slack et Teams
              </p>
            </div>

            <div className="group p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl border border-indigo-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sécurité
              </h3>
              <p className="text-gray-600">
                Conformité RGPD et SOC2 avec audit trail complet
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Work Hierarchy */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Hiérarchie du Travail
            </h2>
            <p className="text-xl text-gray-600">
              Organisation claire et structurée de vos projets
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Hierarchy Visual */}
              <div className="flex flex-col space-y-6">
                {/* Initiative */}
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-500 rounded-full mr-4"></div>
                  <div className="flex-1 bg-gradient-to-r from-purple-100 to-purple-200 p-6 rounded-xl border border-purple-300">
                    <h3 className="text-xl font-semibold text-purple-800 mb-2">
                      Initiative
                    </h3>
                    <p className="text-purple-700">
                      Objectif business stratégique avec ROI et budget
                    </p>
                  </div>
                </div>

                {/* Epic */}
                <div className="flex items-center ml-8">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-4"></div>
                  <div className="flex-1 bg-gradient-to-r from-blue-100 to-blue-200 p-6 rounded-xl border border-blue-300">
                    <h3 className="text-xl font-semibold text-blue-800 mb-2">
                      Epic
                    </h3>
                    <p className="text-blue-700">
                      Ensemble de fonctionnalités liées à un domaine métier
                    </p>
                  </div>
                </div>

                {/* Feature */}
                <div className="flex items-center ml-16">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full mr-4"></div>
                  <div className="flex-1 bg-gradient-to-r from-emerald-100 to-emerald-200 p-6 rounded-xl border border-emerald-300">
                    <h3 className="text-xl font-semibold text-emerald-800 mb-2">
                      Feature
                    </h3>
                    <p className="text-emerald-700">
                      Fonctionnalité avec critères d'acceptation et valeur
                      business
                    </p>
                  </div>
                </div>

                {/* User Story */}
                <div className="flex items-center ml-24">
                  <div className="w-4 h-4 bg-orange-500 rounded-full mr-4"></div>
                  <div className="flex-1 bg-gradient-to-r from-orange-100 to-orange-200 p-6 rounded-xl border border-orange-300">
                    <h3 className="text-xl font-semibold text-orange-800 mb-2">
                      User Story
                    </h3>
                    <p className="text-orange-700">
                      Besoin utilisateur avec estimation en story points
                    </p>
                  </div>
                </div>

                {/* Task */}
                <div className="flex items-center ml-32">
                  <div className="w-4 h-4 bg-pink-500 rounded-full mr-4"></div>
                  <div className="flex-1 bg-gradient-to-r from-pink-100 to-pink-200 p-6 rounded-xl border border-pink-300">
                    <h3 className="text-xl font-semibold text-pink-800 mb-2">
                      Task
                    </h3>
                    <p className="text-pink-700">
                      Tâche technique avec estimation en heures
                    </p>
                  </div>
                </div>
              </div>

              {/* Connecting lines */}
              <div className="absolute left-2 top-6 bottom-6 w-0.5 bg-gradient-to-b from-purple-400 via-blue-400 via-emerald-400 via-orange-400 to-pink-400"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Scenarios Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Scénarios d'Utilisation
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez comment ProjectManager transforme votre quotidien
            </p>
          </div>

          <div className="space-y-16">
            {/* Scenario 1: E-commerce Project */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 border border-blue-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Projet E-commerce
                  </h3>
                  <p className="text-gray-600">
                    Lancement d'une plateforme de vente en ligne
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Initialisation (Jour 1)
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Création du projet avec template e-commerce</li>
                    <li>
                      • Génération automatique des épics (Auth, Catalogue,
                      Panier)
                    </li>
                    <li>• Attribution des rôles et permissions</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Développement (Jour 5-18)
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Assignation automatique par expertise</li>
                    <li>• Collaboration temps réel avec chat intégré</li>
                    <li>• Détection automatique des blocages</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
                  Résultats
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      38/40
                    </div>
                    <div className="text-sm text-gray-600">Story Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      3.2j
                    </div>
                    <div className="text-sm text-gray-600">Lead Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      4.8/5
                    </div>
                    <div className="text-sm text-gray-600">Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">2h</div>
                    <div className="text-sm text-gray-600">Setup</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scenario 2: Crisis Management */}
            <div className="bg-gradient-to-br from-red-50 to-pink-100 rounded-3xl p-8 border border-red-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Gestion de Crise
                  </h3>
                  <p className="text-gray-600">
                    Bug critique en production sur FitTracker
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Détection (9h00)
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Alerte automatique webhook</li>
                    <li>• Création bug critique</li>
                    <li>• Escalade intelligente</li>
                  </ul>
                </div>

                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Résolution (11h00)
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Assignation par expertise</li>
                    <li>• Revue de code accélérée</li>
                    <li>• Déploiement coordonné</li>
                  </ul>
                </div>

                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Post-Mortem (14h00)
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Rapport automatique</li>
                    <li>• Timeline reconstituée</li>
                    <li>• Actions correctives IA</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 text-red-500 mr-2" />
                  Performance
                </h4>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    5 heures
                  </div>
                  <div className="text-gray-600">
                    Temps de résolution (objectif: 12h)
                  </div>
                </div>
              </div>
            </div>

            {/* Scenario 3: Team Scaling */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-3xl p-8 border border-emerald-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Scaling d'Équipe
                  </h3>
                  <p className="text-gray-600">
                    Plateforme SaaS avec 3 équipes et 15 développeurs
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Architecture Multi-Équipes
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-gray-700">
                          Core Platform (5 devs)
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                        <span className="text-gray-700">
                          Analytics (5 devs)
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                        <span className="text-gray-700">Security (5 devs)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Gouvernance
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Dashboards multi-niveaux</li>
                      <li>• Métriques de collaboration</li>
                      <li>• Optimisation continue</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 text-emerald-500 mr-2" />
                    Métriques de Performance
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Vélocité globale</span>
                      <span className="text-xl font-bold text-emerald-600">
                        180 SP/sprint
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">
                        Résolution dépendances
                      </span>
                      <span className="text-xl font-bold text-blue-600">
                        1.5 jours
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">
                        Satisfaction inter-équipes
                      </span>
                      <span className="text-xl font-bold text-purple-600">
                        4.6/5
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Time-to-market</span>
                      <span className="text-xl font-bold text-orange-600">
                        6 mois
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Detail */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités Clés
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce dont vous avez besoin pour gérer vos projets agiles
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Backlog Management */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Backlog Management
                </h3>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Drag & Drop Intuitif
                    </h4>
                    <p className="text-gray-600">
                      Réorganisez vos user stories par simple glissement
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Priorisation Automatique
                    </h4>
                    <p className="text-gray-600">
                      IA basée sur la valeur métier et la complexité
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Dépendances Intelligentes
                    </h4>
                    <p className="text-gray-600">
                      Détection automatique des liens entre tâches
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Sprint Planning */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Sprint Planning
                </h3>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Estimation Automatique
                    </h4>
                    <p className="text-gray-600">
                      ML basé sur la vélocité historique de l'équipe
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Capacité Calculée
                    </h4>
                    <p className="text-gray-600">
                      Prise en compte des congés et disponibilités
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Burndown Temps Réel
                    </h4>
                    <p className="text-gray-600">
                      Métriques mises à jour instantanément
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Collaboration */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Collaboration
                </h3>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Chat Intégré
                    </h4>
                    <p className="text-gray-600">
                      Discussions par équipe, projet et fonctionnalité
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Commentaires Temps Réel
                    </h4>
                    <p className="text-gray-600">
                      Notifications intelligentes et mentions
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Partage de Fichiers
                    </h4>
                    <p className="text-gray-600">
                      Versioning automatique et co-édition
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Analytics */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mr-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Analytics & Reporting
                </h3>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Dashboards Personnalisables
                    </h4>
                    <p className="text-gray-600">
                      Widgets modulaires et responsive
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Rapports Automatiques
                    </h4>
                    <p className="text-gray-600">
                      Insights IA et recommandations d'action
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Analyse Prédictive
                    </h4>
                    <p className="text-gray-600">
                      Prédiction des délais avec Monte Carlo
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Prêt à révolutionner votre gestion de projet ?
            </h2>

            <p className="text-xl text-white/90 mb-8">
              Rejoignez des milliers d'équipes qui ont déjà adopté
              ProjectManager
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Sparkles className="inline-block mr-2 w-5 h-5" />
                Commencer gratuitement
              </Link>

              <Link
                href="/contact"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors duration-200"
              >
                Demander une démo
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">99.9%</div>
                <div className="text-white/80">Uptime garanti</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="text-white/80">Support client</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">30j</div>
                <div className="text-white/80">Essai gratuit</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
