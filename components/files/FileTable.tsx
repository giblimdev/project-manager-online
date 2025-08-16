// app/files/components/FileTable.tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { File } from "@/lib/generated/prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PencilIcon, TrashIcon } from "lucide-react";

export function FileTable({ files, loading, onAction }: { 
  files: any[];
  loading: boolean;
  onAction: (action: string, file?: any) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No files found for this project</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <TableRow key={file.id}>
            <TableCell className="font-medium">{file.name}</TableCell>
            <TableCell>{file.type}</TableCell>
            <TableCell>{file.description || "-"}</TableCell>
            <TableCell>
              {new Date(file.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="flex space-x-2">
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}