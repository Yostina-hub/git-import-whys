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
import { Plus, Edit, Trash2, Percent, Shield } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface DiscountPolicy {
  id: string;
  name: string;
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  max_discount_amount?: number;
  min_purchase_amount: number;
  applicable_to: string;
  requires_approval: boolean;
  is_active: boolean;
  valid_from: string;
  valid_to?: string;
}

interface ExemptionPolicy {
  id: string;
  name: string;
  code: string;
  description?: string;
  exemption_type: string;
  exemption_percentage?: number;
  applies_to: string;
  requires_documentation: boolean;
  is_active: boolean;
  valid_from: string;
  valid_to?: string;
}

export const DiscountExemptionPolicies = () => {
  const { toast } = useToast();
  const [discounts, setDiscounts] = useState<DiscountPolicy[]>([]);
  const [exemptions, setExemptions] = useState<ExemptionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [exemptionOpen, setExemptionOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountPolicy | null>(null);
  const [editingExemption, setEditingExemption] = useState<ExemptionPolicy | null>(null);

  const [discountFormData, setDiscountFormData] = useState({
    name: "",
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 0,
    max_discount_amount: 0,
    min_purchase_amount: 0,
    applicable_to: "all",
    requires_approval: false,
    is_active: true,
    valid_from: new Date().toISOString().split("T")[0],
    valid_to: "",
  });

  const [exemptionFormData, setExemptionFormData] = useState({
    name: "",
    code: "",
    description: "",
    exemption_type: "full_waiver",
    exemption_percentage: 0,
    applies_to: "all_charges",
    requires_documentation: true,
    is_active: true,
    valid_from: new Date().toISOString().split("T")[0],
    valid_to: "",
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    
    const [discountsResult, exemptionsResult] = await Promise.all([
      supabase.from("discount_policies").select("*").order("created_at", { ascending: false }),
      supabase.from("exemption_policies").select("*").order("created_at", { ascending: false }),
    ]);

    if (discountsResult.error) {
      toast({
        variant: "destructive",
        title: "Error loading discounts",
        description: discountsResult.error.message,
      });
    } else if (discountsResult.data) {
      setDiscounts(discountsResult.data);
    }

    if (exemptionsResult.error) {
      toast({
        variant: "destructive",
        title: "Error loading exemptions",
        description: exemptionsResult.error.message,
      });
    } else if (exemptionsResult.data) {
      setExemptions(exemptionsResult.data);
    }

    setLoading(false);
  };

  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const policyData = {
        ...discountFormData,
        applicable_items: [],
        customer_eligibility: {},
      };

      if (editingDiscount) {
        const { error } = await supabase
          .from("discount_policies")
          .update(policyData)
          .eq("id", editingDiscount.id);

        if (error) throw error;

        toast({
          title: "Discount policy updated",
          description: "Changes have been saved successfully",
        });
      } else {
        const { error } = await supabase
          .from("discount_policies")
          .insert([policyData]);

        if (error) throw error;

        toast({
          title: "Discount policy created",
          description: "New discount policy has been added",
        });
      }

      setDiscountOpen(false);
      setEditingDiscount(null);
      loadPolicies();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleExemptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const policyData = {
        ...exemptionFormData,
        applicable_items: [],
        eligibility_criteria: {},
        required_documents: [],
        approval_workflow: {},
      };

      if (editingExemption) {
        const { error } = await supabase
          .from("exemption_policies")
          .update(policyData)
          .eq("id", editingExemption.id);

        if (error) throw error;

        toast({
          title: "Exemption policy updated",
          description: "Changes have been saved successfully",
        });
      } else {
        const { error } = await supabase
          .from("exemption_policies")
          .insert([policyData]);

        if (error) throw error;

        toast({
          title: "Exemption policy created",
          description: "New exemption policy has been added",
        });
      }

      setExemptionOpen(false);
      setEditingExemption(null);
      loadPolicies();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const deleteDiscount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount policy?")) return;

    try {
      const { error } = await supabase
        .from("discount_policies")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Discount policy deleted",
        description: "Policy has been removed",
      });
      loadPolicies();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const deleteExemption = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exemption policy?")) return;

    try {
      const { error } = await supabase
        .from("exemption_policies")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Exemption policy deleted",
        description: "Policy has been removed",
      });
      loadPolicies();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="discounts">
        <TabsList>
          <TabsTrigger value="discounts">Discount Policies</TabsTrigger>
          <TabsTrigger value="exemptions">Exemption Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="discounts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Discount Policies
                  </CardTitle>
                  <CardDescription>
                    Manage automatic and manual discount policies
                  </CardDescription>
                </div>
                <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingDiscount(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Discount Policy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingDiscount ? "Edit" : "Create"} Discount Policy
                      </DialogTitle>
                      <DialogDescription>
                        Configure discount rules and applicability
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleDiscountSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="disc-name">Policy Name *</Label>
                          <Input
                            id="disc-name"
                            value={discountFormData.name}
                            onChange={(e) => setDiscountFormData({ ...discountFormData, name: e.target.value })}
                            placeholder="e.g., Senior Citizen Discount"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="disc-code">Code *</Label>
                          <Input
                            id="disc-code"
                            value={discountFormData.code}
                            onChange={(e) => setDiscountFormData({ ...discountFormData, code: e.target.value })}
                            placeholder="e.g., SENIOR10"
                            required
                            disabled={!!editingDiscount}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="disc-description">Description</Label>
                        <Textarea
                          id="disc-description"
                          value={discountFormData.description}
                          onChange={(e) => setDiscountFormData({ ...discountFormData, description: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="disc-type">Discount Type *</Label>
                          <Select
                            value={discountFormData.discount_type}
                            onValueChange={(value) => setDiscountFormData({ ...discountFormData, discount_type: value })}
                          >
                            <SelectTrigger id="disc-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="disc-value">
                            {discountFormData.discount_type === "percentage" ? "Percentage" : "Amount"} *
                          </Label>
                          <Input
                            id="disc-value"
                            type="number"
                            step="0.01"
                            value={discountFormData.discount_value}
                            onChange={(e) => setDiscountFormData({ ...discountFormData, discount_value: parseFloat(e.target.value) })}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="disc-max">Max Discount Amount</Label>
                          <Input
                            id="disc-max"
                            type="number"
                            step="0.01"
                            value={discountFormData.max_discount_amount}
                            onChange={(e) => setDiscountFormData({ ...discountFormData, max_discount_amount: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="disc-min">Min Purchase Amount</Label>
                          <Input
                            id="disc-min"
                            type="number"
                            step="0.01"
                            value={discountFormData.min_purchase_amount}
                            onChange={(e) => setDiscountFormData({ ...discountFormData, min_purchase_amount: parseFloat(e.target.value) })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="disc-applicable">Applicable To *</Label>
                          <Select
                            value={discountFormData.applicable_to}
                            onValueChange={(value) => setDiscountFormData({ ...discountFormData, applicable_to: value })}
                          >
                            <SelectTrigger id="disc-applicable">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Items</SelectItem>
                              <SelectItem value="services">Services Only</SelectItem>
                              <SelectItem value="packages">Packages Only</SelectItem>
                              <SelectItem value="specific_items">Specific Items</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="disc-from">Valid From *</Label>
                          <Input
                            id="disc-from"
                            type="date"
                            value={discountFormData.valid_from}
                            onChange={(e) => setDiscountFormData({ ...discountFormData, valid_from: e.target.value })}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="disc-to">Valid To</Label>
                          <Input
                            id="disc-to"
                            type="date"
                            value={discountFormData.valid_to}
                            onChange={(e) => setDiscountFormData({ ...discountFormData, valid_to: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-3 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="disc-approval">Requires Approval</Label>
                          <Switch
                            id="disc-approval"
                            checked={discountFormData.requires_approval}
                            onCheckedChange={(checked) => setDiscountFormData({ ...discountFormData, requires_approval: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="disc-active">Active</Label>
                          <Switch
                            id="disc-active"
                            checked={discountFormData.is_active}
                            onCheckedChange={(checked) => setDiscountFormData({ ...discountFormData, is_active: checked })}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setDiscountOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingDiscount ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading policies...</div>
              ) : discounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No discount policies configured
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Policy Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Applicable To</TableHead>
                      <TableHead>Validity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discounts.map((discount) => (
                      <TableRow key={discount.id}>
                        <TableCell>
                          <Badge variant="outline">{discount.code}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{discount.name}</TableCell>
                        <TableCell className="capitalize">{discount.discount_type.replace("_", " ")}</TableCell>
                        <TableCell>
                          {discount.discount_type === "percentage" 
                            ? `${discount.discount_value}%` 
                            : `$${discount.discount_value.toFixed(2)}`}
                        </TableCell>
                        <TableCell className="capitalize">{discount.applicable_to.replace("_", " ")}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(discount.valid_from), "MMM d, yyyy")} - 
                          {discount.valid_to ? format(new Date(discount.valid_to), "MMM d, yyyy") : "Ongoing"}
                        </TableCell>
                        <TableCell>
                          {discount.is_active ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => deleteDiscount(discount.id)}>
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
        </TabsContent>

        <TabsContent value="exemptions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Exemption Policies
                  </CardTitle>
                  <CardDescription>
                    Manage fee waivers and payment exemptions
                  </CardDescription>
                </div>
                <Dialog open={exemptionOpen} onOpenChange={setExemptionOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingExemption(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Exemption Policy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingExemption ? "Edit" : "Create"} Exemption Policy
                      </DialogTitle>
                      <DialogDescription>
                        Configure exemption criteria and requirements
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleExemptionSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ex-name">Policy Name *</Label>
                          <Input
                            id="ex-name"
                            value={exemptionFormData.name}
                            onChange={(e) => setExemptionFormData({ ...exemptionFormData, name: e.target.value })}
                            placeholder="e.g., Indigent Patient Waiver"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="ex-code">Code *</Label>
                          <Input
                            id="ex-code"
                            value={exemptionFormData.code}
                            onChange={(e) => setExemptionFormData({ ...exemptionFormData, code: e.target.value })}
                            placeholder="e.g., INDIGENT_WAIVER"
                            required
                            disabled={!!editingExemption}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="ex-description">Description</Label>
                        <Textarea
                          id="ex-description"
                          value={exemptionFormData.description}
                          onChange={(e) => setExemptionFormData({ ...exemptionFormData, description: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ex-type">Exemption Type *</Label>
                          <Select
                            value={exemptionFormData.exemption_type}
                            onValueChange={(value) => setExemptionFormData({ ...exemptionFormData, exemption_type: value })}
                          >
                            <SelectTrigger id="ex-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full_waiver">Full Waiver</SelectItem>
                              <SelectItem value="partial_waiver">Partial Waiver</SelectItem>
                              <SelectItem value="deferred_payment">Deferred Payment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {exemptionFormData.exemption_type === "partial_waiver" && (
                          <div>
                            <Label htmlFor="ex-percentage">Waiver Percentage</Label>
                            <Input
                              id="ex-percentage"
                              type="number"
                              step="0.01"
                              value={exemptionFormData.exemption_percentage}
                              onChange={(e) => setExemptionFormData({ ...exemptionFormData, exemption_percentage: parseFloat(e.target.value) })}
                            />
                          </div>
                        )}

                        <div>
                          <Label htmlFor="ex-applies">Applies To *</Label>
                          <Select
                            value={exemptionFormData.applies_to}
                            onValueChange={(value) => setExemptionFormData({ ...exemptionFormData, applies_to: value })}
                          >
                            <SelectTrigger id="ex-applies">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all_charges">All Charges</SelectItem>
                              <SelectItem value="specific_services">Specific Services</SelectItem>
                              <SelectItem value="specific_categories">Specific Categories</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ex-from">Valid From *</Label>
                          <Input
                            id="ex-from"
                            type="date"
                            value={exemptionFormData.valid_from}
                            onChange={(e) => setExemptionFormData({ ...exemptionFormData, valid_from: e.target.value })}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="ex-to">Valid To</Label>
                          <Input
                            id="ex-to"
                            type="date"
                            value={exemptionFormData.valid_to}
                            onChange={(e) => setExemptionFormData({ ...exemptionFormData, valid_to: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-3 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="ex-docs">Requires Documentation</Label>
                          <Switch
                            id="ex-docs"
                            checked={exemptionFormData.requires_documentation}
                            onCheckedChange={(checked) => setExemptionFormData({ ...exemptionFormData, requires_documentation: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="ex-active">Active</Label>
                          <Switch
                            id="ex-active"
                            checked={exemptionFormData.is_active}
                            onCheckedChange={(checked) => setExemptionFormData({ ...exemptionFormData, is_active: checked })}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setExemptionOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingExemption ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading policies...</div>
              ) : exemptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No exemption policies configured
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Policy Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Applies To</TableHead>
                      <TableHead>Documentation</TableHead>
                      <TableHead>Validity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exemptions.map((exemption) => (
                      <TableRow key={exemption.id}>
                        <TableCell>
                          <Badge variant="outline">{exemption.code}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{exemption.name}</TableCell>
                        <TableCell className="capitalize">{exemption.exemption_type.replace("_", " ")}</TableCell>
                        <TableCell className="capitalize">{exemption.applies_to.replace("_", " ")}</TableCell>
                        <TableCell>
                          {exemption.requires_documentation ? (
                            <Badge variant="default">Required</Badge>
                          ) : (
                            <Badge variant="outline">Not Required</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(exemption.valid_from), "MMM d, yyyy")} - 
                          {exemption.valid_to ? format(new Date(exemption.valid_to), "MMM d, yyyy") : "Ongoing"}
                        </TableCell>
                        <TableCell>
                          {exemption.is_active ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => deleteExemption(exemption.id)}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};
