import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Phone, Mail, MapPin, Heart } from "lucide-react";

interface PatientInfoCardProps {
  patient: any;
  age: number;
}

export const PatientInfoCard = ({ patient, age }: PatientInfoCardProps) => {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {patient.first_name} {patient.middle_name} {patient.last_name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono">
                    MRN: {patient.mrn}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-primary to-blue-600 text-white border-0">
                    {age} years old
                  </Badge>
                  <Badge variant="secondary">
                    {patient.gender_identity || patient.sex_at_birth || "Not specified"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            {patient.date_of_birth && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-medium">
                    {new Date(patient.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {patient.phone_mobile && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mobile</p>
                  <p className="text-sm font-medium">{patient.phone_mobile}</p>
                </div>
              </div>
            )}

            {patient.email && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate">{patient.email}</p>
                </div>
              </div>
            )}

            {(patient.city || patient.country) && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">
                    {[patient.city, patient.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            )}

            {patient.emergency_contact_name && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Heart className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Emergency Contact</p>
                  <p className="text-sm font-medium">
                    {patient.emergency_contact_name}
                    {patient.emergency_contact_phone && ` • ${patient.emergency_contact_phone}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
