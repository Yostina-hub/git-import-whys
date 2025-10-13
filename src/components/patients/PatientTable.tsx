import { Patient } from "@/hooks/usePatients";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Receipt, Calendar, UserCheck, RotateCcw, History, TrendingUp } from "lucide-react";
import { AddToQueueDialog } from "./AddToQueueDialog";

interface PatientTableProps {
  patients: Patient[];
  registrationFee: number;
  onViewPatient: (patient: Patient) => void;
  onViewInvoices: (patientId: string, invoiceId: string | undefined, patientName: string) => void;
  onViewAppointments: (patientId: string, patientName: string) => void;
  onRefresh: () => void;
}

export const PatientTable = ({
  patients,
  registrationFee,
  onViewPatient,
  onViewInvoices,
  onViewAppointments,
  onRefresh,
}: PatientTableProps) => {
  const getStatusBadge = (status?: string) => {
    if (!status || status === "pending" || status === "issued" || status === "draft") {
      return <Badge variant="destructive">Unpaid</Badge>;
    } else if (status === "paid") {
      return <Badge variant="default" className="bg-green-600">Paid</Badge>;
    } else if (status === "partial") {
      return <Badge variant="secondary">Partial</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">MRN</TableHead>
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Visit History</TableHead>
            <TableHead className="font-semibold">Gender</TableHead>
            <TableHead className="font-semibold">DOB</TableHead>
            <TableHead className="font-semibold">Phone</TableHead>
            <TableHead className="font-semibold">Queue Status</TableHead>
            <TableHead className="font-semibold">Payment Status</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-mono font-medium text-primary">{patient.mrn}</TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span>{patient.first_name} {patient.middle_name} {patient.last_name}</span>
                  {patient.is_returning && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Returning
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                    <TrendingUp className="h-3 w-3" />
                    {patient.visit_count || 0} visit{(patient.visit_count || 0) !== 1 ? 's' : ''}
                  </div>
                  {patient.last_visit_date && (
                    <div className="text-xs text-muted-foreground">
                      Last: {new Date(patient.last_visit_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {patient.sex_at_birth}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(patient.date_of_birth).toLocaleDateString()}
              </TableCell>
              <TableCell className="font-medium">{patient.phone_mobile}</TableCell>
              <TableCell>
                {patient.queue_status ? (
                  <div className="flex items-center gap-2">
                    <Badge variant={patient.queue_status === "waiting" ? "default" : "secondary"}>
                      {patient.queue_token}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">
                      {patient.queue_status}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Not in queue</span>
                )}
              </TableCell>
              <TableCell>
                {getStatusBadge(patient.registration_invoice_status)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8">
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-popover">
                    <DropdownMenuItem 
                      onClick={() => onViewPatient(patient)}
                      className="cursor-pointer"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onViewInvoices(
                        patient.id, 
                        patient.registration_invoice_id,
                        `${patient.first_name} ${patient.last_name}`
                      )}
                      className="cursor-pointer"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Invoices & Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onViewAppointments(patient.id, `${patient.first_name} ${patient.last_name}`)}
                      className="cursor-pointer"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Appointments
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <AddToQueueDialog
                        patientId={patient.id}
                        patientName={`${patient.first_name} ${patient.last_name}`}
                        isReturning={patient.is_returning}
                        onSuccess={onRefresh}
                      />
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onViewPatient(patient)}
                      className="cursor-pointer"
                    >
                      <History className="h-4 w-4 mr-2" />
                      Patient History
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
