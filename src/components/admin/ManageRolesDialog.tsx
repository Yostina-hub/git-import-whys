import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
}

interface ManageRolesDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AVAILABLE_ROLES = [
  { value: "admin", label: "Admin", description: "Full system access" },
  { value: "manager", label: "Manager", description: "View analytics and reports" },
  { value: "clinician", label: "Clinician", description: "Clinical workflows and patient care" },
  { value: "nurse", label: "Nurse", description: "Triage and patient assessment" },
  { value: "reception", label: "Reception", description: "Patient registration and scheduling" },
  { value: "billing", label: "Billing", description: "Financial operations" },
];

export const ManageRolesDialog = ({
  user,
  open,
  onOpenChange,
  onSuccess,
}: ManageRolesDialogProps) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && open) {
      setSelectedRoles(user.roles || []);
    }
  }, [user, open]);

  const handleToggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // Get current roles
      const { data: currentRoles } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user.id);

      const currentRoleValues = currentRoles?.map((r: any) => r.role) || [];

      // Find roles to add and remove
      const rolesToAdd = selectedRoles.filter(
        (role) => !currentRoleValues.includes(role)
      );
      const rolesToRemove = currentRoleValues.filter(
        (role: string) => !selectedRoles.includes(role)
      );

      // Remove old roles
      if (rolesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("user_roles" as any)
          .delete()
          .eq("user_id", user.id)
          .in("role", rolesToRemove);

        if (deleteError) throw deleteError;
      }

      // Add new roles
      if (rolesToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from("user_roles" as any)
          .insert(
            rolesToAdd.map((role) => ({
              user_id: user.id,
              role: role,
            }))
          );

        if (insertError) throw insertError;
      }

      toast({
        title: "Roles updated",
        description: `Roles for ${user.first_name} ${user.last_name} have been updated`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating roles",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Manage Roles - {user.first_name} {user.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Email: {user.email}
          </div>

          <div className="space-y-3">
            {AVAILABLE_ROLES.map((role) => (
              <div key={role.value} className="flex items-start space-x-3">
                <Checkbox
                  id={role.value}
                  checked={selectedRoles.includes(role.value)}
                  onCheckedChange={() => handleToggleRole(role.value)}
                />
                <div className="flex-1">
                  <Label htmlFor={role.value} className="font-medium cursor-pointer">
                    {role.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selectedRoles.length === 0 && (
            <div className="text-sm text-destructive">
              Warning: User must have at least one role to access the system
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
