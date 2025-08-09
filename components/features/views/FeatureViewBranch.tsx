//@/component/features/views/FetureViewBranch

import { Button } from "@/components/ui/button";
import {
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface FeatureViewBranchProps {
  files: File[];
  onEdit: (file: File) => void;
  onDelete: (id: string) => void;
}

export default function FeatureViewBranch({
  files,
  onEdit,
  onDelete,
}: FeatureViewBranchProps) {
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleMove = (id: string, direction: "up" | "down") => {
    console.log(`Move ${id} ${direction}`);
  };

  // Group files by parent folder
  const folderStructure = files.reduce((acc, file) => {
    const folderId = file.parentId || "root";
    if (!acc[folderId]) {
      acc[folderId] = [];
    }
    acc[folderId].push(file);
    return acc;
  }, {} as Record<string, File[]>);

  const renderFiles = (folderId: string, level = 0) => {
    const filesInFolder = folderStructure[folderId] || [];
    const isExpanded = expandedFolders[folderId] ?? true;

    return (
      <div className="space-y-1">
        {filesInFolder.map((file) => (
          <div key={file.id} className="pl-4">
            {file.isFolder ? (
              <div>
                <div
                  className="flex items-center py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleFolder(file.id)}
                  style={{ paddingLeft: `${level * 16}px` }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  <span className="font-medium">{file.name}</span>
                </div>
                {isExpanded && renderFiles(file.id, level + 1)}
              </div>
            ) : (
              <div
                className="flex items-center justify-between py-2 hover:bg-gray-50"
                style={{ paddingLeft: `${level * 16 + 20}px` }}
              >
                <div>
                  <span>{file.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {format(new Date(file.createdAt), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(file.id, "up");
                    }}
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(file.id, "down");
                    }}
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(file);
                    }}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(file.id);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return <div className="border rounded-lg p-4">{renderFiles("root")}</div>;
}
