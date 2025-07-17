// app/organization/page.tsx
import React from "react";
import {
  Building2,
  Users,
  Target,
  GitBranch,
  FileText,
  CheckSquare,
  Clock,
  Shield,
  Settings,
  Crown,
  Eye,
  Edit,
  Trash2,
  Plus,
  ArrowRight,
  BarChart3,
  Layers,
  Zap,
  Award,
  Globe,
  Lock,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Calendar,
  MessageSquare,
  FileIcon,
  Database,
} from "lucide-react";

export default function OrganizationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Organisation & Gouvernance
                </h1>
                <p className="text-gray-600">
                  Structure, équipes et gestion des droits
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Section 1: Organisation et Équipes */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Organisation et Équipes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Structure hiérarchique claire pour une gestion optimale des
              ressources et de la collaboration
            </p>
          </div>

          {/* Hiérarchie du Travail - Visuelle */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Layers className="w-6 h-6 mr-3 text-blue-600" />
              Hiérarchie du Travail
            </h3>

            <div className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Initiative */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-6 border-2 border-purple-300 h-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-purple-800 mb-2">
                      Initiative
                    </h4>
                    <p className="text-sm text-purple-700 mb-3">
                      Objectif business stratégique
                    </p>
                    <div className="space-y-2 text-xs text-purple-600">
                      <div className="flex items-center">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        ROI et Budget
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Timeline stratégique
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Impact business
                      </div>
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-6 h-6 text-gray-400 mx-auto my-auto hidden lg:block" />

                {/* Epic */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-6 border-2 border-blue-300 h-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                      <GitBranch className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-blue-800 mb-2">
                      Epic
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Ensemble de fonctionnalités liées
                    </p>
                    <div className="space-y-2 text-xs text-blue-600">
                      <div className="flex items-center">
                        <Database className="w-3 h-3 mr-1" />
                        Domaine métier
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        Équipe dédiée
                      </div>
                      <div className="flex items-center">
                        <Zap className="w-3 h-3 mr-1" />
                        Valeur utilisateur
                      </div>
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-6 h-6 text-gray-400 mx-auto my-auto hidden lg:block" />

                {/* Feature */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl p-6 border-2 border-emerald-300 h-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-emerald-800 mb-2">
                      Feature
                    </h4>
                    <p className="text-sm text-emerald-700 mb-3">
                      Fonctionnalité avec critères
                    </p>
                    <div className="space-y-2 text-xs text-emerald-600">
                      <div className="flex items-center">
                        <CheckSquare className="w-3 h-3 mr-1" />
                        Critères d'acceptation
                      </div>
                      <div className="flex items-center">
                        <Award className="w-3 h-3 mr-1" />
                        Valeur business
                      </div>
                      <div className="flex items-center">
                        <FileIcon className="w-3 h-3 mr-1" />
                        Documentation
                      </div>
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-6 h-6 text-gray-400 mx-auto my-auto hidden lg:block" />

                {/* User Story & Task */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl p-4 border-2 border-orange-300">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-3">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-base font-bold text-orange-800 mb-1">
                      User Story
                    </h4>
                    <p className="text-xs text-orange-700 mb-2">
                      Besoin utilisateur
                    </p>
                    <div className="text-xs text-orange-600">Story points</div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl p-4 border-2 border-pink-300">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-3">
                      <CheckSquare className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-base font-bold text-pink-800 mb-1">
                      Task
                    </h4>
                    <p className="text-xs text-pink-700 mb-2">
                      Tâche technique
                    </p>
                    <div className="text-xs text-pink-600">
                      Estimation heures
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Structure Organisationnelle */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                Structure Organisationnelle
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Organisation
                    </h4>
                    <p className="text-sm text-gray-600">
                      Entité racine multi-tenant avec domaines et paramètres
                      globaux
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Équipes</h4>
                    <p className="text-sm text-gray-600">
                      Groupes de travail spécialisés avec compétences
                      complémentaires
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Projets</h4>
                    <p className="text-sm text-gray-600">
                      Initiatives concrètes avec objectifs, délais et ressources
                      dédiées
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                Gestion des Équipes
              </h3>
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">
                    Équipe Cross-Fonctionnelle
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center text-purple-700">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      Product Owner
                    </div>
                    <div className="flex items-center text-purple-700">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      Scrum Master
                    </div>
                    <div className="flex items-center text-purple-700">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      Développeurs
                    </div>
                    <div className="flex items-center text-purple-700">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      Designer UX/UI
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Collaboration
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Chat intégré par équipe</li>
                    <li>• Partage de fichiers versionné</li>
                    <li>• Tableaux de bord collaboratifs</li>
                    <li>• Notifications intelligentes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Projets et Composants */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Projets et Composants
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Architecture modulaire pour une gestion agile et efficace des
              livrables
            </p>
          </div>

          {/* Architecture de Projet */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Target className="w-6 h-6 mr-3 text-green-600" />
              Architecture de Projet
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Gestion Agile */}
              <div className="space-y-6">
                <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Méthodologie Agile
                </h4>

                <div className="space-y-4">
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <h5 className="font-semibold text-green-800 mb-2">
                      Scrum Natif
                    </h5>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Product Backlog dynamique</li>
                      <li>• Sprint Planning automatisé</li>
                      <li>• Daily Scrum intégré</li>
                      <li>• Sprint Review & Rétro</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h5 className="font-semibold text-blue-800 mb-2">
                      Kanban Board
                    </h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Colonnes personnalisables</li>
                      <li>• Limites WIP configurables</li>
                      <li>• Drag & drop intuitif</li>
                      <li>• Métriques de flux</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Composants Techniques */}
              <div className="space-y-6">
                <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Composants Techniques
                </h4>

                <div className="space-y-4">
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                    <h5 className="font-semibold text-indigo-800 mb-2">
                      Gestion de Code
                    </h5>
                    <ul className="text-sm text-indigo-700 space-y-1">
                      <li>• Intégration Git native</li>
                      <li>• Revue de code intégrée</li>
                      <li>• Branches par feature</li>
                      <li>• CI/CD automatisé</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <h5 className="font-semibold text-purple-800 mb-2">
                      Documentation
                    </h5>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Wiki collaboratif</li>
                      <li>• Versioning automatique</li>
                      <li>• Templates réutilisables</li>
                      <li>• Recherche intelligente</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Analytics et Métriques */}
              <div className="space-y-6">
                <h4 className="text-lg font-bold text-orange-800 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Analytics & Métriques
                </h4>

                <div className="space-y-4">
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <h5 className="font-semibold text-orange-800 mb-2">
                      Dashboards
                    </h5>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• Vélocité d'équipe</li>
                      <li>• Burndown charts</li>
                      <li>• Lead time analysis</li>
                      <li>• Prédictions IA</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <h5 className="font-semibold text-red-800 mb-2">
                      Rapports
                    </h5>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Génération automatique</li>
                      <li>• Insights personnalisés</li>
                      <li>• Export multi-format</li>
                      <li>• Scheduling intelligent</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flux de Travail */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <ArrowRight className="w-5 h-5 mr-2 text-blue-600" />
              Flux de Travail Automatisé
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Création</h4>
                <p className="text-sm text-gray-600">
                  User Stories, Tasks et Features
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Edit className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Planification
                </h4>
                <p className="text-sm text-gray-600">
                  Estimation et Priorisation
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Exécution</h4>
                <p className="text-sm text-gray-600">Développement et Tests</p>
              </div>

              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Livraison</h4>
                <p className="text-sm text-gray-600">
                  Déploiement et Validation
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Droits et Autorisations */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Droits et Autorisations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Système de permissions granulaire pour sécuriser et contrôler
              l'accès aux ressources
            </p>
          </div>

          {/* Matrice des Rôles */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Shield className="w-6 h-6 mr-3 text-red-600" />
              Matrice des Rôles et Permissions
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-3 font-semibold text-gray-900">
                      Rôle
                    </th>
                    <th className="text-center py-4 px-3 font-semibold text-gray-700">
                      Organisation
                    </th>
                    <th className="text-center py-4 px-3 font-semibold text-gray-700">
                      Projets
                    </th>
                    <th className="text-center py-4 px-3 font-semibold text-gray-700">
                      Backlog
                    </th>
                    <th className="text-center py-4 px-3 font-semibold text-gray-700">
                      Sprints
                    </th>
                    <th className="text-center py-4 px-3 font-semibold text-gray-700">
                      Équipes
                    </th>
                    <th className="text-center py-4 px-3 font-semibold text-gray-700">
                      Rapports
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Admin */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                          <Crown className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            Admin
                          </div>
                          <div className="text-sm text-gray-500">
                            Contrôle total
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                    </td>
                  </tr>

                  {/* Product Owner */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Target className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            Product Owner
                          </div>
                          <div className="text-sm text-gray-500">
                            Vision produit
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                    </td>
                  </tr>

                  {/* Scrum Master */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <Users className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            Scrum Master
                          </div>
                          <div className="text-sm text-gray-500">
                            Facilitation agile
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                        <Edit className="w-4 h-4 text-yellow-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                        <Edit className="w-4 h-4 text-yellow-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </div>
                    </td>
                  </tr>

                  {/* Developer */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <Settings className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            Developer
                          </div>
                          <div className="text-sm text-gray-500">
                            Développement
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                        <Edit className="w-4 h-4 text-yellow-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                        <Edit className="w-4 h-4 text-yellow-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                  </tr>

                  {/* Stakeholder */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <UserCheck className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            Stakeholder
                          </div>
                          <div className="text-sm text-gray-500">
                            Parties prenantes
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                  </tr>

                  {/* Viewer */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            Viewer
                          </div>
                          <div className="text-sm text-gray-500">
                            Lecture seule
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                    <td className="text-center py-4 px-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Légende */}
            <div className="mt-6 flex flex-wrap gap-6 justify-center text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-2">
                  <CheckSquare className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-700">Contrôle total</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
                  <Edit className="w-3 h-3 text-yellow-600" />
                </div>
                <span className="text-gray-700">Modification limitée</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                  <Eye className="w-3 h-3 text-blue-600" />
                </div>
                <span className="text-gray-700">Lecture seule</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                  <Lock className="w-3 h-3 text-gray-400" />
                </div>
                <span className="text-gray-700">Accès refusé</span>
              </div>
            </div>
          </div>

          {/* Sécurité et Compliance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-red-600" />
                Sécurité et Compliance
              </h3>
              <div className="space-y-4">
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">
                    Authentification
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Multi-facteur (2FA/MFA)</li>
                    <li>• OAuth 2.1 et OIDC</li>
                    <li>• SSO entreprise</li>
                    <li>• Sessions sécurisées</li>
                  </ul>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 mb-2">
                    Chiffrement
                  </h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Données en transit (TLS 1.3)</li>
                    <li>• Données au repos (AES-256)</li>
                    <li>• End-to-end pour fichiers</li>
                    <li>• Clés rotatives automatiques</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                Audit et Gouvernance
              </h3>
              <div className="space-y-4">
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    Traçabilité
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Audit trail complet</li>
                    <li>• Horodatage cryptographique</li>
                    <li>• Logs immutables</li>
                    <li>• Retention automatique</li>
                  </ul>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">
                    Compliance
                  </h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• RGPD natif</li>
                    <li>• SOC 2 Type II</li>
                    <li>• ISO 27001 ready</li>
                    <li>• HIPAA compatible</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Granulaires */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-purple-600" />
              Permissions Granulaires
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Niveau Organisation
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Gestion des utilisateurs
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Configuration globale
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Billing et facturation
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Audit et compliance
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Niveau Projet
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Création/modification
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Gestion des équipes
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Configuration workflow
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Export de données
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Niveau Fonctionnel
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    CRUD sur tâches
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Assignation équipe
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Time tracking
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Commentaires/files
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à transformer votre gestion de projet ?
          </h2>
          <p className="text-xl text-white/90 mb-6">
            Découvrez comment notre plateforme révolutionne la collaboration
            agile
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg">
              Démarrer l'essai gratuit
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors duration-200">
              Demander une démo
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/*
import React from "react";

function page() {
  return (
    <div className="m-10">
      <section>
        <h1>Mon organisation et les equipeq</h1>
        <div>
          Initiative Objectif business stratégique avec ROI et budget Epic
          Ensemble de fonctionnalités liées à un domaine métier Feature
          Fonctionnalité avec critères d'acceptation et valeur business User
          Story Besoin utilisateur avec estimation en story points Task Tâche
          technique avec estimation en heures
        </div>
      </section>
      <section>
        <h1>Les projets et ses composants</h1>
        <div></div>
      </section>
      <section>
        <h1>Les droit et autorisation</h1>
        <div></div>
      </section>

      <section></section>
    </div>
  );
}

export default page;

*/
