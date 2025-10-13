import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, User, Phone, Shield, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AVAILABLE_ROLES = [
  { value: "admin", label: "Admin", description: "Full system access", icon: Shield },
  { value: "manager", label: "Manager", description: "View analytics and reports", icon: Shield },
  { value: "clinician", label: "Clinician", description: "Clinical workflows and patient care", icon: Shield },
  { value: "nurse", label: "Nurse", description: "Triage and patient assessment", icon: Shield },
  { value: "reception", label: "Reception", description: "Patient registration and scheduling", icon: Shield },
  { value: "billing", label: "Billing", description: "Financial operations", icon: Shield },
];

export const CreateUserDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneMobile: "",
    password: "",
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const { toast } = useToast();

  const handleToggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const password = Array.from({ length: 12 }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
    setFormData(prev => ({ ...prev, password }));
  };

  const resetForm = () => {
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      phoneMobile: "",
      password: "",
    });
    setSelectedRoles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.password) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please fill in all required fields",
      });
      return;
    }

    if (selectedRoles.length === 0) {
      toast({
        variant: "destructive",
        title: "No roles selected",
        description: "Please select at least one role for the user",
      });
      return;
    }

    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Update profile with phone
      if (formData.phoneMobile) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ phone_mobile: formData.phoneMobile })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;
      }

      // Assign roles
      const { error: rolesError } = await supabase
        .from("user_roles" as any)
        .insert(
          selectedRoles.map((role) => ({
            user_id: authData.user.id,
            role: role,
          }))
        );

      if (rolesError) throw rolesError;

      toast({
        title: "User created successfully",
        description: `${formData.firstName} ${formData.lastName} has been added to the system`,
      });

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating user",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Add a new staff member to the system and assign their roles
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information Section */}
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              User Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john.doe@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneMobile" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phoneMobile"
                type="tel"
                value={formData.phoneMobile}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneMobile: e.target.value }))}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters. Click Generate for a secure password.
              </p>
            </div>
          </Card>

          {/* Roles Section */}
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role Assignment <span className="text-destructive">*</span>
            </h3>
            
            <div className="space-y-3">
              {AVAILABLE_ROLES.map((role) => (
                <div 
                  key={role.value} 
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`role-${role.value}`}
                    checked={selectedRoles.includes(role.value)}
                    onCheckedChange={() => handleToggleRole(role.value)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`role-${role.value}`} className="font-medium cursor-pointer">
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
              <div className="text-sm text-destructive flex items-center gap-2 p-2 bg-destructive/10 rounded">
                <Shield className="h-4 w-4" />
                User must have at least one role to access the system
              </div>
            )}
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating User...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
