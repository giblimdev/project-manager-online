// components/auth/SignupForm.tsx
"use client"; 

import React, { useState } from "react";
import { signUp } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  // Validation des mots de passe
  const passwordsMatch = password === confirmPassword;
  const passwordsNotEmpty = password.length > 0 && confirmPassword.length > 0;
  const showPasswordMatch = passwordsNotEmpty && passwordsMatch;
  const showPasswordMismatch = passwordsNotEmpty && !passwordsMatch;

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    if (!passwordsMatch) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
      });

      if (result.data) {
        toast.success("Compte créé avec succès ! Vérifiez votre email.");
        router.push("/welcome");
      } else {
        toast.error("Erreur lors de la création du compte");
      }
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      toast.error("Erreur lors de la création du compte");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = name && email && password && confirmPassword && passwordsMatch && password.length >= 8;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          Inscription
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Pseudo
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Entrez votre nom complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Entrez votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Mot de passe
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
                className={`pr-10 ${
                  password.length > 0 && password.length < 8 
                    ? "border-red-300 focus:border-red-500" 
                    : ""
                }`}
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {password.length > 0 && password.length < 8 && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Le mot de passe doit contenir au moins 8 caractères
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className={`pr-10 ${
                  showPasswordMismatch 
                    ? "border-red-300 focus:border-red-500" 
                    : showPasswordMatch 
                    ? "border-green-300 focus:border-green-500" 
                    : ""
                }`}
              />
              <button
                type="button"
                onClick={toggleShowConfirmPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            {/* Messages de validation */}
            {showPasswordMismatch && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Les mots de passe ne correspondent pas
              </p>
            )}
            {showPasswordMatch && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Les mots de passe correspondent
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? "Création en cours..." : "Créer un compte"}
          </Button>

          {/* Indicateur de force du mot de passe */}
          {password.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-600">Force du mot de passe :</p>
              <div className="flex space-x-1">
                <div className={`h-1 w-1/4 rounded ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`} />
                <div className={`h-1 w-1/4 rounded ${password.length >= 10 ? 'bg-green-500' : 'bg-gray-200'}`} />
                <div className={`h-1 w-1/4 rounded ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-200'}`} />
                <div className={`h-1 w-1/4 rounded ${/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-200'}`} />
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
