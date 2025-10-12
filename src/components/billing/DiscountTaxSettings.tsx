import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  is_default: boolean;
  is_active: boolean;
}

interface Discount {
  id: string;
  code: string;
  description: string;
  type: "percentage" | "fixed";
  value: number;
  is_active: boolean;
  min_amount?: number;
}

export const DiscountTaxSettings = () => {
  const { toast } = useToast();
  const [taxRates, setTaxRates] = useState<TaxRate[]>([
    { id: "1", name: "Standard VAT", rate: 15, is_default: true, is_active: true },
    { id: "2", name: "Zero Rate", rate: 0, is_default: false, is_active: true },
  ]);
  const [discounts, setDiscounts] = useState<Discount[]>([
    { id: "1", code: "SENIOR10", description: "Senior citizen discount", type: "percentage", value: 10, is_active: true },
    { id: "2", code: "EMPLOYEE", description: "Staff discount", type: "percentage", value: 15, is_active: true },
  ]);

  const [newTaxRate, setNewTaxRate] = useState({ name: "", rate: 0 });
  const [newDiscount, setNewDiscount] = useState({
    code: "",
    description: "",
    type: "percentage" as "percentage" | "fixed",
    value: 0,
    min_amount: 0,
  });

  const addTaxRate = () => {
    if (!newTaxRate.name || newTaxRate.rate < 0) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Please provide a name and valid rate",
      });
      return;
    }

    const newRate: TaxRate = {
      id: Date.now().toString(),
      name: newTaxRate.name,
      rate: newTaxRate.rate,
      is_default: taxRates.length === 0,
      is_active: true,
    };

    setTaxRates([...taxRates, newRate]);
    setNewTaxRate({ name: "", rate: 0 });
    toast({ title: "Tax rate added", description: "New tax rate created successfully" });
  };

  const addDiscount = () => {
    if (!newDiscount.code || !newDiscount.description || newDiscount.value <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Please provide code, description, and valid value",
      });
      return;
    }

    const discount: Discount = {
      id: Date.now().toString(),
      ...newDiscount,
      is_active: true,
    };

    setDiscounts([...discounts, discount]);
    setNewDiscount({
      code: "",
      description: "",
      type: "percentage",
      value: 0,
      min_amount: 0,
    });
    toast({ title: "Discount added", description: "New discount code created successfully" });
  };

  const toggleTaxRate = (id: string) => {
    setTaxRates(taxRates.map(rate =>
      rate.id === id ? { ...rate, is_active: !rate.is_active } : rate
    ));
  };

  const setDefaultTaxRate = (id: string) => {
    setTaxRates(taxRates.map(rate => ({
      ...rate,
      is_default: rate.id === id,
    })));
  };

  const deleteTaxRate = (id: string) => {
    setTaxRates(taxRates.filter(rate => rate.id !== id));
    toast({ title: "Tax rate deleted" });
  };

  const toggleDiscount = (id: string) => {
    setDiscounts(discounts.map(disc =>
      disc.id === id ? { ...disc, is_active: !disc.is_active } : disc
    ));
  };

  const deleteDiscount = (id: string) => {
    setDiscounts(discounts.filter(disc => disc.id !== id));
    toast({ title: "Discount deleted" });
  };

  const saveSettings = () => {
    // In production, save to database
    toast({
      title: "Settings saved",
      description: "Tax rates and discounts have been saved",
    });
  };

  return (
    <div className="space-y-6">
      {/* Tax Rates Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Rates Configuration</CardTitle>
          <CardDescription>
            Manage tax rates applicable to invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tax-name">Tax Name</Label>
              <Input
                id="tax-name"
                placeholder="e.g., Standard VAT"
                value={newTaxRate.name}
                onChange={(e) => setNewTaxRate({ ...newTaxRate, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tax-rate">Rate (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="15"
                value={newTaxRate.rate || ""}
                onChange={(e) => setNewTaxRate({ ...newTaxRate, rate: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addTaxRate} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Tax Rate
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">{rate.name}</TableCell>
                  <TableCell>{rate.rate}%</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={rate.is_default ? "default" : "outline"}
                      onClick={() => setDefaultTaxRate(rate.id)}
                    >
                      {rate.is_default ? "Default" : "Set Default"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rate.is_active}
                      onCheckedChange={() => toggleTaxRate(rate.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTaxRate(rate.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Discounts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Discount Codes Configuration</CardTitle>
          <CardDescription>
            Create and manage discount codes for invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label htmlFor="discount-code">Code</Label>
              <Input
                id="discount-code"
                placeholder="SENIOR10"
                value={newDiscount.code}
                onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <Label htmlFor="discount-desc">Description</Label>
              <Input
                id="discount-desc"
                placeholder="Senior citizen discount"
                value={newDiscount.description}
                onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="discount-type">Type</Label>
              <Select
                value={newDiscount.type}
                onValueChange={(value: "percentage" | "fixed") =>
                  setNewDiscount({ ...newDiscount, type: value })
                }
              >
                <SelectTrigger id="discount-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="discount-value">Value</Label>
              <Input
                id="discount-value"
                type="number"
                step="0.01"
                min="0"
                placeholder={newDiscount.type === "percentage" ? "10" : "50"}
                value={newDiscount.value || ""}
                onChange={(e) => setNewDiscount({ ...newDiscount, value: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addDiscount} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell className="font-mono font-bold">{discount.code}</TableCell>
                  <TableCell>{discount.description}</TableCell>
                  <TableCell className="capitalize">{discount.type}</TableCell>
                  <TableCell>
                    {discount.type === "percentage" ? `${discount.value}%` : `$${discount.value}`}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={discount.is_active}
                      onCheckedChange={() => toggleDiscount(discount.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteDiscount(discount.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
};
