// app/about/page.tsx
// Page À propos de l'application AgileCore
// Utilise Next.js 15+, TypeScript strict, Shadcn icons et Framer Motion

"use client";

import React, { JSX } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Users,
  Zap,
  Award,
  Globe,
  Heart,
  TrendingUp,
  Shield,
  Lightbulb,
  Rocket,
  CheckCircle,
  Quote,
  Github,
  Linkedin,
  Mail,
  Calendar,
  MapPin,
  Star,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  bio: string;
  skills: string[];
  social: {
    linkedin?: string;
    github?: string;
    email?: string;
  };
}

interface Milestone {
  year: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Value {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Sarah Chen",
    role: "CEO & Co-founder",
    avatar: "/api/placeholder/120/120",
    bio: "Passionnée par l'innovation produit avec 10+ ans d'expérience en leadership tech.",
    skills: ["Strategy", "Product Management", "Leadership"],
    social: {
      linkedin: "#",
      email: "sarah@agilecore.com",
    },
  },
  {
    name: "Marc Dubois",
    role: "CTO & Co-founder",
    avatar: "/api/placeholder/120/120",
    bio: "Architecte logiciel expert en systèmes distribués et intelligence artificielle.",
    skills: ["Architecture", "AI/ML", "Scalability"],
    social: {
      linkedin: "#",
      github: "#",
      email: "marc@agilecore.com",
    },
  },
  {
    name: "Lisa Rodriguez",
    role: "Head of Design",
    avatar: "/api/placeholder/120/120",
    bio: "Designer UX/UI spécialisée dans les interfaces complexes et l'accessibilité.",
    skills: ["UX Design", "UI Systems", "Accessibility"],
    social: {
      linkedin: "#",
      email: "lisa@agilecore.com",
    },
  },
  {
    name: "Tom Wilson",
    role: "Lead Engineer",
    avatar: "/api/placeholder/120/120",
    bio: "Développeur full-stack passionné par les technologies modernes et la performance.",
    skills: ["React", "Node.js", "Performance"],
    social: {
      linkedin: "#",
      github: "#",
      email: "tom@agilecore.com",
    },
  },
];

const milestones: Milestone[] = [
  {
    year: "2022",
    title: "Création d'AgileCore",
    description:
      "Lancement de la startup avec une vision claire : révolutionner la gestion de projet agile.",
    icon: <Rocket className="w-6 h-6" />,
  },
  {
    year: "2023",
    title: "Premiers clients",
    description:
      "Conquête de 50+ entreprises innovantes et validation du product-market fit.",
    icon: <Users className="w-6 h-6" />,
  },
  {
    year: "2024",
    title: "Expansion internationale",
    description: "Ouverture vers l'Europe et l'Asie avec 500+ équipes actives.",
    icon: <Globe className="w-6 h-6" />,
  },
  {
    year: "2025",
    title: "IA Native",
    description:
      "Intégration complète de l'intelligence artificielle dans tous nos workflows.",
    icon: <Zap className="w-6 h-6" />,
  },
];

const values: Value[] = [
  {
    title: "Innovation",
    description:
      "Nous repoussons constamment les limites pour créer des solutions révolutionnaires.",
    icon: <Lightbulb className="w-8 h-8" />,
    color: "from-yellow-400 to-orange-500",
  },
  {
    title: "Collaboration",
    description:
      "L'intelligence collective est au cœur de notre approche et de nos produits.",
    icon: <Users className="w-8 h-8" />,
    color: "from-blue-400 to-blue-600",
  },
  {
    title: "Excellence",
    description:
      "Nous visons l'excellence dans chaque détail, de l'UX à la performance technique.",
    icon: <Award className="w-8 h-8" />,
    color: "from-purple-400 to-purple-600",
  },
  {
    title: "Transparence",
    description:
      "Nous croyons en la transparence totale avec nos utilisateurs et partenaires.",
    icon: <Shield className="w-8 h-8" />,
    color: "from-green-400 to-green-600",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function AboutPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 mb-8"
            >
              <Heart className="w-4 h-4 text-red-300" />
              <span className="text-sm font-medium">
                Construite avec passion par des experts agiles
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              À propos d'
              <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                AgileCore
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-blue-100 max-w-3xl mx-auto mb-10 leading-relaxed">
              Nous révolutionnons la gestion de projet agile en combinant{" "}
              <span className="font-semibold text-white">
                innovation technologique
              </span>{" "}
              et{" "}
              <span className="font-semibold text-white">
                expérience utilisateur exceptionnelle
              </span>
              .
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Target className="w-5 h-5" />
                Notre Mission
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 bg-transparent text-white px-8 py-4 rounded-xl font-semibold border-2 border-white hover:bg-white hover:text-blue-600 transition-all duration-300 group"
              >
                <Users className="w-5 h-5" />
                Rencontrer l'équipe
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
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
              Notre Mission
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Démocratiser l'excellence en gestion de projet agile pour
              permettre à chaque équipe d'atteindre son plein potentiel.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-20" />
                <Quote className="w-12 h-12 text-blue-600 mb-6" />
              </div>

              <blockquote className="text-2xl text-slate-700 leading-relaxed mb-6 italic">
                "Nous croyons que chaque équipe mérite des outils exceptionnels
                pour transformer ses idées en réalité. AgileCore n'est pas juste
                un outil, c'est un catalyseur d'innovation."
              </blockquote>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">SC</span>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Sarah Chen</div>
                  <div className="text-slate-600">CEO & Co-founder</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-6"
            >
              {[
                {
                  icon: <TrendingUp className="w-6 h-6" />,
                  value: "500+",
                  label: "Équipes utilisatrices",
                },
                {
                  icon: <Globe className="w-6 h-6" />,
                  value: "25",
                  label: "Pays couverts",
                },
                {
                  icon: <CheckCircle className="w-6 h-6" />,
                  value: "50k+",
                  label: "Projets livrés",
                },
                {
                  icon: <Star className="w-6 h-6" />,
                  value: "4.9",
                  label: "Note moyenne",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white mb-4">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
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
              Nos Valeurs
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Les principes qui guident notre vision et nos décisions au
              quotidien
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="group relative bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 text-center"
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${value.color} rounded-xl mb-6 text-white shadow-lg`}
                >
                  {value.icon}
                </div>

                <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {value.title}
                </h3>

                <p className="text-slate-600 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
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
              Notre Parcours
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              De l'idée initiale à la plateforme d'aujourd'hui, découvrez les
              étapes clés de notre évolution
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-full hidden lg:block" />

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center ${
                    index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div
                    className={`flex-1 ${
                      index % 2 === 0 ? "lg:pr-12" : "lg:pl-12"
                    }`}
                  >
                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white">
                          {milestone.icon}
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {milestone.year}
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold text-slate-900 mb-3">
                        {milestone.title}
                      </h3>

                      <p className="text-slate-600 leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>

                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-4 border-white shadow-lg hidden lg:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
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
              Notre Équipe
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Rencontrez les experts passionnés qui construisent l'avenir de la
              gestion de projet agile
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 text-center"
              >
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white" />
                </div>

                <h3 className="text-xl font-semibold text-slate-900 mb-1">
                  {member.name}
                </h3>

                <p className="text-blue-600 font-medium mb-4">{member.role}</p>

                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                  {member.bio}
                </p>

                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {member.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex justify-center gap-3">
                  {member.social.linkedin && (
                    <a
                      href={member.social.linkedin}
                      className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {member.social.github && (
                    <a
                      href={member.social.github}
                      className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-gray-900 transition-colors"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {member.social.email && (
                    <a
                      href={`mailto:${member.social.email}`}
                      className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
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
              Rejoignez l'aventure AgileCore
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Nous recherchons des talents passionnés pour continuer à
              révolutionner la gestion de projet
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Calendar className="w-5 h-5" />
                Postuler maintenant
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 bg-transparent text-white px-8 py-4 rounded-xl font-semibold border-2 border-white hover:bg-white hover:text-blue-600 transition-all duration-300 group"
              >
                <MapPin className="w-5 h-5" />
                Visiter nos bureaux
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
