//@/components/features/FeaturesForm.tsx

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface FeatureFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onSuccess: (file: File) => void;
}

export default function FeatureForm({
  open,
  onOpenChange,
  file,
  onSuccess,
}: FeatureFormProps) {
  const [formData, setFormData] = useState<Partial<File>>({
    name: "",
    type: "DOCUMENT",
    description: "",
    isPublic: false,
  });

  useEffect(() => {
    if (file) {
      setFormData(file);
    } else {
      setFormData({
        name: "",
        type: "DOCUMENT",
        description: "",
        isPublic: false,
      });
    }
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = file ? `/api/files/${file.id}` : "/api/files";
      const method = file ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const result = await response.json();
      onSuccess(result);
      toast.success(file ? "File updated" : "File created");
    } catch (error) {
      toast.error("Failed to save file");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{file ? "Edit File" : "Create New File"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as FileType })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select file type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DOCUMENT">Document</SelectItem>
                <SelectItem value="IMAGE">Image</SelectItem>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="ARCHIVE">Archive</SelectItem>
                <SelectItem value="CODE">Code</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic || false}
              onChange={(e) =>
                setFormData({ ...formData, isPublic: e.target.checked })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="isPublic">Public</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{file ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
