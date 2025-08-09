//@/components/features/FeaturesFilter

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface FeatureFilterProps {
  onFilter: (filters: {
    name?: string;
    type?: FileType;
    startDate?: Date;
    endDate?: Date;
  }) => void;
}

export default function FeatureFilter({ onFilter }: FeatureFilterProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<FileType | "all">("all");
  const [dateRange, setDateRange] = useState<{
    start?: Date;
    end?: Date;
  }>({});

  const handleApply = () => {
    onFilter({
      name: name || undefined,
      type: type !== "all" ? type : undefined,
      startDate: dateRange.start,
      endDate: dateRange.end,
    });
  };

  const handleReset = () => {
    setName("");
    setType("all");
    setDateRange({});
    onFilter({});
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg">
      <Input
        placeholder="Filter by name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full sm:w-64"
      />

      <Select
        value={type}
        onValueChange={(v) => setType(v as FileType | "all")}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="File type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="DOCUMENT">Document</SelectItem>
          <SelectItem value="IMAGE">Image</SelectItem>
          <SelectItem value="VIDEO">Video</SelectItem>
          <SelectItem value="ARCHIVE">Archive</SelectItem>
          <SelectItem value="CODE">Code</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-64 justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.start ? (
              dateRange.end ? (
                <>
                  {format(dateRange.start, "MMM dd, yyyy")} -{" "}
                  {format(dateRange.end, "MMM dd, yyyy")}
                </>
              ) : (
                format(dateRange.start, "MMM dd, yyyy")
              )
            ) : (
              <span>Date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{
              from: dateRange.start,
              to: dateRange.end,
            }}
            onSelect={(range) => {
              setDateRange({
                start: range?.from,
                end: range?.to,
              });
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      <div className="flex gap-2">
        <Button onClick={handleApply}>
          <Filter className="mr-2 h-4 w-4" />
          Apply
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <X className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}
