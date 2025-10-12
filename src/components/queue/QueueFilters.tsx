import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface QueueFiltersProps {
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  showOnlySLABreaches: boolean;
  setShowOnlySLABreaches: (value: boolean) => void;
}

export const QueueFilters = ({
  priorityFilter,
  setPriorityFilter,
  showOnlySLABreaches,
  setShowOnlySLABreaches,
}: QueueFiltersProps) => {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="priority-filter">Priority:</Label>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger id="priority-filter" className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="routine">Routine</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="stat">STAT</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="sla-breaches"
          checked={showOnlySLABreaches}
          onCheckedChange={setShowOnlySLABreaches}
        />
        <Label htmlFor="sla-breaches">Show only SLA breaches</Label>
      </div>
    </div>
  );
};
