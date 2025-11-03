import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { PatientQuickSearch } from "@/components/patients/PatientQuickSearch";

interface UserAIAccess {
  id: string;
  user_id: string;
  ai_enabled: boolean;
  daily_limit: number;
  daily_token_limit: number;
  token_balance: number;
  email?: string;
  usage_today?: number;
}

export const AIAccessManagement = () => {
  const [users, setUsers] = useState<UserAIAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newDailyLimit, setNewDailyLimit] = useState(100);
  const [newTokenLimit, setNewTokenLimit] = useState(10000);
  const { toast } = useToast();

  useEffect(() => {
    loadAIAccessUsers();
  }, []);

  const loadAIAccessUsers = async () => {
    setLoading(true);
    
    // Get AI access records
    const { data: accessData, error: accessError } = await supabase
      .from("user_ai_access" as any)
      .select("*");

    if (accessError) {
      toast({
        variant: "destructive",
        title: "Error loading AI access",
        description: accessError.message,
      });
      setLoading(false);
      return;
    }

    // Get usage stats for today
    const { data: usageData } = await supabase
      .from("ai_usage_log" as any)
      .select("user_id")
      .gte("created_at", new Date().toISOString().split('T')[0]);

    // Count usage per user
    const usageCounts: Record<string, number> = {};
    if (usageData) {
      usageData.forEach((log: any) => {
        usageCounts[log.user_id] = (usageCounts[log.user_id] || 0) + 1;
      });
    }

    // Get user emails from user_roles
    const { data: rolesData } = await supabase
      .from("user_roles" as any)
      .select("user_id");

    const userIds = Array.from(new Set(rolesData?.map((r: any) => r.user_id) || []));
    
    // Get emails from auth (this requires admin access)
    const usersWithData = accessData.map((access: any) => ({
      ...access,
      usage_today: usageCounts[access.user_id] || 0,
    }));

    setUsers(usersWithData);
    setLoading(false);
  };

  const handleToggleAccess = async (userId: string, currentState: boolean) => {
    const { error } = await supabase
      .from("user_ai_access" as any)
      .update({ ai_enabled: !currentState })
      .eq("user_id", userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating access",
        description: error.message,
      });
    } else {
      toast({
        title: "AI access updated",
        description: `AI access ${!currentState ? "enabled" : "disabled"} for user`,
      });
      loadAIAccessUsers();
    }
  };

  const handleUpdateLimit = async (userId: string, newLimit: number) => {
    const { error } = await supabase
      .from("user_ai_access" as any)
      .update({ daily_limit: newLimit })
      .eq("user_id", userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating limit",
        description: error.message,
      });
    } else {
      toast({
        title: "Daily limit updated",
        description: `Daily limit set to ${newLimit} requests`,
      });
      loadAIAccessUsers();
    }
  };

  const handleAddUser = async () => {
    if (!selectedUserId) return;

    const { error } = await supabase
      .from("user_ai_access" as any)
      .insert({
        user_id: selectedUserId,
        ai_enabled: true,
        daily_limit: newDailyLimit,
        daily_token_limit: newTokenLimit,
        token_balance: 0,
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error adding user",
        description: error.message,
      });
    } else {
      toast({
        title: "User added",
        description: "AI access granted to user",
      });
      setShowAddUser(false);
      setSelectedUserId("");
      loadAIAccessUsers();
    }
  };

  const handleRemoveUser = async (userId: string) => {
    const { error } = await supabase
      .from("user_ai_access" as any)
      .delete()
      .eq("user_id", userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error removing user",
        description: error.message,
      });
    } else {
      toast({
        title: "User removed",
        description: "AI access revoked",
      });
      loadAIAccessUsers();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Access Management</CardTitle>
          <CardDescription>
            Control which users can access AI features and set daily usage limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowAddUser(!showAddUser)} className="mb-4">
            <UserPlus className="h-4 w-4 mr-2" />
            Grant AI Access
          </Button>

          {showAddUser && (
            <Card className="mb-4">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label>Select User (by User ID)</Label>
                  <Input
                    placeholder="Enter user UUID"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Daily Request Limit</Label>
                    <Input
                      type="number"
                      value={newDailyLimit}
                      onChange={(e) => setNewDailyLimit(parseInt(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div>
                    <Label>Daily Token Limit</Label>
                    <Input
                      type="number"
                      value={newTokenLimit}
                      onChange={(e) => setNewTokenLimit(parseInt(e.target.value))}
                      min={1000}
                      step={1000}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddUser}>Add User</Button>
                  <Button variant="outline" onClick={() => setShowAddUser(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Token Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No users with AI access
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">
                      {user.user_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.ai_enabled ? "default" : "secondary"}>
                        {user.ai_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        Limit: {user.daily_limit}
                        <br />
                        <span className={user.usage_today >= user.daily_limit ? "text-destructive" : "text-muted-foreground"}>
                          Used: {user.usage_today || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        Limit: {(user.daily_token_limit || 0).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-lg font-semibold text-primary">
                        {(user.token_balance || 0).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Switch
                          checked={user.ai_enabled}
                          onCheckedChange={() =>
                            handleToggleAccess(user.user_id, user.ai_enabled)
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(user.user_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
