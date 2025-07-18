// app/services/page.tsx
// Page Services de l'application AgileCore - Version corrigée
// Utilise Next.js 15+, TypeScript strict, Shadcn icons et Framer Motion

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Rocket,
  Users,
  Zap,
  Target,
  Settings,
  BarChart3,
  Shield,
  Globe,
  CheckCircle,
  ArrowRight,
  Star,
  Clock,
  TrendingUp,
  Lightbulb,
  MessageCircle,
  HeadphonesIcon,
  ChevronRight,
  Play,
  Pause,
  Award,
  Infinity,
  Sparkles,
  Coffee,
  BookOpen,
  Video,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";

// Types stricts pour TypeScript strict mode
interface Service {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly color: string;
  readonly features: readonly string[];
  readonly pricing: {
    readonly starter: string;
    readonly professional: string;
    readonly enterprise: string;
  };
  readonly popular?: boolean;
}

interface PricingPlan {
  readonly name: string;
  readonly price: string;
  readonly period: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly popular?: boolean;
  readonly cta: string;
  readonly color: string;
}

interface SupportOption {
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly availability: string;
  readonly responseTime: string;
  readonly color: string;
}

// Data avec typage strict
const services: readonly Service[] = [
  {
    id: "project-management",
    title: "Gestion de Projet Agile",
    description:
      "Solution complète pour orchestrer vos projets avec des méthodologies agiles modernes.",
    icon: <Rocket className="w-8 h-8" />,
    color: "from-blue-500 to-cyan-500",
    features: [
      "Scrum, Kanban, SAFe intégrés",
      "Backlog management intelligent",
      "Sprint planning automatisé",
      "Burndown charts en temps réel",
      "Dépendances automatiques",
      "Roadmaps interactives",
    ] as const,
    pricing: {
      starter: "€9/mois",
      professional: "€19/mois",
      enterprise: "Sur mesure",
    },
    popular: true,
  },
  {
    id: "team-collaboration",
    title: "Collaboration d'Équipe",
    description:
      "Outils avancés pour synchroniser et aligner vos équipes distribuées.",
    icon: <Users className="w-8 h-8" />,
    color: "from-purple-500 to-pink-500",
    features: [
      "Chat temps réel intégré",
      "Commentaires contextuels",
      "Partage de fichiers versionné",
      "Revues de code collaboratives",
      "Notifications intelligentes",
      "Espaces de travail partagés",
    ] as const,
    pricing: {
      starter: "€5/mois",
      professional: "€12/mois",
      enterprise: "Sur mesure",
    },
  },
  {
    id: "ai-insights",
    title: "Intelligence Artificielle",
    description:
      "IA native pour optimiser vos processus et prédire les résultats.",
    icon: <Zap className="w-8 h-8" />,
    color: "from-yellow-500 to-orange-500",
    features: [
      "Estimation automatique des tâches",
      "Priorisation basée sur la valeur",
      "Analyse prédictive des délais",
      "Détection des risques",
      "Recommandations personnalisées",
      "Rapports auto-générés",
    ] as const,
    pricing: {
      starter: "Non disponible",
      professional: "€29/mois",
      enterprise: "Sur mesure",
    },
  },
  {
    id: "analytics",
    title: "Analytics & Reporting",
    description:
      "Tableaux de bord avancés et métriques pour piloter la performance.",
    icon: <BarChart3 className="w-8 h-8" />,
    color: "from-green-500 to-emerald-500",
    features: [
      "Dashboards personnalisables",
      "KPIs temps réel",
      "Métriques de vélocité",
      "Analyse de tendances",
      "Export automatique",
      "Benchmarking industrie",
    ] as const,
    pricing: {
      starter: "€7/mois",
      professional: "€15/mois",
      enterprise: "Sur mesure",
    },
  },
  {
    id: "integrations",
    title: "Intégrations & API",
    description: "Connectez AgileCore à votre écosystème d'outils existant.",
    icon: <Settings className="w-8 h-8" />,
    color: "from-indigo-500 to-purple-500",
    features: [
      "API REST & GraphQL",
      "Webhooks personnalisés",
      "Intégrations natives (Git, Slack, etc.)",
      "SSO / SAML",
      "Workflows automatisés",
      "Marketplace d'extensions",
    ] as const,
    pricing: {
      starter: "€3/mois",
      professional: "€8/mois",
      enterprise: "Sur mesure",
    },
  },
  {
    id: "security",
    title: "Sécurité & Conformité",
    description:
      "Protection enterprise-grade et conformité aux standards internationaux.",
    icon: <Shield className="w-8 h-8" />,
    color: "from-red-500 to-pink-500",
    features: [
      "Chiffrement end-to-end",
      "Authentification multi-facteurs",
      "Audit trail complet",
      "Conformité RGPD/SOC 2",
      "Permissions granulaires",
      "Sauvegarde automatique",
    ] as const,
    pricing: {
      starter: "Inclus",
      professional: "Inclus",
      enterprise: "Renforcé",
    },
  },
] as const;

const pricingPlans: readonly PricingPlan[] = [
  {
    name: "Starter",
    price: "€19",
    period: "/mois/équipe",
    description: "Parfait pour les petites équipes qui débutent avec l'agile.",
    features: [
      "Jusqu'à 10 utilisateurs",
      "Projets illimités",
      "Gestion de base",
      "Support par email",
      "Intégrations essentielles",
      "Stockage 5GB",
    ] as const,
    cta: "Commencer gratuitement",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Professional",
    price: "€49",
    period: "/mois/équipe",
    description: "Pour les équipes agiles qui veulent aller plus loin.",
    features: [
      "Jusqu'à 50 utilisateurs",
      "Projets illimités",
      "IA & Analytics avancés",
      "Support prioritaire",
      "Intégrations complètes",
      "Stockage 50GB",
      "Rapports personnalisés",
      "Workflows automatisés",
    ] as const,
    popular: true,
    cta: "Essai gratuit 14 jours",
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "Enterprise",
    price: "Sur mesure",
    period: "/mois",
    description: "Solution complète pour les grandes organisations.",
    features: [
      "Utilisateurs illimités",
      "Projets illimités",
      "IA & Analytics premium",
      "Support dédié 24/7",
      "API personnalisée",
      "Stockage illimité",
      "Sécurité renforcée",
      "Formation sur site",
      "SLA garanti",
    ] as const,
    cta: "Contactez-nous",
    color: "from-green-500 to-emerald-500",
  },
] as const;

const supportOptions: readonly SupportOption[] = [
  {
    title: "Documentation & Guides",
    description: "Base de connaissances complète avec tutoriels et FAQ.",
    icon: <BookOpen className="w-6 h-6" />,
    availability: "24/7",
    responseTime: "Immédiat",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Support par Email",
    description: "Assistance technique par email avec notre équipe d'experts.",
    icon: <Mail className="w-6 h-6" />,
    availability: "Lun-Ven 9h-18h",
    responseTime: "< 4 heures",
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Chat en Direct",
    description:
      "Support instantané via chat pour résoudre vos questions rapidement.",
    icon: <MessageCircle className="w-6 h-6" />,
    availability: "Lun-Ven 9h-18h",
    responseTime: "< 2 minutes",
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Support Téléphonique",
    description:
      "Assistance vocale dédiée pour les clients Professional et Enterprise.",
    icon: <Phone className="w-6 h-6" />,
    availability: "Lun-Ven 9h-18h",
    responseTime: "Immédiat",
    color: "from-orange-500 to-red-500",
  },
  {
    title: "Formation & Onboarding",
    description:
      "Sessions de formation personnalisées pour maximiser votre adoption.",
    icon: <Video className="w-6 h-6" />,
    availability: "Sur rendez-vous",
    responseTime: "Planifié",
    color: "from-indigo-500 to-purple-500",
  },
  {
    title: "Support Dédié 24/7",
    description: "Équipe dédiée disponible 24h/24 pour les clients Enterprise.",
    icon: <HeadphonesIcon className="w-6 h-6" />,
    availability: "24/7",
    responseTime: "< 15 minutes",
    color: "from-yellow-500 to-orange-500",
  },
] as const;

// Variants Framer Motion avec typage strict
const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Composant principal avec typage strict
const ServicesPage: React.FC = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

  const handleServiceSelect = React.useCallback((serviceId: string): void => {
    setSelectedService((prev) => (prev === serviceId ? null : serviceId));
  }, []);

  const handleVideoToggle = React.useCallback((): void => {
    setIsVideoPlaying((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 mb-8"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium">
                Suite complète de services agiles
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Nos{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                Services
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-blue-100 max-w-3xl mx-auto mb-10 leading-relaxed">
              Découvrez notre gamme complète de services pour{" "}
              <span className="font-semibold text-white">
                révolutionner votre gestion de projet
              </span>{" "}
              et{" "}
              <span className="font-semibold text-white">
                accélérer votre delivery
              </span>
              .
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Target className="w-5 h-5" />
                Explorer nos services
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleVideoToggle}
                type="button"
                className="inline-flex items-center gap-3 bg-transparent text-white px-8 py-4 rounded-xl font-semibold border-2 border-white hover:bg-white hover:text-blue-600 transition-all duration-300 group"
              >
                {isVideoPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                Voir la démo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto"
            >
              {[
                {
                  icon: <Users className="w-6 h-6" />,
                  value: "6",
                  label: "Services clés",
                },
                {
                  icon: <Globe className="w-6 h-6" />,
                  value: "99.9%",
                  label: "Disponibilité",
                },
                {
                  icon: <Clock className="w-6 h-6" />,
                  value: "24/7",
                  label: "Support",
                },
                {
                  icon: <Award className="w-6 h-6" />,
                  value: "SOC 2",
                  label: "Certifié",
                },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-2">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-blue-100">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
              Suite Complète de Services
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Chaque service est conçu pour s'intégrer parfaitement avec les
              autres, créant un écosystème puissant pour votre gestion de projet
              agile.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {services.map((service) => (
              <motion.div
                key={service.id}
                variants={cardVariants}
                className={`group relative bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-300 cursor-pointer ${
                  selectedService === service.id
                    ? "border-blue-500 shadow-2xl scale-105"
                    : "border-slate-200 hover:border-blue-300 hover:shadow-xl"
                } ${service.popular ? "ring-2 ring-blue-500/20" : ""}`}
                onClick={() => handleServiceSelect(service.id)}
              >
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Le plus populaire
                    </div>
                  </div>
                )}

                <div className="relative">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${service.color} rounded-2xl mb-6 text-white shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    {service.icon}
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h3>

                  <p className="text-slate-600 leading-relaxed mb-6">
                    {service.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    {service.features
                      .slice(0, 3)
                      .map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-center gap-2 text-sm text-slate-600"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    {service.features.length > 3 && (
                      <div className="text-sm text-blue-600 font-medium">
                        +{service.features.length - 3} autres fonctionnalités
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between items-center text-sm text-slate-600 mb-2">
                      <span>À partir de</span>
                      <span className="font-semibold text-slate-900">
                        {service.pricing.starter}
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      className={`w-full bg-gradient-to-r ${service.color} text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 group`}
                    >
                      En savoir plus
                      <ArrowRight className="w-4 h-4 inline ml-2 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedService === service.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6 pt-6 border-t border-slate-200"
                    >
                      <h4 className="font-semibold text-slate-900 mb-3">
                        Fonctionnalités complètes :
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {service.features.map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="flex items-center gap-2 text-sm text-slate-600"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
              Tarifs Transparents
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choisissez le plan qui correspond à vos besoins. Tous les plans
              incluent les mises à jour gratuites.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                className={`relative bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-300 ${
                  plan.popular
                    ? "border-blue-500 shadow-2xl scale-105"
                    : "border-slate-200 hover:border-blue-300 hover:shadow-xl"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Recommandé
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${plan.color} rounded-2xl mb-4 text-white`}
                  >
                    {plan.name === "Starter" ? (
                      <Coffee className="w-8 h-8" />
                    ) : plan.name === "Professional" ? (
                      <TrendingUp className="w-8 h-8" />
                    ) : (
                      <Infinity className="w-8 h-8" />
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-4xl font-bold text-slate-900 mb-1">
                    {plan.price}
                  </div>
                  <div className="text-slate-600 mb-4">{plan.period}</div>
                  <p className="text-slate-600">{plan.description}</p>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-slate-600 mb-4">
              Vous avez besoin d'une solution sur mesure ?
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <Calendar className="w-5 h-5" />
              Planifier une démonstration
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
              Support & Accompagnement
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Notre équipe d'experts est là pour vous accompagner à chaque étape
              de votre parcours agile.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {supportOptions.map((option, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group"
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${option.color} rounded-xl mb-4 text-white group-hover:scale-110 transition-transform`}
                >
                  {option.icon}
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {option.title}
                </h3>

                <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                  {option.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Disponibilité:</span>
                    <span className="font-medium text-slate-900">
                      {option.availability}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Temps de réponse:</span>
                    <span className="font-medium text-green-600">
                      {option.responseTime}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Prêt à transformer votre gestion de projet ?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Commencez dès aujourd'hui avec notre essai gratuit de 14 jours.
              Aucune carte de crédit requise.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group min-w-[200px]"
              >
                <Rocket className="w-5 h-5" />
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="inline-flex items-center gap-3 bg-transparent text-white px-8 py-4 rounded-xl font-semibold border-2 border-white hover:bg-white hover:text-blue-600 transition-all duration-300 group min-w-[200px]"
              >
                <MessageCircle className="w-5 h-5" />
                Parler à un expert
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
