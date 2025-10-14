import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userEmail: string;
  onSuccess: () => void;
}

export const DeleteUserDialog = ({
  open,
  onOpenChange,
  userId,
  userName,
  userEmail,
  onSuccess,
}: DeleteUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.rpc("delete_user", {
        user_id_to_delete: userId,
      });

      if (error) throw error;

      toast({
        title: "User deleted",
        description: `${userName} has been successfully deleted from the system.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting user",
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
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete User Account
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the user account
            and all associated data.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Deleting this user will permanently remove:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>User profile and authentication credentials</li>
              <li>Role assignments and clinic access</li>
              <li>All associated activity records</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border border-destructive/50 p-4 space-y-2">
          <div>
            <p className="font-medium text-sm text-muted-foreground">User Name</p>
            <p className="font-semibold">{userName}</p>
          </div>
          <div>
            <p className="font-medium text-sm text-muted-foreground">Email</p>
            <p className="font-semibold">{userEmail}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
