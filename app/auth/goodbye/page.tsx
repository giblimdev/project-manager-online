// app/auth/goodbye/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  CheckCircle, 
  Home, 
  ArrowLeft,
  Sparkles,
  Shield,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function GoodbyePage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // ✅ Gérer la redirection de manière sûre
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/');
    }
  }, [shouldRedirect, router]);

  useEffect(() => {
    // Animation d'entrée
    setIsAnimating(true);
    
    // Compte à rebours automatique
    const timer = setInterval(() => {
      setCountdown((prev) => {
        const newValue = prev - 1;
        
        if (newValue <= 0) {
          clearInterval(timer);
          // ✅ Utiliser un état au lieu d'appeler router.push directement
          setShouldRedirect(true);
          return 0;
        }
        
        return newValue;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []); // ✅ Supprimer router de la dépendance

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Éléments décoratifs animés */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-full animate-pulse" />
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-emerald-200/30 to-teal-200/30 rounded-full animate-bounce" />
        <div className="absolute bottom-32 left-1/4 w-16 h-16 bg-gradient-to-r from-violet-200/30 to-purple-200/30 rounded-full animate-ping" />
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-gradient-to-r from-amber-200/30 to-orange-200/30 rounded-full animate-pulse" />
      </div>

      <Card className={`
        w-full max-w-md relative z-10 border-0 shadow-2xl bg-white/80 backdrop-blur-lg
        transition-all duration-1000 ease-out
        ${isAnimating ? 'animate-in slide-in-from-bottom-8 fade-in' : 'opacity-0 translate-y-8'}
      `}>
        <CardContent className="p-8 text-center space-y-6">
          {/* Icône principale avec animation */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full animate-pulse" />
            <div className="relative z-10 w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="h-10 w-10 text-white animate-bounce" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-amber-400 animate-spin" />
          </div>

          {/* Titre avec gradient */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              À bientôt ! 👋
            </h1>
            <p className="text-slate-600 text-lg font-medium">
              Vous avez été déconnecté avec succès
            </p>
          </div>

          {/* Message de statut avec icônes */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50/80 rounded-lg py-3 px-4 border border-emerald-200/50">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Session terminée en toute sécurité</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50/80 rounded-lg py-3 px-4 border border-blue-200/50">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {countdown > 0 ? `Redirection automatique dans ${countdown}s` : "Redirection..."}
              </span>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Home className="h-4 w-4 mr-2" />
                Accueil
              </Button>
            </Link>

            <Button
              onClick={handleGoBack}
              variant="outline"
              className="flex-1 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 transform hover:scale-105"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>

          {/* Message d'encouragement */}
          <div className="pt-4 border-t border-slate-200/50">
            <p className="text-slate-500 text-sm leading-relaxed">
              Merci d'avoir utilisé notre plateforme ! 
              <br />
              <span className="text-indigo-600 font-medium">Votre travail a été sauvegardé automatiquement.</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Particules flottantes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-indigo-300 to-blue-300 rounded-full opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}
