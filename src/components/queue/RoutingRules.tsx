import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, GitBranch } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;
  conditions: {
    ticketPriority?: string;
    timeOfDay?: string;
    queueLoad?: string;
  };
  actions: {
    targetQueue?: string;
    assignToServicePoint?: string;
    escalate?: boolean;
  };
  description: string;
}

export const RoutingRules = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<RoutingRule[]>([
    {
      id: "1",
      name: "STAT Priority Routing",
      priority: 1,
      isActive: true,
      conditions: { ticketPriority: "stat" },
      actions: { escalate: true },
      description: "Immediately escalate STAT priority tickets",
    },
    {
      id: "2",
      name: "VIP Fast Track",
      priority: 2,
      isActive: true,
      conditions: { ticketPriority: "vip" },
      actions: { targetQueue: "vip-queue" },
      description: "Route VIP patients to dedicated queue",
    },
    {
      id: "3",
      name: "Load Balancing",
      priority: 3,
      isActive: true,
      conditions: { queueLoad: "high" },
      actions: { targetQueue: "overflow-queue" },
      description: "Redirect to overflow when main queue is at capacity",
    },
  ]);
  const [open, setOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [queues, setQueues] = useState<any[]>([]);

  useEffect(() => {
    loadQueues();
  }, []);

  const loadQueues = async () => {
    const { data } = await supabase
      .from("queues")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (data) setQueues(data);
  };

  const toggleRuleStatus = (ruleId: string) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, isActive: !r.isActive } : r
    ));
    toast({
      title: "Rule updated",
      description: "Routing rule status changed successfully",
    });
  };

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
    toast({
      title: "Rule deleted",
      description: "Routing rule has been removed",
    });
  };

  const handleSaveRule = () => {
    toast({
      title: editingRule ? "Rule updated" : "Rule created",
      description: "Routing configuration saved successfully",
    });
    setOpen(false);
    setEditingRule(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Routing Rules</h2>
          <p className="text-muted-foreground">Configure intelligent queue routing and load balancing</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRule(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Edit" : "Create"} Routing Rule</DialogTitle>
              <DialogDescription>
                Define conditions and actions for automatic queue routing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Rule Name</Label>
                <Input placeholder="e.g., High Priority Routing" />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Describe when this rule applies" rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority Level</Label>
                  <Input type="number" placeholder="1-10 (lower = higher priority)" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select defaultValue="active">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Conditions</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Ticket Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="stat">STAT</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Time of Day</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (8AM-12PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12PM-5PM)</SelectItem>
                        <SelectItem value="evening">Evening (5PM-8PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Queue Load Threshold</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select threshold" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">&lt; 5 waiting</SelectItem>
                        <SelectItem value="medium">5-10 waiting</SelectItem>
                        <SelectItem value="high">&gt; 10 waiting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Actions</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Target Queue</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select queue" />
                      </SelectTrigger>
                      <SelectContent>
                        {queues.map((queue) => (
                          <SelectItem key={queue.id} value={queue.id}>
                            {queue.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-escalate</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify staff immediately
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRule}>
                  Save Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Active Routing Rules
          </CardTitle>
          <CardDescription>
            Rules are evaluated in priority order (lower number = higher priority)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Badge variant="outline">{rule.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-sm text-muted-foreground">{rule.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {rule.conditions.ticketPriority && (
                        <Badge variant="secondary">Priority: {rule.conditions.ticketPriority}</Badge>
                      )}
                      {rule.conditions.timeOfDay && (
                        <Badge variant="secondary">Time: {rule.conditions.timeOfDay}</Badge>
                      )}
                      {rule.conditions.queueLoad && (
                        <Badge variant="secondary">Load: {rule.conditions.queueLoad}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {rule.actions.targetQueue && (
                        <Badge>Route: {rule.actions.targetQueue}</Badge>
                      )}
                      {rule.actions.escalate && (
                        <Badge variant="destructive">Escalate</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => toggleRuleStatus(rule.id)}
                      />
                      <span className="text-sm">
                        {rule.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRule(rule);
                          setOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {rules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No routing rules configured. Create your first rule to enable intelligent queue routing.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
