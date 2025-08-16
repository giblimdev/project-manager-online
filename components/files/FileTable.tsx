// app/files/components/FileTable.tsx
"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";

export function FileTable({ files, loading, onAction }: { 
  files: any[];
  loading: boolean;
  onAction: (action: string, file?: any) => void;
}) {
  const [localFiles, setLocalFiles] = useState([...files]);
  const [isReordering, setIsReordering] = useState(false);

  // Correction: Utilisation de useEffect pour synchroniser les fichiers
  useEffect(() => {
    setLocalFiles([...files]);
  }, [files]);

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (index < 0 || index >= localFiles.length) return;
    
    const newFiles = [...localFiles];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= localFiles.length) return;
    
    // Échange des positions
    [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
    
    // Mise à jour de l'ordre
    newFiles.forEach((file, i) => {
      file.order = i + 1;
    });
    
    setLocalFiles(newFiles);
    setIsReordering(true);
  };

  const saveOrder = async () => {
    try {
      // Envoyer la nouvelle ordre au serveur
      await fetch('/api/files/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: localFiles.map(file => ({ id: file.id, order: file.order }))
        })
      });
      
      // Rafraîchir les données
      onAction('refresh');
      setIsReordering(false);
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (localFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No files found for this project</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isReordering && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            className="mr-2"
            onClick={() => {
              setLocalFiles([...files]);
              setIsReordering(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={saveOrder}>
            Save Order
          </Button>
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localFiles.map((file, index) => (
            <TableRow key={file.id}>
              <TableCell className="font-medium">{file.order}</TableCell>
              <TableCell className="font-medium">{file.name}</TableCell>
              <TableCell>{file.type}</TableCell>
              <TableCell>{file.description || "-"}</TableCell>
              <TableCell>
                {new Date(file.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="flex space-x-2">
                <div className="flex flex-col space-y-1">
                  <Button 
                    variant="outline" 
                    size="icon"
                    disabled={index === 0}
                    onClick={() => moveFile(index, 'up')}
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    disabled={index === localFiles.length - 1}
                    onClick={() => moveFile(index, 'down')}
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => onAction("edit", file)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => onAction("delete", file)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}