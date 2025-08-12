// components/ui/DeleteConfirmation.tsx

/**
 * RÔLE : Composant de confirmation de suppression réutilisable
 * RESPONSABILITÉS :
 * - Affichage d'une modal de confirmation pour les actions destructives
 * - Gestion des états de chargement pendant la suppression
 * - Interface utilisateur accessible et responsive
 * - Support des actions personnalisées avec feedback visuel
 * - Prévention des suppressions accidentelles avec validation
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Dialog, Button, Alert, Badge, Separator
 * - lucide-react: Icons pour améliorer l'UX (Trash2, AlertTriangle, X, Loader2)
 * - React Hooks: useState, useEffect pour gestion d'état
 * - TypeScript strict mode avec interfaces complètes
 * - Design responsive et moderne
 *
 * UTILISATION :
 * - Suppression de termes du glossaire
 * - Suppression d'éléments de projet
 * - Toute action destructive nécessitant confirmation
 */

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  AlertTriangle,
  X,
  Loader2,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";

// Interface pour les props du composant
interface DeleteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  itemName?: string;
  itemType?: string;
  requireConfirmation?: boolean;
  confirmationText?: string;
  isLoading?: boolean;
  destructiveLevel?: "low" | "medium" | "high" | "critical";
  additionalInfo?: string[];
  showItemDetails?: boolean;
  itemDetails?: {
    id?: string;
    createdAt?: Date;
    lastModified?: Date;
    relatedItems?: number;
  };
}

// Configuration des niveaux de risque
const RISK_LEVELS = {
  low: {
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: Info,
    buttonVariant: "destructive" as const,
    description: "Action réversible",
  },
  medium: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: AlertTriangle,
    buttonVariant: "destructive" as const,
    description: "Action partiellement réversible",
  },
  high: {
    color: "bg-orange-100 text-orange-800 border-orange-300",
    icon: AlertCircle,
    buttonVariant: "destructive" as const,
    description: "Action difficilement réversible",
  },
  critical: {
    color: "bg-red-100 text-red-800 border-red-300",
    icon: Shield,
    buttonVariant: "destructive" as const,
    description: "Action irréversible",
  },
} as const;

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  message,
  itemName,
  itemType = "élément",
  requireConfirmation = false,
  confirmationText,
  isLoading = false,
  destructiveLevel = "medium",
  additionalInfo = [],
  showItemDetails = false,
  itemDetails,
}) => {
  // États locaux
  const [confirmationInput, setConfirmationInput] = useState<string>("");
  const [canConfirm, setCanConfirm] = useState<boolean>(!requireConfirmation);
  const [countdown, setCountdown] = useState<number>(0);

  // Configuration du niveau de risque
  const riskConfig = RISK_LEVELS[destructiveLevel];
  const RiskIcon = riskConfig.icon;

  // Texte de confirmation requis
  const expectedConfirmation = confirmationText || itemName || "SUPPRIMER";

  // Effet pour la validation de confirmation
  useEffect(() => {
    if (requireConfirmation) {
      const isValid =
        confirmationInput.trim().toLowerCase() ===
        expectedConfirmation.toLowerCase();
      setCanConfirm(isValid);
    } else {
      setCanConfirm(true);
    }
  }, [confirmationInput, expectedConfirmation, requireConfirmation]);

  // Effet pour le countdown de sécurité (niveau critique)
  useEffect(() => {
    if (open && destructiveLevel === "critical") {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [open, destructiveLevel]);

  // Reset des états lors de l'ouverture/fermeture
  useEffect(() => {
    if (open) {
      setConfirmationInput("");
      setCountdown(destructiveLevel === "critical" ? 5 : 0);
    }
  }, [open, destructiveLevel]);

  // Gestion de la confirmation
  const handleConfirm = async (): Promise<void> => {
    if (
      !canConfirm ||
      isLoading ||
      (destructiveLevel === "critical" && countdown > 0)
    ) {
      return;
    }

    try {
      await onConfirm();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  // Gestion de l'annulation
  const handleCancel = (): void => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  // Gestion des touches clavier
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && canConfirm && countdown === 0) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape" && !isLoading) {
      e.preventDefault();
      handleCancel();
    }
  };

  // Calcul de la disponibilité du bouton de suppression
  const isConfirmDisabled =
    isLoading ||
    !canConfirm ||
    (destructiveLevel === "critical" && countdown > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg" onKeyDown={handleKeyDown}>
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div
              className={`p-2 rounded-lg ${riskConfig.color
                .replace("text-", "bg-")
                .replace("800", "200")}`}
            >
              <RiskIcon className="h-5 w-5 text-current" />
            </div>
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Badge de niveau de risque */}
          <div className="flex justify-center sm:justify-start">
            <Badge className={riskConfig.color}>
              <RiskIcon className="h-3 w-3 mr-1" />
              {riskConfig.description}
            </Badge>
          </div>

          {/* Détails de l'élément si fournis */}
          {showItemDetails && itemDetails && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2 text-sm">
                  {itemDetails.id && (
                    <div className="flex justify-between">
                      <span className="font-medium">ID:</span>
                      <span className="font-mono text-xs">
                        {itemDetails.id}
                      </span>
                    </div>
                  )}
                  {itemDetails.createdAt && (
                    <div className="flex justify-between">
                      <span className="font-medium">Créé le:</span>
                      <span>
                        {itemDetails.createdAt.toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  )}
                  {itemDetails.lastModified && (
                    <div className="flex justify-between">
                      <span className="font-medium">Modifié le:</span>
                      <span>
                        {itemDetails.lastModified.toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  )}
                  {itemDetails.relatedItems && itemDetails.relatedItems > 0 && (
                    <div className="flex justify-between">
                      <span className="font-medium">Éléments liés:</span>
                      <Badge variant="secondary">
                        {itemDetails.relatedItems}
                      </Badge>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Informations additionnelles */}
          {additionalInfo.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Conséquences de cette action :</p>
                  <ul className="text-sm space-y-1 ml-4">
                    {additionalInfo.map((info, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                        <span>{info}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Champ de confirmation si requis */}
          {requireConfirmation && (
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="confirmation" className="text-sm font-medium">
                  Pour confirmer, tapez{" "}
                  <span className="font-mono font-bold">
                    "{expectedConfirmation}"
                  </span>
                </Label>
                <Input
                  id="confirmation"
                  placeholder={`Tapez "${expectedConfirmation}" pour confirmer`}
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  className={`transition-colors ${
                    confirmationInput && !canConfirm
                      ? "border-red-500 focus:ring-red-500"
                      : canConfirm && confirmationInput
                      ? "border-green-500 focus:ring-green-500"
                      : ""
                  }`}
                  disabled={isLoading}
                  autoComplete="off"
                  autoFocus
                />
                {confirmationInput && (
                  <div className="flex items-center gap-2 text-xs">
                    {canConfirm ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">
                          Confirmation valide
                        </span>
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">
                          Confirmation incorrecte
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Countdown pour niveau critique */}
          {destructiveLevel === "critical" && countdown > 0 && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-sm">Sécurité activée - Patientez...</span>
                <Badge variant="outline" className="font-mono">
                  {countdown}s
                </Badge>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            {isLoading ? "Annulation..." : "Annuler"}
          </Button>

          <Button
            variant={riskConfig.buttonVariant}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="w-full sm:w-auto order-1 sm:order-2 transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : countdown > 0 ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Attendre ({countdown}s)
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer {itemType}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmation;
