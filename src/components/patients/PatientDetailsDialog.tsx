import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Activity,
  Heart,
  AlertCircle,
  TrendingUp,
  FileText,
  Clock,
  DollarSign,
  Stethoscope,
  ShieldAlert,
  Sparkles,
  Edit
} from "lucide-react";
import { Patient } from "@/hooks/usePatients";
import { useToast } from "@/hooks/use-toast";
import { EditPatientDialog } from "./EditPatientDialog";

interface PatientDetailsDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientDetailsDialog({ patient, open, onOpenChange }: PatientDetailsDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullPatientData, setFullPatientData] = useState<any>(null);
  const [stats, setStats] = useState({
    totalVisits: 0,
    totalSpent: 0,
    pendingBalance: 0,
    lastVisit: null as string | null,
    upcomingAppointments: 0,
    allergiesCount: 0,
    medicationsCount: 0,
    notesCount: 0
  });
  const [timeline, setTimeline] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    if (open && patient) {
      loadPatientDetails();
    }
  }, [open, patient?.id]);

  const loadPatientDetails = async () => {
    if (!patient) return;
    setLoading(true);

    try {
      // Fetch comprehensive patient data in parallel
      const [
        patientRes,
        appointmentsRes,
        visitsRes,
        invoicesRes,
        allergiesRes,
        medicationsRes,
        notesRes,
        vitalsRes
      ] = await Promise.all([
        supabase.from("patients").select("*").eq("id", patient.id).single(),
        supabase.from("appointments").select("*").eq("patient_id", patient.id).order("scheduled_start", { ascending: false }),
        supabase.from("visits").select("*").eq("patient_id", patient.id).order("opened_at", { ascending: false }),
        supabase.from("invoices").select("*").eq("patient_id", patient.id),
        supabase.from("allergies").select("*").eq("patient_id", patient.id),
        supabase.from("medications").select("*").eq("patient_id", patient.id),
        supabase.from("emr_notes").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("vital_signs").select("*").eq("patient_id", patient.id).order("recorded_at", { ascending: false }).limit(5)
      ]);

      if (patientRes.data) {
        setFullPatientData({
          ...patientRes.data,
          appointments: appointmentsRes.data || [],
          visits: visitsRes.data || [],
          invoices: invoicesRes.data || [],
          allergies: allergiesRes.data || [],
          medications: medicationsRes.data || [],
          notes: notesRes.data || [],
          vitals: vitalsRes.data || []
        });

        // Calculate statistics
        const totalVisits =
          (appointmentsRes.data?.length || 0) +
          (visitsRes.data?.length || 0) +
          (notesRes.data?.length || 0) +
          (invoicesRes.data?.length || 0);
        const totalSpent = invoicesRes.data?.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0) || 0;
        const pendingBalance = invoicesRes.data
          ?.filter(inv => inv.status !== 'paid')
          .reduce((sum, inv) => sum + (Number(inv.balance_due) || 0), 0) || 0;

        // Get most recent visit date
        const allDates = [
          ...(appointmentsRes.data?.map(a => a.scheduled_start) || []),
          ...(visitsRes.data?.map(v => v.opened_at) || []),
          ...(notesRes.data?.map(n => n.created_at) || []),
          ...(invoicesRes.data?.map(i => i.created_at) || []),
        ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        const upcomingAppointments = appointmentsRes.data?.filter(
          a => new Date(a.scheduled_start) > new Date()
        ).length || 0;

        setStats({
          totalVisits,
          totalSpent,
          pendingBalance,
          lastVisit: allDates[0] || null,
          upcomingAppointments,
          allergiesCount: allergiesRes.data?.length || 0,
          medicationsCount: medicationsRes.data?.length || 0,
          notesCount: notesRes.data?.length || 0
        });

        // Build timeline
        buildTimeline(appointmentsRes.data, visitsRes.data, invoicesRes.data);

        // Generate AI insights
        generateAIInsights(patientRes.data, stats, allergiesRes.data, medicationsRes.data);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading patient details",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const buildTimeline = (appointments: any[], visits: any[], invoices: any[]) => {
    const events = [
      ...appointments.map(a => ({
        type: 'appointment',
        date: a.scheduled_start,
        title: 'Appointment',
        status: a.status,
        description: a.reason_for_visit || 'Scheduled visit'
      })),
      ...visits.map(v => ({
        type: 'visit',
        date: v.opened_at,
        title: 'Visit',
        state: v.state,
        description: v.visit_type || 'Walk-in'
      })),
      ...invoices.map(i => ({
        type: 'invoice',
        date: i.created_at,
        title: 'Invoice',
        status: i.status,
        amount: i.total_amount,
        description: `$${i.total_amount}`
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setTimeline(events.slice(0, 20)); // Show last 20 events
  };

  const generateAIInsights = async (patientData: any, stats: any, allergies: any[], medications: any[]) => {
    // AI-powered insights based on patient data
    const insights: string[] = [];

    if (stats.totalVisits > 5) {
      insights.push("Frequent visitor - Consider loyalty benefits");
    }
    
    if (stats.pendingBalance > 0) {
      insights.push(`Outstanding balance: $${stats.pendingBalance.toFixed(2)}`);
    }

    if (allergies?.length > 0) {
      insights.push(`⚠️ ${allergies.length} known allergies - Review before prescribing`);
    }

    if (medications?.length > 3) {
      insights.push(`Currently on ${medications.length} medications - Check for interactions`);
    }

    const age = new Date().getFullYear() - new Date(patientData.date_of_birth).getFullYear();
    if (age > 60) {
      insights.push("Senior patient - Consider age-appropriate care protocols");
    }

    setAiInsights(insights.join(" • "));
  };

  if (!patient || !open) return null;

  const getInitials = () => {
    return `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-2xl font-bold">
                {patient.first_name} {patient.middle_name} {patient.last_name}
              </div>
              <div className="text-sm text-muted-foreground font-mono">
                MRN: {patient.mrn}
                {fullPatientData?.sonik_id && (
                  <span className="ml-4">SONIK ID: {fullPatientData.sonik_id}</span>
                )}
              </div>
            </div>
            {patient.is_returning && (
              <Badge className="bg-green-100 text-green-700 border-green-300">
                Returning Patient
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
              className="ml-2"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Patient
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading patient details...</div>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            {/* AI Insights Banner */}
            {aiInsights && (
              <Card className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-sm text-blue-900 mb-1">Smart Insights</div>
                      <div className="text-sm text-blue-700">{aiInsights}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Key Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Visits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-2xl font-bold">{stats.totalVisits}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-orange-600" />
                    <span className="text-2xl font-bold text-orange-600">
                      ${stats.pendingBalance.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span className="text-2xl font-bold">{stats.upcomingAppointments}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Information Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="clinical">Clinical</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Date of Birth</div>
                      <div className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(patient.date_of_birth).toLocaleDateString()}
                        <span className="text-sm text-muted-foreground">
                          ({new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years)
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Gender</div>
                      <div className="font-medium capitalize">{patient.sex_at_birth}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {patient.phone_mobile}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {patient.email || "Not provided"}
                      </div>
                    </div>
                    {fullPatientData?.address_line1 && (
                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">Address</div>
                        <div className="font-medium flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-1" />
                          <div>
                            {fullPatientData.address_line1}
                            {fullPatientData.address_line2 && <div>{fullPatientData.address_line2}</div>}
                            <div>
                              {fullPatientData.city}, {fullPatientData.region} {fullPatientData.postal_code}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {stats.lastVisit && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Last Visit</div>
                          <div className="font-semibold text-lg">
                            {new Date(stats.lastVisit).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                          {stats.totalVisits} total visits
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="clinical" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-red-600" />
                      Allergies ({stats.allergiesCount})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fullPatientData?.allergies?.length > 0 ? (
                      <div className="space-y-2">
                        {fullPatientData.allergies.map((allergy: any) => (
                          <div key={allergy.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <div>
                              <div className="font-medium">{allergy.allergen}</div>
                              <div className="text-sm text-muted-foreground">{allergy.reaction}</div>
                            </div>
                            <Badge variant="destructive">{allergy.severity}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No known allergies</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-blue-600" />
                      Current Medications ({stats.medicationsCount})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fullPatientData?.medications?.length > 0 ? (
                      <div className="space-y-2">
                        {fullPatientData.medications.slice(0, 5).map((med: any) => (
                          <div key={med.id} className="p-2 border rounded">
                            <div className="font-medium">{med.medication_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {med.dosage} - {med.frequency}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No current medications</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      Latest Vitals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fullPatientData?.vitals?.[0] ? (
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Blood Pressure</div>
                          <div className="font-semibold">
                            {fullPatientData.vitals[0].blood_pressure_systolic}/
                            {fullPatientData.vitals[0].blood_pressure_diastolic}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Heart Rate</div>
                          <div className="font-semibold">{fullPatientData.vitals[0].heart_rate} bpm</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Temperature</div>
                          <div className="font-semibold">{fullPatientData.vitals[0].temperature}°C</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No vitals recorded</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Patient Journey
                    </CardTitle>
                    <CardDescription>Complete history of interactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {timeline.map((event, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              event.type === 'appointment' ? 'bg-blue-600' :
                              event.type === 'visit' ? 'bg-green-600' : 'bg-orange-600'
                            }`} />
                            {idx < timeline.length - 1 && (
                              <div className="w-0.5 h-8 bg-border" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{event.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(event.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">{event.description}</div>
                            {event.status && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {event.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Billing Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-green-50 rounded">
                          <div className="text-2xl font-bold text-green-700">
                            ${stats.totalSpent.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Spent</div>
                        </div>
                        <div className="p-4 bg-orange-50 rounded">
                          <div className="text-2xl font-bold text-orange-700">
                            ${stats.pendingBalance.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">Pending</div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded">
                          <div className="text-2xl font-bold text-blue-700">
                            {fullPatientData?.invoices?.length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Invoices</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="font-semibold">Recent Invoices</div>
                        {fullPatientData?.invoices?.slice(0, 5).map((invoice: any) => (
                          <div key={invoice.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <div className="text-sm">
                                {new Date(invoice.created_at).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Invoice #{invoice.id.slice(0, 8)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">${invoice.total_amount}</div>
                              <Badge variant={
                                invoice.status === 'paid' ? 'default' :
                                invoice.status === 'partial' ? 'secondary' : 'destructive'
                              }>
                                {invoice.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        )}
      </DialogContent>

      {patient && (
        <EditPatientDialog
          patient={fullPatientData || patient}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={loadPatientDetails}
        />
      )}
    </Dialog>
  );
}
