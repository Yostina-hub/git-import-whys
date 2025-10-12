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
import { Plus, Edit, Trash2, ListOrdered, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PriceList {
  id: string;
  name: string;
  code: string;
  description?: string;
  valid_from: string;
  valid_to?: string;
  is_active: boolean;
  is_default: boolean;
  markup_percentage: number;
}

interface PriceListItem {
  id: string;
  price_list_id: string;
  service_id: string;
  custom_price: number;
  discount_percentage: number;
  services: {
    name: string;
    code: string;
    unit_price: number;
  };
}

export const PriceListsConfig = () => {
  const { toast } = useToast();
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [selectedList, setSelectedList] = useState<PriceList | null>(null);
  const [listItems, setListItems] = useState<PriceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingList, setEditingList] = useState<PriceList | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    valid_from: new Date().toISOString().split("T")[0],
    valid_to: "",
    is_active: true,
    is_default: false,
    markup_percentage: 0,
  });

  useEffect(() => {
    loadPriceLists();
  }, []);

  useEffect(() => {
    if (selectedList) {
      loadPriceListItems(selectedList.id);
    }
  }, [selectedList]);

  const loadPriceLists = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("price_lists")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading price lists",
        description: error.message,
      });
    } else if (data) {
      setPriceLists(data);
      if (data.length > 0 && !selectedList) {
        setSelectedList(data[0]);
      }
    }
    setLoading(false);
  };

  const loadPriceListItems = async (priceListId: string) => {
    const { data, error } = await supabase
      .from("price_list_items")
      .select("*, services(name, code, unit_price)")
      .eq("price_list_id", priceListId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading price list items",
        description: error.message,
      });
    } else if (data) {
      setListItems(data as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingList) {
        const { error } = await supabase
          .from("price_lists")
          .update(formData)
          .eq("id", editingList.id);

        if (error) throw error;

        toast({
          title: "Price list updated",
          description: "Changes have been saved successfully",
        });
      } else {
        const { error } = await supabase
          .from("price_lists")
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Price list created",
          description: "New price list has been added",
        });
      }

      setOpen(false);
      setEditingList(null);
      setFormData({
        name: "",
        code: "",
        description: "",
        valid_from: new Date().toISOString().split("T")[0],
        valid_to: "",
        is_active: true,
        is_default: false,
        markup_percentage: 0,
      });
      loadPriceLists();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleEdit = (list: PriceList) => {
    setEditingList(list);
    setFormData({
      name: list.name,
      code: list.code,
      description: list.description || "",
      valid_from: list.valid_from,
      valid_to: list.valid_to || "",
      is_active: list.is_active,
      is_default: list.is_default,
      markup_percentage: list.markup_percentage,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this price list?")) return;

    try {
      const { error } = await supabase
        .from("price_lists")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Price list deleted",
        description: "Price list has been removed",
      });
      loadPriceLists();
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
                <ListOrdered className="h-5 w-5" />
                Price Lists Configuration
              </CardTitle>
              <CardDescription>
                Manage custom pricing for different customer segments or time periods
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingList(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Price List
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingList ? "Edit" : "Create"} Price List
                  </DialogTitle>
                  <DialogDescription>
                    Configure pricing details and validity period
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., VIP Pricing"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="code">Code *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g., VIP-2024"
                        required
                        disabled={!!editingList}
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
                      <Label htmlFor="valid_from">Valid From *</Label>
                      <Input
                        id="valid_from"
                        type="date"
                        value={formData.valid_from}
                        onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="valid_to">Valid To</Label>
                      <Input
                        id="valid_to"
                        type="date"
                        value={formData.valid_to}
                        onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="markup">Markup Percentage</Label>
                    <Input
                      id="markup"
                      type="number"
                      step="0.01"
                      value={formData.markup_percentage}
                      onChange={(e) => setFormData({ ...formData, markup_percentage: parseFloat(e.target.value) })}
                      placeholder="0.00"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Applied to base prices if no custom price is set
                    </p>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="active">Active</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable this price list
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
                        <Label htmlFor="default">Default Price List</Label>
                        <p className="text-sm text-muted-foreground">
                          Use as default for new customers
                        </p>
                      </div>
                      <Switch
                        id="default"
                        checked={formData.is_default}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingList ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={selectedList?.id} onValueChange={(id) => {
            const list = priceLists.find(l => l.id === id);
            if (list) setSelectedList(list);
          }}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {priceLists.map((list) => (
                <TabsTrigger key={list.id} value={list.id} className="gap-2">
                  {list.name}
                  {list.is_default && <Badge variant="secondary">Default</Badge>}
                  {!list.is_active && <Badge variant="outline">Inactive</Badge>}
                </TabsTrigger>
              ))}
            </TabsList>

            {priceLists.map((list) => (
              <TabsContent key={list.id} value={list.id} className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div>
                    <h3 className="font-semibold">{list.name}</h3>
                    <p className="text-sm text-muted-foreground">{list.description}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span>Valid: {format(new Date(list.valid_from), "MMM d, yyyy")} - {list.valid_to ? format(new Date(list.valid_to), "MMM d, yyyy") : "Ongoing"}</span>
                      <span>Markup: {list.markup_percentage}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(list)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(list.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service Code</TableHead>
                        <TableHead>Service Name</TableHead>
                        <TableHead>Base Price</TableHead>
                        <TableHead>Custom Price</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Final Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No items in this price list
                          </TableCell>
                        </TableRow>
                      ) : (
                        listItems.map((item) => {
                          const finalPrice = item.custom_price * (1 - item.discount_percentage / 100);
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Badge variant="outline">{item.services.code}</Badge>
                              </TableCell>
                              <TableCell className="font-medium">{item.services.name}</TableCell>
                              <TableCell>${item.services.unit_price.toFixed(2)}</TableCell>
                              <TableCell>${item.custom_price.toFixed(2)}</TableCell>
                              <TableCell>{item.discount_percentage}%</TableCell>
                              <TableCell className="font-semibold">${finalPrice.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {priceLists.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No price lists configured
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
