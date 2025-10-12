import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, GitBranch, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BusinessRule {
  id: string;
  name: string;
  code: string;
  description?: string;
  rule_type: string;
  category?: string;
  is_active: boolean;
  priority: number;
  conditions: any[];
  actions: any[];
}

export const RulesEngine = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    rule_type: "automation",
    category: "billing",
    is_active: true,
    priority: 0,
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("business_rules")
      .select("*")
      .order("priority");

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading rules",
        description: error.message,
      });
    } else if (data) {
      setRules(data.map(rule => ({
        ...rule,
        conditions: Array.isArray(rule.conditions) ? rule.conditions : [],
        actions: Array.isArray(rule.actions) ? rule.actions : [],
      })));
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const ruleData = {
        ...formData,
        conditions: [],
        actions: [],
      };

      if (editingRule) {
        const { error } = await supabase
          .from("business_rules")
          .update(ruleData)
          .eq("id", editingRule.id);

        if (error) throw error;

        toast({
          title: "Rule updated",
          description: "Business rule has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("business_rules")
          .insert([ruleData]);

        if (error) throw error;

        toast({
          title: "Rule created",
          description: "New business rule has been added",
        });
      }

      setOpen(false);
      setEditingRule(null);
      setFormData({
        name: "",
        code: "",
        description: "",
        rule_type: "automation",
        category: "billing",
        is_active: true,
        priority: 0,
      });
      loadRules();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleEdit = (rule: BusinessRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      code: rule.code,
      description: rule.description || "",
      rule_type: rule.rule_type,
      category: rule.category || "billing",
      is_active: rule.is_active,
      priority: rule.priority,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      const { error } = await supabase
        .from("business_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Rule deleted",
        description: "Business rule has been removed",
      });
      loadRules();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("business_rules")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: "Rule status has been changed",
      });
      loadRules();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const getRuleTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      discount: "bg-green-500",
      exemption: "bg-blue-500",
      automation: "bg-purple-500",
      validation: "bg-orange-500",
    };
    return colors[type] || "bg-gray-500";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Business Rules Engine
              </CardTitle>
              <CardDescription>
                Define automated business rules and workflows
              </CardDescription>
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
                  <DialogTitle>
                    {editingRule ? "Edit" : "Create"} Business Rule
                  </DialogTitle>
                  <DialogDescription>
                    Configure rule conditions and actions
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Rule Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Auto-apply Senior Discount"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="code">Code *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g., SENIOR_DISCOUNT"
                        required
                        disabled={!!editingRule}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what this rule does"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="type">Rule Type *</Label>
                      <Select
                        value={formData.rule_type}
                        onValueChange={(value) => setFormData({ ...formData, rule_type: value })}
                      >
                        <SelectTrigger id="type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="automation">Automation</SelectItem>
                          <SelectItem value="validation">Validation</SelectItem>
                          <SelectItem value="discount">Discount</SelectItem>
                          <SelectItem value="exemption">Exemption</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger id="category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="clinical">Clinical</SelectItem>
                          <SelectItem value="administrative">Administrative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Input
                        id="priority"
                        type="number"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="active">Active</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable this business rule
                        </p>
                      </div>
                      <Switch
                        id="active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingRule ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading rules...</div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No business rules configured
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
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
                      <Badge className={getRuleTypeColor(rule.rule_type)}>
                        {rule.rule_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{rule.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => toggleActive(rule.id, rule.is_active)}
                        />
                        <span className="text-sm">
                          {rule.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
