import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Box } from "lucide-react";
import { AddPackageDialog } from "@/components/packages/AddPackageDialog";
import { EditPackageDialog } from "@/components/packages/EditPackageDialog";

const Packages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    loadPackages();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadPackages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .order("name");

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading packages",
        description: error.message,
      });
    } else {
      setPackages(data || []);
    }
    setLoading(false);
  };

  const togglePackageStatus = async (pkg: any) => {
    const { error } = await supabase
      .from("packages")
      .update({ is_active: !pkg.is_active })
      .eq("id", pkg.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating package",
        description: error.message,
      });
    } else {
      toast({
        title: "Package updated",
        description: `${pkg.name} is now ${!pkg.is_active ? 'active' : 'inactive'}`,
      });
      loadPackages();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Treatment Packages</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Packages</CardTitle>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Package
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : packages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No packages created yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Components</TableHead>
                    <TableHead>Bundle Price</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.code}</TableCell>
                      <TableCell>{pkg.name}</TableCell>
                      <TableCell>
                        {Array.isArray(pkg.components) ? pkg.components.length : 0} services
                      </TableCell>
                      <TableCell>${Number(pkg.bundle_price).toFixed(2)}</TableCell>
                      <TableCell>
                        {pkg.validity_days ? `${pkg.validity_days} days` : "Unlimited"}
                      </TableCell>
                      <TableCell>
                        <Badge className={pkg.is_active ? "bg-green-500" : "bg-gray-500"}>
                          {pkg.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {pkg.description || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPackage(pkg)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => togglePackageStatus(pkg)}
                          >
                            {pkg.is_active ? "Deactivate" : "Activate"}
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
      </main>

      <AddPackageDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={loadPackages}
      />

      {editingPackage && (
        <EditPackageDialog
          open={!!editingPackage}
          onOpenChange={(open) => !open && setEditingPackage(null)}
          package={editingPackage}
          onSuccess={loadPackages}
        />
      )}
    </div>
  );
};

export default Packages;
