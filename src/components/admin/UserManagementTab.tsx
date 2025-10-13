import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Edit, UserPlus, RefreshCw } from "lucide-react";
import { ManageRolesDialog } from "./ManageRolesDialog";
import { ManageClinicAccessDialog } from "./ManageClinicAccessDialog";
import { ClinicAccessBadge } from "./ClinicAccessBadge";
import { CreateUserDialog } from "./CreateUserDialog";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_mobile: string | null;
  status: string;
  created_at: string;
  roles: string[];
}

export const UserManagementTab = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [clinicAccessDialogOpen, setClinicAccessDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("list_all_users_with_roles" as any);

      if (error) throw error;
      
      setUsers(data as any || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading users",
        description: error.message,
      });
    }
    setLoading(false);
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-500",
      manager: "bg-purple-500",
      clinician: "bg-blue-500",
      nurse: "bg-teal-500",
      reception: "bg-green-500",
      billing: "bg-yellow-500",
    };
    return colors[role] || "bg-gray-500";
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-green-500" : "bg-gray-500";
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">User Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage staff accounts and role assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setCreateUserDialogOpen(true)}
            size="sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Clinic Access</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <Badge key={role} className={getRoleColor(role)}>
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No roles</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(user.status)}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(user.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <ClinicAccessBadge userId={user.id} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(user);
                        setRolesDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Roles
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(user);
                        setClinicAccessDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Clinics
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No users found
        </div>
      )}

      <CreateUserDialog
        open={createUserDialogOpen}
        onOpenChange={setCreateUserDialogOpen}
        onSuccess={() => {
          loadUsers();
          setCreateUserDialogOpen(false);
        }}
      />

      {selectedUser && (
        <>
          <ManageRolesDialog
            user={selectedUser}
            open={rolesDialogOpen}
            onOpenChange={setRolesDialogOpen}
            onSuccess={() => {
              loadUsers();
              setRolesDialogOpen(false);
            }}
          />
          <ManageClinicAccessDialog
            open={clinicAccessDialogOpen}
            onOpenChange={setClinicAccessDialogOpen}
            userId={selectedUser.id}
            userName={`${selectedUser.first_name} ${selectedUser.last_name}`}
          />
        </>
      )}
    </div>
  );
};
