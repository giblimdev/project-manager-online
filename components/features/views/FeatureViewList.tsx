//@/components/features/views/FeatureViewList.tsx

import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface FeatureViewListProps {
  files: File[];
  onEdit: (file: File) => void;
  onDelete: (id: string) => void;
}

export default function FeatureViewList({
  files,
  onEdit,
  onDelete,
}: FeatureViewListProps) {
  const handleMove = (id: string, direction: "up" | "down") => {
    console.log(`Move ${id} ${direction}`);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Public</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <TableRow key={file.id}>
            <TableCell className="font-medium">{file.name}</TableCell>
            <TableCell>{file.type}</TableCell>
            <TableCell>
              {format(new Date(file.createdAt), "MMM dd, yyyy")}
            </TableCell>
            <TableCell>{file.size} KB</TableCell>
            <TableCell>{file.isPublic ? "Yes" : "No"}</TableCell>
            <TableCell className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMove(file.id, "up")}
                title="Move up"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMove(file.id, "down")}
                title="Move down"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(file)}
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(file.id)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
