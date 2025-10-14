import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, UserCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  phone_mobile: string;
  status: string;
}

interface DoctorsListProps {
  doctors: Doctor[];
  isLoading: boolean;
  onSelectDoctor: (id: string) => void;
}

export const DoctorsList = ({ doctors, isLoading, onSelectDoctor }: DoctorsListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!doctors.length) {
    return (
      <div className="text-center py-12">
        <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No doctors found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {doctors.map((doctor) => (
          <TableRow key={doctor.id}>
            <TableCell className="font-medium">
              {doctor.first_name} {doctor.last_name}
            </TableCell>
            <TableCell>{doctor.phone_mobile || 'N/A'}</TableCell>
            <TableCell>
              <Badge variant={doctor.status === 'active' ? 'default' : 'secondary'}>
                {doctor.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectDoctor(doctor.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
