import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle2, XCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Permission = {
  module: string;
  description: string;
  roles: string[];
};

const PERMISSIONS: Permission[] = [
  { module: "Dashboard", description: "View main dashboard", roles: ["admin", "superadmin", "manager", "clinician", "nurse", "reception", "billing"] },
  { module: "Patients", description: "Manage patient records", roles: ["admin", "superadmin", "clinician", "nurse", "reception", "billing"] },
  { module: "Visits", description: "Manage patient visits", roles: ["admin", "superadmin", "clinician", "nurse", "reception"] },
  { module: "Appointments", description: "Schedule and manage appointments", roles: ["admin", "superadmin", "clinician", "reception"] },
  { module: "Queue Management", description: "Manage patient queues", roles: ["admin", "superadmin", "clinician", "nurse", "reception"] },
  { module: "Triage Queue", description: "Access triage queue", roles: ["admin", "superadmin", "nurse", "clinician"] },
  { module: "Doctor Queue", description: "Access doctor consultation queue", roles: ["admin", "superadmin", "clinician"] },
  { module: "Clinical Records", description: "View and manage clinical data", roles: ["admin", "superadmin", "clinician", "nurse"] },
  { module: "Orders", description: "Create and manage medical orders", roles: ["admin", "superadmin", "clinician"] },
  { module: "Doctors", description: "View doctor information and schedules", roles: ["admin", "superadmin", "manager", "clinician"] },
  { module: "Billing", description: "Manage invoices and payments", roles: ["admin", "superadmin", "billing", "manager"] },
  { module: "Reports", description: "View system reports and analytics", roles: ["admin", "superadmin", "manager", "billing"] },
  { module: "Communications", description: "Send notifications and messages", roles: ["admin", "superadmin", "reception", "manager"] },
  { module: "Services", description: "Manage medical services", roles: ["admin", "superadmin"] },
  { module: "Packages", description: "Manage service packages", roles: ["admin", "superadmin"] },
  { module: "Resources", description: "Manage clinics and schedules", roles: ["admin", "superadmin", "manager"] },
  { module: "Configuration", description: "System configuration settings", roles: ["admin", "superadmin"] },
  { module: "Administration", description: "User management and system admin", roles: ["admin", "superadmin", "manager"] },
];

const ROLE_INFO = [
  { 
    role: "admin", 
    label: "Admin", 
    description: "Full system access with administrative privileges",
    color: "bg-red-500"
  },
  { 
    role: "superadmin", 
    label: "Super Admin", 
    description: "Highest level access, can delete users and manage all aspects",
    color: "bg-purple-500"
  },
  { 
    role: "manager", 
    label: "Manager", 
    description: "View analytics, reports, and manage resources",
    color: "bg-blue-500"
  },
  { 
    role: "clinician", 
    label: "Clinician", 
    description: "Clinical workflows, patient care, and medical orders",
    color: "bg-green-500"
  },
  { 
    role: "nurse", 
    label: "Nurse", 
    description: "Triage assessment, patient monitoring, and basic clinical access",
    color: "bg-teal-500"
  },
  { 
    role: "reception", 
    label: "Reception", 
    description: "Patient registration, appointments, and front desk operations",
    color: "bg-orange-500"
  },
  { 
    role: "billing", 
    label: "Billing", 
    description: "Financial operations, invoicing, and payment management",
    color: "bg-yellow-500"
  },
];

export const PermissionsTab = () => {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const getRoleInfo = (roleValue: string) => 
    ROLE_INFO.find(r => r.role === roleValue);

  const hasAccess = (permission: Permission, role: string) => 
    permission.roles.includes(role);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Permission Management
          </h2>
          <p className="text-muted-foreground mt-1">
            View and understand role-based access control across the system
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This is a read-only view of the permission system. Role permissions are defined at the application level 
          and control which modules each user role can access. To modify user roles, use the Users tab.
        </AlertDescription>
      </Alert>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ROLE_INFO.map((roleInfo) => (
          <Card
            key={roleInfo.role}
            className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === roleInfo.role ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedRole(
              selectedRole === roleInfo.role ? null : roleInfo.role
            )}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${roleInfo.color} text-white`}>
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{roleInfo.label}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {roleInfo.description}
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {PERMISSIONS.filter(p => p.roles.includes(roleInfo.role)).length} modules
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Permissions Matrix */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          {selectedRole 
            ? `${getRoleInfo(selectedRole)?.label} Permissions` 
            : "All Permissions Overview"}
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">Module</th>
                <th className="text-left py-3 px-4 font-semibold">Description</th>
                {!selectedRole && (
                  <>
                    {ROLE_INFO.map((roleInfo) => (
                      <th key={roleInfo.role} className="text-center py-3 px-2 font-semibold text-xs">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-6 h-6 rounded ${roleInfo.color}`} />
                          <span>{roleInfo.label}</span>
                        </div>
                      </th>
                    ))}
                  </>
                )}
                {selectedRole && (
                  <th className="text-center py-3 px-4 font-semibold">Access</th>
                )}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((permission, idx) => {
                const hasRoleAccess = selectedRole ? hasAccess(permission, selectedRole) : false;
                const shouldShow = !selectedRole || hasRoleAccess;
                
                if (!shouldShow) return null;

                return (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{permission.module}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {permission.description}
                    </td>
                    {!selectedRole && (
                      <>
                        {ROLE_INFO.map((roleInfo) => (
                          <td key={roleInfo.role} className="text-center py-3 px-2">
                            {hasAccess(permission, roleInfo.role) ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted mx-auto opacity-20" />
                            )}
                          </td>
                        ))}
                      </>
                    )}
                    {selectedRole && (
                      <td className="text-center py-3 px-4">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
