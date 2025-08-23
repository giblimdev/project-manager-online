/**
 * delete-sprint-dialog.tsx
 * 
 * Rôle :
 *   - Dialog de confirmation pour suppression d’un sprint
 * Responsabilités :
 *   - Affiche un avertissement
 *   - Provoque la suppression sur confirmation
 *   - Responsive & moderne (shadcn/ui)
 *   - Utilisation icône Lucide
 */

'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Sprint {
  id: string;
  name: string;
  order: number;
  goal: string | null;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
  capacity: number | null;
  velocity: number | null;
  burndownData: Record<string, unknown> | null;
  retrospective: Record<string, unknown> | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeleteSprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint: Sprint | null;
  onConfirm: () => Promise<void> | void;
}

export const DeleteSprintDialog: React.FC<DeleteSprintDialogProps> = ({
  open,
  onOpenChange,
  sprint,
  onConfirm,
}) => {
  if (!sprint) return null;

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Supprimer le sprint&nbsp;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Voulez-vous vraiment supprimer : <strong>{sprint.name}</strong> ?<br/>
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 py-2">
          <Alert variant="destructive">
            <AlertDescription>
              Cette opération supprimera ce sprint et toutes ses données associées. 
              <ul className="list-disc ml-4 mt-1 space-y-1 text-red-700 text-sm">
                <li>Éléments liés, métriques et historique seront perdus</li>
                <li><b>Action définitive</b></li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={handleConfirm}
          >
            Supprimer définitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
