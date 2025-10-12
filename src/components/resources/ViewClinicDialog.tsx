import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Mail, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ViewClinicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinic: any | null;
}

export function ViewClinicDialog({ open, onOpenChange, clinic }: ViewClinicDialogProps) {
  if (!clinic) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Clinic Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">{clinic.name}</h3>
              <Badge variant={clinic.is_active ? "default" : "secondary"} className="gap-1">
                {clinic.is_active ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    Inactive
                  </>
                )}
              </Badge>
            </div>
            <Badge variant="outline" className="text-sm">
              Code: {clinic.code}
            </Badge>
          </div>

          <Separator />

          {/* Address Section */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </h4>
            <div className="ml-6 space-y-1 text-sm">
              {clinic.address_line1 && <p>{clinic.address_line1}</p>}
              {clinic.address_line2 && <p>{clinic.address_line2}</p>}
              <div className="flex gap-2 flex-wrap">
                {clinic.city && <span>{clinic.city}</span>}
                {clinic.region && <span>• {clinic.region}</span>}
                {clinic.postal_code && <span>• {clinic.postal_code}</span>}
              </div>
              {clinic.country && <p className="font-medium">{clinic.country}</p>}
              {!clinic.address_line1 && !clinic.city && !clinic.country && (
                <p className="text-muted-foreground italic">No address provided</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Contact Section */}
          <div className="space-y-3">
            <h4 className="font-semibold">Contact Information</h4>
            <div className="ml-6 space-y-2">
              {clinic.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{clinic.phone}</span>
                </div>
              )}
              {clinic.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{clinic.email}</span>
                </div>
              )}
              {!clinic.phone && !clinic.email && (
                <p className="text-sm text-muted-foreground italic">No contact information provided</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Timezone Section */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timezone
            </h4>
            <div className="ml-6">
              <Badge variant="secondary">{clinic.timezone || "UTC"}</Badge>
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p>Created: {new Date(clinic.created_at).toLocaleString()}</p>
            <p>Last Updated: {new Date(clinic.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
