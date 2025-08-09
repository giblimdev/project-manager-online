import { File } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface FeatureViewCardProps {
  files: File[];
  onEdit: (file: File) => void;
  onDelete: (id: string) => void;
}

export default function FeatureViewCard({
  files,
  onEdit,
  onDelete,
}: FeatureViewCardProps) {
  const handleMove = (id: string, direction: "up" | "down") => {
    console.log(`Move ${id} ${direction}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file) => (
        <Card key={file.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{file.name}</CardTitle>
            <div className="text-sm text-gray-500">
              {file.type} • {format(new Date(file.createdAt), "MMM dd, yyyy")}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 line-clamp-2">
              {file.description || "No description"}
            </p>
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm">
                {file.size} KB • {file.isPublic ? "Public" : "Private"}
              </span>
              <div className="flex space-x-1">
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
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
