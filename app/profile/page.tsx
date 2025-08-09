// app/profile/page.tsx

/**
 * RÔLE : Page de profil utilisateur responsive avec un bouton pour passer en mode edition mode édition
 * Le formulaire sera un composant @/components/user/profile.tsx
 * RESPONSABILITÉS :
 * - Affiche les informations de l'utilisateur connecté via Better Auth useSession
 * - Propose un mode édition pour modifier les informations du profil utilisateur
 * - Gestion des états de chargement et d'authentification
 * - Interface responsive et moderne avec design shadcn/ui
 * - Validation des formulaires et gestion des erreurs
 * - Sauvegarde des modifications via API route (à implémenter côté serveur)
 *
 * COMPOSANTS UTILISÉS :
 * - useSession de Better Auth (@/lib/auth/auth-client) pour l'authentification
 * - Card, Button, Input, Label, Avatar de shadcn/ui pour l'interface
 * - React hooks (useState, useEffect, useCallback) pour la gestion d'état
 * - Next.js 15 useRouter pour la navigation
 * - Sonner pour les notifications toast
 * - Lucide React pour les icônes
 *
 * LIBS UTILISÉS :
 * - React 18 avec hooks et TypeScript strict mode
 * - Next.js 15 app router avec client component
 * - Better Auth pour l'authentification et la session
 * - shadcn/ui pour les composants UI modernes
 * - Tailwind CSS pour le styling responsive
 * - Sonner pour les notifications
 * - Lucide React pour les icônes
 *
 * API :
 * - GET session via useSession de Better Auth
 * - PUT /api/user/profile (à implémenter) pour la mise à jour du profil
 */

"use client";

import React, { useState, useEffect, useCallback, FormEvent, JSX } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Edit,
  Save,
  X,
  User,
  Mail,
  Calendar,
  Clock,
  Settings,
  ArrowLeft,
  Camera,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// Types basés sur le schéma Prisma User
interface UserProfile {
  id: string;
  name?: string | null;
  email: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  image?: string | null;
  timezone?: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

interface FormData {
  name: string;
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
  image: string;
  timezone: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export default function ProfilePage(): JSX.Element {
  const router = useRouter();

  // Authentification Better Auth avec gestion d'erreur
  const {
    data: session,
    isPending: isAuthLoading,
    error: authError,
  } = useSession();

  // États locaux
  const [editMode, setEditMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    username: "",
    firstName: "",
    lastName: "",
    bio: "",
    image: "",
    timezone: "UTC",
  });

  // Données utilisateur depuis la session
  const user = session?.user as UserProfile | undefined;

  /**
   * Initialisation des données du formulaire depuis la session
   */
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
        image: user.image || "",
        timezone: user.timezone || "UTC",
      });
    }
  }, [user]);

  /**
   * Gestion des changements de champs du formulaire
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  /**
   * Activation du mode édition
   */
  const handleEditMode = useCallback((): void => {
    setEditMode(true);
  }, []);

  /**
   * Annulation des modifications
   */
  const handleCancel = useCallback((): void => {
    if (user) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
        image: user.image || "",
        timezone: user.timezone || "UTC",
      });
    }
    setEditMode(false);
  }, [user]);

  /**
   * Sauvegarde des modifications du profil
   */
  const handleSave = useCallback(
    async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();

      if (!user) {
        toast.error("Utilisateur non trouvé");
        return;
      }

      setIsSubmitting(true);

      try {
        console.log("🔄 Mise à jour du profil utilisateur:", formData);

        // TODO: Implémenter l'appel API réel pour mettre à jour le profil
        const response = await fetch("/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            ...formData,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result: ApiResponse<UserProfile> = await response.json();

        if (!result.success) {
          throw new Error(
            result.error || result.message || "Échec de la mise à jour"
          );
        }

        console.log("✅ Profil mis à jour avec succès");
        toast.success("Profil mis à jour avec succès");
        setEditMode(false);
      } catch (error) {
        console.error("💥 Erreur mise à jour profil:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        toast.error(`Erreur: ${errorMessage}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, formData]
  );

  /**
   * Formatage des dates
   */
  const formatDate = useCallback((date: Date | string | null): string => {
    if (!date) return "Non renseigné";

    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj);
    } catch {
      return "Date invalide";
    }
  }, []);

  /**
   * Génération des initiales pour l'avatar
   */
  const getInitials = useCallback((name?: string | null): string => {
    if (!name) return "U";

    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return words
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  }, []);

  // Affichage pendant le chargement de l'authentification
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gestion d'erreur d'authentification
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Erreur d'authentification
              </h3>
              <p className="text-gray-600 mt-2">
                {authError.message || "Une erreur s'est produite"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Actualiser
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/auth/signin")}
              >
                Se reconnecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirection si non authentifié
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <User className="h-12 w-12 mx-auto text-gray-400" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Connexion requise
              </h3>
              <p className="text-gray-600 mt-2">
                Vous devez être connecté pour accéder à votre profil
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => router.push("/auth/signin")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <User className="h-4 w-4 mr-2" />
                Se connecter
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* En-tête avec navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
              <p className="text-gray-600">
                Gérez vos informations personnelles
              </p>
            </div>
          </div>

          {!editMode && (
            <Button
              onClick={handleEditMode}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier le profil
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Carte d'informations de base */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="relative mx-auto">
                  <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage
                      src={formData.image || user.image || ""}
                      alt={formData.name || user.name || "Avatar"}
                    />
                    <AvatarFallback className="text-xl">
                      {getInitials(formData.name || user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {editMode && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                      title="Changer la photo"
                    >
                      <Camera className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <CardTitle className="mt-4">
                  {formData.name || user.name || "Utilisateur"}
                </CardTitle>
                <CardDescription>
                  {formData.username || user.username || user.email}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Statut de vérification */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email vérifié</span>
                  <div className="flex items-center space-x-1">
                    {user.emailVerified ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Vérifié</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-orange-600">
                          Non vérifié
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Statut du compte */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Statut du compte
                  </span>
                  <div className="flex items-center space-x-1">
                    {user.isActive ? (
                      <>
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">Actif</span>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-red-600">Inactif</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Informations temporelles */}
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Membre depuis le {formatDate(user.createdAt)}</span>
                  </div>

                  {user.lastLoginAt && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        Dernière connexion: {formatDate(user.lastLoginAt)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulaire de profil */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>
                    {editMode
                      ? "Modifier les informations"
                      : "Informations personnelles"}
                  </span>
                </CardTitle>
                <CardDescription>
                  {editMode
                    ? "Modifiez vos informations personnelles ci-dessous"
                    : "Vos informations personnelles et préférences"}
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSave}>
                <CardContent className="space-y-6">
                  {/* Informations de base */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      {editMode ? (
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          placeholder="Votre prénom"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                        />
                      ) : (
                        <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center">
                          <span className="text-gray-700">
                            {formData.firstName || "Non renseigné"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      {editMode ? (
                        <Input
                          id="lastName"
                          name="lastName"
                          type="text"
                          placeholder="Votre nom"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                        />
                      ) : (
                        <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center">
                          <span className="text-gray-700">
                            {formData.lastName || "Non renseigné"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    {editMode ? (
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Votre nom complet"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                    ) : (
                      <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center">
                        <span className="text-gray-700">
                          {formData.name || "Non renseigné"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    {editMode ? (
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Votre nom d'utilisateur"
                        value={formData.username}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                    ) : (
                      <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center">
                        <span className="text-gray-700">
                          {formData.username || "Non renseigné"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Email (non modifiable) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-100 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">{user.email}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        (non modifiable)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    {editMode ? (
                      <Textarea
                        id="bio"
                        name="bio"
                        placeholder="Parlez-nous de vous..."
                        className="resize-none"
                        rows={4}
                        value={formData.bio}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                    ) : (
                      <div className="min-h-[100px] px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
                        <span className="text-gray-700">
                          {formData.bio || "Aucune bio renseignée"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">URL de l'avatar</Label>
                    {editMode ? (
                      <Input
                        id="image"
                        name="image"
                        type="url"
                        placeholder="https://example.com/avatar.jpg"
                        value={formData.image}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                    ) : (
                      <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center">
                        <span className="text-gray-700 truncate">
                          {formData.image || "Aucune image"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuseau horaire</Label>
                    {editMode ? (
                      <select
                        id="timezone"
                        name="timezone"
                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.timezone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            timezone: e.target.value,
                          }))
                        }
                        disabled={isSubmitting}
                      >
                        <option value="UTC">UTC</option>
                        <option value="Europe/Paris">Europe/Paris</option>
                        <option value="America/New_York">
                          America/New_York
                        </option>
                        <option value="America/Los_Angeles">
                          America/Los_Angeles
                        </option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                      </select>
                    ) : (
                      <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center">
                        <span className="text-gray-700">
                          {formData.timezone}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>

                {editMode && (
                  <CardFooter className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
