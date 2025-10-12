import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, Clock, Camera, Mic, StopCircle } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConsentsTabProps {
  patientId: string | null;
  autoOpen?: boolean;
  onAutoOpenChange?: (open: boolean) => void;
}

const ConsentsTab = ({ patientId, autoOpen = false, onAutoOpenChange }: ConsentsTabProps) => {
  const { toast } = useToast();
  const [consents, setConsents] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(autoOpen);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: patientId || "",
    consent_type: "general_treatment" as const,
    signed_by: "patient",
  });
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [voiceData, setVoiceData] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    if (autoOpen) {
      setIsDialogOpen(true);
      onAutoOpenChange?.(false);
    }
  }, [autoOpen]);

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    const [consentsRes, patientsRes] = await Promise.all([
      supabase
        .from("consent_forms")
        .select("*, patients(first_name, last_name, mrn)")
        .order("created_at", { ascending: false })
        .then(res => patientId ? { ...res, data: res.data?.filter(c => c.patient_id === patientId) } : res),
      supabase.from("patients").select("*").order("first_name"),
    ]);

    if (consentsRes.data) setConsents(consentsRes.data);
    if (patientsRes.data) setPatients(patientsRes.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      toast({
        variant: "destructive",
        title: "Signature required",
        description: "Please provide a signature to consent.",
      });
      return;
    }

    if (!photoData) {
      toast({
        variant: "destructive",
        title: "Photo required",
        description: "Please take a photo to verify identity.",
      });
      return;
    }

    setLoading(true);

    const signatureData = signaturePadRef.current.toDataURL();

    const { error } = await supabase.from("consent_forms").insert([
      {
        ...formData,
        signed_at: new Date().toISOString(),
        signature_blob: signatureData,
        content_html: JSON.stringify({
          photo: photoData,
          voice: voiceData
        })
      },
    ]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating consent",
        description: error.message,
      });
    } else {
      toast({
        title: "Consent recorded",
        description: "The consent form has been saved successfully.",
      });
      setIsDialogOpen(false);
      loadData();
      signaturePadRef.current?.clear();
      setPhotoData(null);
      setVoiceData(null);
      setFormData({
        patient_id: patientId || "",
        consent_type: "general_treatment",
        signed_by: "patient",
      });
    }
    setLoading(false);
  };

  const clearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Required for iOS Safari to start playback
        (videoRef.current as HTMLVideoElement).muted = true;
        await videoRef.current.play().catch(() => {});
        setIsCameraOpen(true);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const photo = canvasRef.current.toDataURL('image/jpeg');
        setPhotoData(photo);
        stopCamera();
      }
    }
  };

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOpen(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setVoiceData(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const getConsentContent = (type: string) => {
    const contents: Record<string, { title: string; content: string }> = {
      general_treatment: {
        title: "General Treatment Consent",
        content: `I hereby consent to receive medical treatment and procedures as deemed necessary by the healthcare provider. I understand that:

• The healthcare provider has explained my condition and the proposed treatment
• I have been informed of the risks, benefits, and alternatives
• I have had the opportunity to ask questions and receive answers
• I understand that medicine is not an exact science and that no guarantees have been made
• I consent to the administration of medications and procedures as necessary
• I understand that I may withdraw this consent at any time

By signing below, I acknowledge that I have read and understood this consent form and agree to the treatment.`,
      },
      data_privacy: {
        title: "Data Privacy Consent",
        content: `I consent to the collection, storage, and processing of my personal health information in accordance with applicable data protection laws. I understand that:

• My data will be kept confidential and secure
• My information may be shared with other healthcare providers involved in my care
• My data will be used for treatment, billing, and healthcare operations
• I have the right to access and request corrections to my data
• I can withdraw this consent at any time in writing

By signing below, I acknowledge that I have read and understood this privacy consent.`,
      },
      photography: {
        title: "Photography and Imaging Consent",
        content: `I consent to medical photography and imaging for:

• Documentation of my medical condition and treatment
• Medical education and training purposes
• Research and quality improvement (with identifying information removed)

I understand that:
• All images will be stored securely and confidentially
• Images will only be used for the purposes stated above
• I can withdraw this consent at any time
• My identity will be protected in any educational or research use

By signing below, I acknowledge that I have read and understood this consent.`,
      },
      telehealth: {
        title: "Telehealth Services Consent",
        content: `I consent to receive healthcare services through telehealth (virtual consultations). I understand that:

• Telehealth involves the use of electronic communications for healthcare delivery
• The same standards of confidentiality apply as in-person visits
• Technical difficulties may occur during sessions
• Not all medical conditions can be adequately assessed via telehealth
• I may need to attend in-person if required by my healthcare provider
• I am responsible for providing a private, quiet space for consultations

By signing below, I acknowledge that I have read and understood this consent.`,
      },
      package_treatment: {
        title: "Treatment Package Consent",
        content: `I consent to participate in the treatment package program. I understand that:

• The package includes specific services as outlined in my treatment plan
• Payment is required upfront or according to the agreed payment schedule
• Services must be used within the validity period
• Unused services may not be refunded unless specified in the package terms
• I am committed to attending scheduled appointments
• The treatment plan may be adjusted based on my clinical progress

By signing below, I acknowledge that I have read and understood this consent.`,
      },
      research: {
        title: "Research Participation Consent",
        content: `I consent to participate in the research study. I understand that:

• My participation is voluntary
• I can withdraw from the study at any time without affecting my care
• My data will be anonymized for research purposes
• The study has been approved by an ethics committee
• There may be risks and benefits associated with participation
• I will be informed of any significant new findings
• My personal information will be kept confidential

By signing below, I acknowledge that I have read and understood this consent.`,
      },
    };
    return contents[type] || contents.general_treatment;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Consent Forms</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Consent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Consent Form</DialogTitle>
                <DialogDescription>
                  Review the consent details below, capture a photo, optionally record voice consent, and sign to proceed.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto pr-2">
                <form onSubmit={handleSubmit} className="space-y-4 pb-4">
                {!patientId && (
                  <div className="space-y-2">
                    <Label>Patient *</Label>
                    <Select value={formData.patient_id} onValueChange={(value) => setFormData({ ...formData, patient_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.mrn} - {p.first_name} {p.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Consent Type *</Label>
                  <Select value={formData.consent_type} onValueChange={(value: any) => setFormData({ ...formData, consent_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_treatment">General Treatment</SelectItem>
                      <SelectItem value="data_privacy">Data Privacy</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="telehealth">Telehealth</SelectItem>
                      <SelectItem value="package_treatment">Package Treatment</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Signed By *</Label>
                  <Select value={formData.signed_by} onValueChange={(value) => setFormData({ ...formData, signed_by: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-lg font-semibold">
                    {getConsentContent(formData.consent_type).title}
                  </Label>
                  <ScrollArea className="h-64 rounded-md border p-4 bg-muted/30">
                    <div className="whitespace-pre-wrap text-sm">
                      {getConsentContent(formData.consent_type).content}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <Label>Photo Verification *</Label>
                  {!photoData ? (
                    <div className="space-y-3">
                      {!isCameraOpen ? (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Button type="button" variant="outline" onClick={startCamera}>
                            <Camera className="h-4 w-4 mr-2" />
                            Take Photo
                          </Button>
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              capture="user"
                              onChange={handlePhotoFile}
                              className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border file:bg-background file:text-foreground"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <video ref={videoRef} autoPlay playsInline muted onLoadedMetadata={() => videoRef.current?.play()} className="w-full rounded-md border" />
                          <canvas ref={canvasRef} className="hidden" />
                          <div className="flex gap-2">
                            <Button type="button" onClick={capturePhoto} className="flex-1">
                              Capture
                            </Button>
                            <Button type="button" variant="outline" onClick={stopCamera}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <img src={photoData} alt="Captured" className="w-full rounded-md border" />
                      <Button type="button" variant="outline" size="sm" onClick={() => setPhotoData(null)}>
                        Retake Photo
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Voice Consent (Optional)</Label>
                  {!voiceData ? (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? (
                        <>
                          <StopCircle className="h-4 w-4 mr-2 animate-pulse text-red-500" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          Record Voice Consent
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <audio src={voiceData} controls className="w-full" />
                      <Button type="button" variant="outline" size="sm" onClick={() => setVoiceData(null)}>
                        Re-record
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Signature *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
                      Clear
                    </Button>
                  </div>
                  <div className="border-2 border-input rounded-md bg-white">
                    <SignatureCanvas
                      ref={signaturePadRef}
                      penColor="#111827"
                      canvasProps={{
                        width: 600,
                        height: 160,
                        className: "w-full h-40 cursor-crosshair",
                        style: { touchAction: 'none' }
                      }}
                      backgroundColor="white"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sign above using your mouse or finger on touch screen
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Recording..." : "I Agree and Submit"}
                </Button>
              </form>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Signed By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consents.map((consent) => {
              const isExpired = consent.expires_at && new Date(consent.expires_at) < new Date();
              return (
                <TableRow key={consent.id}>
                  <TableCell>
                    {consent.patients?.mrn} - {consent.patients?.first_name} {consent.patients?.last_name}
                  </TableCell>
                  <TableCell>{consent.consent_type.replace(/_/g, " ")}</TableCell>
                  <TableCell>{consent.signed_by}</TableCell>
                  <TableCell>
                    {consent.signed_at ? new Date(consent.signed_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    {consent.signed_at ? (
                      isExpired ? (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Clock className="h-4 w-4" />
                          <span>Expired</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>Signed</span>
                        </div>
                      )
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {consents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No consent forms recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConsentsTab;
