// app/welcome/page.tsx
"use client";

import { useSession, signOut } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Mail, User, FileText, Loader2 } from "lucide-react";

export default function WelcomePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      // router.push("/login");
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // router.push("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const { user } = session;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Message de bienvenue */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.image || ""} alt={user.name} />
                <AvatarFallback className="text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Bienvenue, {user.name}!
            </h2>
            <p className="text-lg text-gray-600">
              Vous êtes maintenant connecté à votre Project Manager
            </p>
          </div>

          {/* Informations utilisateur */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Profil utilisateur */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    Membre depuis{" "}
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.emailVerified ? "default" : "secondary"}>
                    {user.emailVerified ? "Email vérifié" : "Email non vérifié"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Informations de session */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>ID:</strong> {session.session.id}
                  </p>
                  <p>
                    <strong>Dernière mise à jour:</strong>{" "}
                    {new Date(user.updatedAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/write" className="w-full">
                  <Button className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Écrire un article
                  </Button>
                </Link>
                <Link href="/my-posts" className="w-full">
                  <Button variant="outline" className="w-full">
                    Mes articles
                  </Button>
                </Link>
                <Link href="/profile" className="w-full">
                  <Button variant="outline" className="w-full">
                    Modifier le profil
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Message d'encouragement */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Prêt à commencer votre parcours de blogging?
                </h3>
                <p className="text-blue-700 mb-4">
                  Explorez toutes les fonctionnalités de votre CS50 Blog
                </p>
                <div className="flex justify-center gap-4">
                  <Link href="/write">
                    <Button>Créer un article</Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline">Voir le dashboard</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
