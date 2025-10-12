import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Edit, MapPin, Eye, Trash2 } from "lucide-react";
import { ManageClinicDialog } from "./ManageClinicDialog";
import { ViewClinicDialog } from "./ViewClinicDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ClinicsTab() {
  const { toast } = useToast();
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<any>(null);
  const [viewingClinic, setViewingClinic] = useState<any>(null);
  const [deletingClinic, setDeletingClinic] = useState<any>(null);

  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clinics")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading clinics",
        description: error.message,
      });
    } else {
      setClinics(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (clinic: any) => {
    setEditingClinic(clinic);
    setDialogOpen(true);
  };

  const handleView = (clinic: any) => {
    setViewingClinic(clinic);
    setViewDialogOpen(true);
  };

  const handleDelete = (clinic: any) => {
    setDeletingClinic(clinic);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingClinic) return;

    const { error } = await supabase
      .from("clinics")
      .update({ is_active: false })
      .eq("id", deletingClinic.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deactivating clinic",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Clinic deactivated successfully",
      });
      loadClinics();
    }
    setDeleteDialogOpen(false);
    setDeletingClinic(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClinic(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Clinics & Locations</CardTitle>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Clinic
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : clinics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No clinics configured yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clinic Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinics.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {clinic.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{clinic.code || "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    {clinic.city && clinic.country ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {clinic.city}, {clinic.country}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {clinic.phone && <div>{clinic.phone}</div>}
                      {clinic.email && <div className="text-muted-foreground">{clinic.email}</div>}
                      {!clinic.phone && !clinic.email && <span className="text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>{clinic.timezone || "Africa/Addis_Ababa"}</TableCell>
                  <TableCell>
                    <Badge variant={clinic.is_active ? "default" : "secondary"}>
                      {clinic.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(clinic)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(clinic)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(clinic)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Deactivate
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ManageClinicDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        clinic={editingClinic}
        onSuccess={loadClinics}
      />

      <ViewClinicDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        clinic={viewingClinic}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Clinic?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate "{deletingClinic?.name}". The clinic will be marked as inactive
              but all associated data will be preserved. You can reactivate it later by editing the clinic.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
