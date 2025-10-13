import { useState } from "react";
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
import { Eye, Receipt, Calendar, UserCheck, RotateCcw, History, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { AddToQueueDialog } from "./AddToQueueDialog";

interface PatientTableProps {
  patients: Patient[];
  registrationFee: number;
  onViewPatient: (patient: Patient) => void;
  onViewInvoices: (patientId: string, invoiceId: string | undefined, patientName: string) => void;
  onViewAppointments: (patientId: string, patientName: string) => void;
  onRefresh: () => void;
}

type SortKey = 'mrn' | 'name' | 'visit_count' | 'sex_at_birth' | 'date_of_birth' | 'phone_mobile';
type SortOrder = 'asc' | 'desc' | null;

export const PatientTable = ({
  patients,
  registrationFee,
  onViewPatient,
  onViewInvoices,
  onViewAppointments,
  onRefresh,
}: PatientTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Cycle through: asc -> desc -> null
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortKey(null);
        setSortOrder(null);
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-40" />;
    }
    if (sortOrder === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />;
    }
    if (sortOrder === 'desc') {
      return <ArrowDown className="h-4 w-4 ml-1" />;
    }
    return <ArrowUpDown className="h-4 w-4 ml-1 opacity-40" />;
  };

  const sortedPatients = [...patients].sort((a, b) => {
    if (!sortKey || !sortOrder) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortKey) {
      case 'mrn':
        aValue = a.mrn;
        bValue = b.mrn;
        break;
      case 'name':
        aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
        bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
        break;
      case 'visit_count':
        aValue = a.visit_count || 0;
        bValue = b.visit_count || 0;
        break;
      case 'sex_at_birth':
        aValue = a.sex_at_birth || '';
        bValue = b.sex_at_birth || '';
        break;
      case 'date_of_birth':
        aValue = new Date(a.date_of_birth).getTime();
        bValue = new Date(b.date_of_birth).getTime();
        break;
      case 'phone_mobile':
        aValue = a.phone_mobile;
        bValue = b.phone_mobile;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
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
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('mrn')}
              >
                <span className="flex items-center">
                  MRN
                  {getSortIcon('mrn')}
                </span>
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('name')}
              >
                <span className="flex items-center">
                  Name
                  {getSortIcon('name')}
                </span>
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('visit_count')}
              >
                <span className="flex items-center">
                  Visit History
                  {getSortIcon('visit_count')}
                </span>
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('sex_at_birth')}
              >
                <span className="flex items-center">
                  Gender
                  {getSortIcon('sex_at_birth')}
                </span>
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('date_of_birth')}
              >
                <span className="flex items-center">
                  DOB
                  {getSortIcon('date_of_birth')}
                </span>
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('phone_mobile')}
              >
                <span className="flex items-center">
                  Phone
                  {getSortIcon('phone_mobile')}
                </span>
              </Button>
            </TableHead>
            <TableHead className="font-semibold">Appointment</TableHead>
            <TableHead className="font-semibold">Queue Status</TableHead>
            <TableHead className="font-semibold">Payment Status</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPatients.map((patient) => (
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
                {patient.appointment_status ? (
                  <div className="space-y-1">
                    <Badge 
                      variant={
                        patient.appointment_status === "booked" ? "default" : 
                        patient.appointment_status === "confirmed" ? "default" : 
                        patient.appointment_status === "completed" ? "secondary" : 
                        "outline"
                      }
                      className={
                        patient.appointment_status === "booked" ? "bg-blue-600" :
                        patient.appointment_status === "confirmed" ? "bg-green-600" :
                        ""
                      }
                    >
                      {patient.appointment_status}
                    </Badge>
                    {patient.appointment_date && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(patient.appointment_date).toLocaleDateString()} at{" "}
                        {new Date(patient.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">No appointment</span>
                )}
              </TableCell>
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
