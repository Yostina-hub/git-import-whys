import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface DocumentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  documentType: string;
  onTypeChange: (value: string) => void;
}

export const DocumentFilters = ({
  searchQuery,
  onSearchChange,
  documentType,
  onTypeChange,
}: DocumentFiltersProps) => {
  return (
    <div className="flex gap-4 items-center">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={documentType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="lab_result">Lab Results</SelectItem>
          <SelectItem value="imaging">Imaging</SelectItem>
          <SelectItem value="consent">Consent Forms</SelectItem>
          <SelectItem value="referral">Referrals</SelectItem>
          <SelectItem value="prescription">Prescriptions</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
