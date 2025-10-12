import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ManageServicePointDialog } from "./ManageServicePointDialog";
import { Building, MapPin, CheckCircle, XCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const ServicePointsTab = () => {
  const { toast } = useToast();
  const [servicePoints, setServicePoints] = useState<any[]>([
    {
      id: "1",
      name: "Counter 1",
      code: "C1",
      queue_name: "Registration Queue",
      station_number: "1",
      location_description: "Ground Floor, Main Reception",
      is_active: true,
      supports_walkins: true,
      supports_appointments: true,
      current_staff: "John Doe",
    },
    {
      id: "2",
      name: "Counter 2",
      code: "C2",
      queue_name: "Registration Queue",
      station_number: "2",
      location_description: "Ground Floor, Main Reception",
      is_active: true,
      supports_walkins: true,
      supports_appointments: false,
      current_staff: null,
    },
    {
      id: "3",
      name: "Consultation Room A",
      code: "RM-A",
      queue_name: "Consultation Queue",
      station_number: "A-1",
      location_description: "First Floor, East Wing",
      is_active: true,
      supports_walkins: false,
      supports_appointments: true,
      current_staff: "Dr. Sarah Smith",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const loadServicePoints = async () => {
    setLoading(true);
    // In production, load from database
    // For now, using mock data
    setLoading(false);
  };

  useEffect(() => {
    loadServicePoints();
  }, []);

  const toggleActive = async (id: string) => {
    setServicePoints(servicePoints.map(sp =>
      sp.id === id ? { ...sp, is_active: !sp.is_active } : sp
    ));
    toast({
      title: "Status updated",
      description: "Service point status has been updated",
    });
  };

  const getStatusColor = (isActive: boolean, hasStaff: boolean) => {
    if (!isActive) return "bg-gray-500";
    if (hasStaff) return "bg-green-500";
    return "bg-yellow-500";
  };

  const getStatusText = (isActive: boolean, hasStaff: boolean) => {
    if (!isActive) return "Inactive";
    if (hasStaff) return "Active - Staffed";
    return "Active - Unstaffed";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service Points & Stations</CardTitle>
              <CardDescription>
                Manage physical service points and their queue assignments
              </CardDescription>
            </div>
            <ManageServicePointDialog onSuccess={loadServicePoints} />
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading service points...
            </div>
          )}

          {!loading && servicePoints.length === 0 && (
            <div className="text-center py-8">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No service points configured yet.</p>
            </div>
          )}

          {!loading && servicePoints.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Queue</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Capabilities</TableHead>
                  <TableHead>Current Staff</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicePoints.map((sp) => (
                  <TableRow key={sp.id}>
                    <TableCell className="font-mono font-bold">{sp.code}</TableCell>
                    <TableCell className="font-medium">{sp.name}</TableCell>
                    <TableCell>{sp.queue_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm">{sp.location_description}</div>
                          {sp.station_number && (
                            <div className="text-xs text-muted-foreground">
                              Station: {sp.station_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {sp.supports_walkins && (
                          <Badge variant="outline" className="text-xs">
                            Walk-ins
                          </Badge>
                        )}
                        {sp.supports_appointments && (
                          <Badge variant="outline" className="text-xs">
                            Appointments
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {sp.current_staff ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{sp.current_staff}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(sp.is_active, !!sp.current_staff)}>
                        {getStatusText(sp.is_active, !!sp.current_staff)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={sp.is_active}
                        onCheckedChange={() => toggleActive(sp.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <ManageServicePointDialog
                        servicePoint={sp}
                        onSuccess={loadServicePoints}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Point Statistics</CardTitle>
          <CardDescription>Real-time overview of service point utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{servicePoints.length}</div>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {servicePoints.filter(sp => sp.is_active && sp.current_staff).length}
                </div>
                <p className="text-xs text-muted-foreground">Active & Staffed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">
                  {servicePoints.filter(sp => sp.is_active && !sp.current_staff).length}
                </div>
                <p className="text-xs text-muted-foreground">Active & Unstaffed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-600">
                  {servicePoints.filter(sp => !sp.is_active).length}
                </div>
                <p className="text-xs text-muted-foreground">Inactive</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
