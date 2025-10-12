import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ManageClinicAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

interface Clinic {
  id: string;
  name: string;
  code: string;
}

interface ClinicGrant {
  id: string;
  clinic_id: string | null;
  all_clinics: boolean;
  scope: 'read' | 'write';
}

export function ManageClinicAccessDialog({ 
  open, 
  onOpenChange, 
  userId, 
  userName 
}: ManageClinicAccessDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [grants, setGrants] = useState<ClinicGrant[]>([]);
  
  const [allClinicsRead, setAllClinicsRead] = useState(false);
  const [allClinicsWrite, setAllClinicsWrite] = useState(false);
  const [selectedReadClinics, setSelectedReadClinics] = useState<Set<string>>(new Set());
  const [selectedWriteClinics, setSelectedWriteClinics] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, userId]);

  const loadData = async () => {
    setLoading(true);
    
    // Load clinics
    const { data: clinicsData, error: clinicsError } = await supabase
      .from("clinics")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (clinicsError) {
      toast({
        variant: "destructive",
        title: "Error loading clinics",
        description: clinicsError.message,
      });
    } else {
      setClinics((clinicsData || []).map(c => ({ ...c, code: '' })));
    }

    // Load existing grants
    const { data: grantsData, error: grantsError } = await supabase
      .from("user_clinic_grant" as any)
      .select("*")
      .eq("user_id", userId);

    if (grantsError) {
      toast({
        variant: "destructive",
        title: "Error loading clinic grants",
        description: grantsError.message,
      });
    } else {
      const typedGrants = (grantsData as any[]) || [];
      setGrants(typedGrants);
      
      // Set initial state
      const readGrant = typedGrants.find((g: any) => g.scope === 'read' && g.all_clinics);
      const writeGrant = typedGrants.find((g: any) => g.scope === 'write' && g.all_clinics);
      
      setAllClinicsRead(!!readGrant);
      setAllClinicsWrite(!!writeGrant);
      
      const readClinics = new Set(
        typedGrants.filter((g: any) => g.scope === 'read' && !g.all_clinics && g.clinic_id).map((g: any) => g.clinic_id)
      );
      const writeClinics = new Set(
        typedGrants.filter((g: any) => g.scope === 'write' && !g.all_clinics && g.clinic_id).map((g: any) => g.clinic_id)
      );
      
      setSelectedReadClinics(readClinics);
      setSelectedWriteClinics(writeClinics);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Delete all existing grants
      const { error: deleteError } = await supabase
        .from("user_clinic_grant" as any)
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Insert new grants
      const newGrants: any[] = [];

      // All clinics grants
      if (allClinicsRead) {
        newGrants.push({
          user_id: userId,
          all_clinics: true,
          scope: 'read',
          clinic_id: null,
        });
      }

      if (allClinicsWrite) {
        newGrants.push({
          user_id: userId,
          all_clinics: true,
          scope: 'write',
          clinic_id: null,
        });
      }

      // Specific clinic grants (only if not all_clinics)
      if (!allClinicsRead) {
        selectedReadClinics.forEach(clinicId => {
          newGrants.push({
            user_id: userId,
            all_clinics: false,
            scope: 'read',
            clinic_id: clinicId,
          });
        });
      }

      if (!allClinicsWrite) {
        selectedWriteClinics.forEach(clinicId => {
          newGrants.push({
            user_id: userId,
            all_clinics: false,
            scope: 'write',
            clinic_id: clinicId,
          });
        });
      }

      if (newGrants.length > 0) {
        const { error: insertError } = await supabase
          .from("user_clinic_grant" as any)
          .insert(newGrants);

        if (insertError) throw insertError;
      }

      toast({
        title: "Clinic access updated",
        description: `Updated clinic access for ${userName}`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating clinic access",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleReadClinic = (clinicId: string) => {
    const newSet = new Set(selectedReadClinics);
    if (newSet.has(clinicId)) {
      newSet.delete(clinicId);
    } else {
      newSet.add(clinicId);
    }
    setSelectedReadClinics(newSet);
  };

  const toggleWriteClinic = (clinicId: string) => {
    const newSet = new Set(selectedWriteClinics);
    if (newSet.has(clinicId)) {
      newSet.delete(clinicId);
    } else {
      newSet.add(clinicId);
    }
    setSelectedWriteClinics(newSet);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Manage Clinic Access - {userName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* All Clinics Toggle */}
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-medium">Global Access</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="all-read" className="cursor-pointer">
                  All Clinics (Read)
                </Label>
                <Switch
                  id="all-read"
                  checked={allClinicsRead}
                  onCheckedChange={setAllClinicsRead}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="all-write" className="cursor-pointer">
                  All Clinics (Write)
                </Label>
                <Switch
                  id="all-write"
                  checked={allClinicsWrite}
                  onCheckedChange={setAllClinicsWrite}
                />
              </div>
            </div>

            {/* Specific Clinics */}
            {(!allClinicsRead || !allClinicsWrite) && (
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="font-medium">Specific Clinic Access</h3>
                
                <div className="space-y-3">
                  {clinics.map(clinic => (
                    <div key={clinic.id} className="flex items-center justify-between gap-4 p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                          <div className="font-medium">{clinic.name}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {!allClinicsRead && (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`read-${clinic.id}`}
                              checked={selectedReadClinics.has(clinic.id)}
                              onCheckedChange={() => toggleReadClinic(clinic.id)}
                            />
                            <Label 
                              htmlFor={`read-${clinic.id}`}
                              className="text-sm cursor-pointer"
                            >
                              Read
                            </Label>
                          </div>
                        )}
                        
                        {!allClinicsWrite && (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`write-${clinic.id}`}
                              checked={selectedWriteClinics.has(clinic.id)}
                              onCheckedChange={() => toggleWriteClinic(clinic.id)}
                            />
                            <Label 
                              htmlFor={`write-${clinic.id}`}
                              className="text-sm cursor-pointer"
                            >
                              Write
                            </Label>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
