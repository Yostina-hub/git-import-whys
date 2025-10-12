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
import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
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

interface PaymentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  requires_reference: boolean;
  icon?: string;
  sort_order: number;
}

export const PaymentTypesConfig = () => {
  const { toast } = useToast();
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingType, setEditingType] = useState<PaymentType | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    is_active: true,
    requires_reference: false,
    icon: "Banknote",
    sort_order: 0,
  });

  useEffect(() => {
    loadPaymentTypes();
  }, []);

  const loadPaymentTypes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_types")
      .select("*")
      .order("sort_order");

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading payment types",
        description: error.message,
      });
    } else if (data) {
      setPaymentTypes(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingType) {
        const { error } = await supabase
          .from("payment_types")
          .update(formData)
          .eq("id", editingType.id);

        if (error) throw error;

        toast({
          title: "Payment type updated",
          description: "Changes have been saved successfully",
        });
      } else {
        const { error } = await supabase
          .from("payment_types")
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Payment type created",
          description: "New payment method has been added",
        });
      }

      setOpen(false);
      setEditingType(null);
      setFormData({
        code: "",
        name: "",
        description: "",
        is_active: true,
        requires_reference: false,
        icon: "Banknote",
        sort_order: 0,
      });
      loadPaymentTypes();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleEdit = (type: PaymentType) => {
    setEditingType(type);
    setFormData({
      code: type.code,
      name: type.name,
      description: type.description || "",
      is_active: type.is_active,
      requires_reference: type.requires_reference,
      icon: type.icon || "Banknote",
      sort_order: type.sort_order,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment type?")) return;

    try {
      const { error } = await supabase
        .from("payment_types")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Payment type deleted",
        description: "Payment method has been removed",
      });
      loadPaymentTypes();
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
        .from("payment_types")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: "Payment type status has been changed",
      });
      loadPaymentTypes();
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Types Configuration
              </CardTitle>
              <CardDescription>
                Manage available payment methods for invoices and transactions
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingType(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Type
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingType ? "Edit" : "Add"} Payment Type
                  </DialogTitle>
                  <DialogDescription>
                    Configure payment method details and settings
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">Code *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g., cash, card"
                        required
                        disabled={!!editingType}
                      />
                    </div>

                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Cash Payment"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="icon">Icon Name</Label>
                      <Select
                        value={formData.icon}
                        onValueChange={(value) => setFormData({ ...formData, icon: value })}
                      >
                        <SelectTrigger id="icon">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Banknote">Banknote</SelectItem>
                          <SelectItem value="CreditCard">Credit Card</SelectItem>
                          <SelectItem value="Smartphone">Smartphone</SelectItem>
                          <SelectItem value="Building2">Building</SelectItem>
                          <SelectItem value="Shield">Shield</SelectItem>
                          <SelectItem value="FileCheck">File Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sort">Sort Order</Label>
                      <Input
                        id="sort"
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="active">Active</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable this payment method
                        </p>
                      </div>
                      <Switch
                        id="active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="reference">Requires Reference</Label>
                        <p className="text-sm text-muted-foreground">
                          Require transaction reference number
                        </p>
                      </div>
                      <Switch
                        id="reference"
                        checked={formData.requires_reference}
                        onCheckedChange={(checked) => setFormData({ ...formData, requires_reference: checked })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingType ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading payment types...</div>
          ) : paymentTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment types configured
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>
                      <Badge variant="outline">{type.code}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {type.description || "—"}
                    </TableCell>
                    <TableCell>
                      {type.requires_reference ? (
                        <Badge variant="secondary">Required</Badge>
                      ) : (
                        <Badge variant="outline">Optional</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={type.is_active}
                          onCheckedChange={() => toggleActive(type.id, type.is_active)}
                        />
                        <span className="text-sm">
                          {type.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(type.id)}
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
