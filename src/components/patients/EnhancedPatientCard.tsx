import { Patient } from "@/hooks/usePatients";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Phone,
  Calendar,
  MapPin,
  MoreVertical,
  Eye,
  Receipt,
  CalendarDays,
  ClipboardList,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";

interface EnhancedPatientCardProps {
  patient: Patient;
  onViewPatient: (patient: Patient) => void;
  onViewInvoices: (patientId: string, invoiceId: string | undefined, patientName: string) => void;
  onViewAppointments: (patientId: string, patientName: string) => void;
}

export const EnhancedPatientCard = ({
  patient,
  onViewPatient,
  onViewInvoices,
  onViewAppointments,
}: EnhancedPatientCardProps) => {
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      paid: { variant: "default", label: "Paid" },
      partial: { variant: "secondary", label: "Partial" },
      pending: { variant: "outline", label: "Pending" },
      draft: { variant: "outline", label: "Draft" },
      booked: { variant: "default", label: "Booked" },
      confirmed: { variant: "default", label: "Confirmed" },
      waiting: { variant: "secondary", label: "Waiting" },
      in_consultation: { variant: "default", label: "In Progress" },
    };

    const config = statusConfig[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const patientName = `${patient.first_name} ${patient.last_name}`;
  const age = patient.date_of_birth 
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : null;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-card/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{patientName}</h3>
              <p className="text-sm text-muted-foreground">MRN: {patient.mrn}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onViewPatient(patient)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onViewInvoices(patient.id, patient.registration_invoice_id, patientName)}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Invoices & Billing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewAppointments(patient.id, patientName)}>
                <CalendarDays className="h-4 w-4 mr-2" />
                Appointments
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {patient.sex_at_birth || "N/A"} • {age ? `${age} years` : "Age N/A"}
            </span>
          </div>

          {patient.phone_mobile && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{patient.phone_mobile}</span>
            </div>
          )}

          {patient.date_of_birth && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(patient.date_of_birth), "MMM dd, yyyy")}</span>
            </div>
          )}

          {patient.email && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{patient.email}</span>
            </div>
          )}

          <div className="pt-3 border-t flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {patient.appointment_status && getStatusBadge(patient.appointment_status)}
              {patient.queue_status && getStatusBadge(patient.queue_status)}
              {patient.registration_invoice_status && getStatusBadge(patient.registration_invoice_status)}
            </div>
            
            {patient.visit_count !== undefined && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <ClipboardList className="h-4 w-4" />
                <span>{patient.visit_count} visits</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
