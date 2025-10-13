import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Camera, Mic, StopCircle } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

interface ConsentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  onSuccess?: () => void;
  defaultConsentType?: string;
}

export function ConsentFormDialog({ 
  open, 
  onOpenChange, 
  patientId, 
  onSuccess,
  defaultConsentType = "general_treatment" 
}: ConsentFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    patient_id: string;
    consent_type: "general_treatment" | "package_treatment" | "data_privacy" | "telehealth" | "photography" | "research";
    signed_by: string;
    guardian_name: string;
    guardian_relationship: string;
    guardian_phone: string;
    guardian_national_id: string;
  }>({
    patient_id: patientId,
    consent_type: defaultConsentType as any,
    signed_by: "patient",
    guardian_name: "",
    guardian_relationship: "",
    guardian_phone: "",
    guardian_national_id: "",
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

    setLoading(true);

    const signatureData = signaturePadRef.current.toDataURL();

    const { error } = await supabase.from("consent_forms").insert([
      {
        ...formData,
        patient_id: patientId,
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
      setLoading(false);
    } else {
      toast({
        title: "Consent recorded",
        description: "The consent form has been saved successfully.",
      });
      setLoading(false);
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const resetForm = () => {
    signaturePadRef.current?.clear();
    setPhotoData(null);
    setVoiceData(null);
    setFormData({
      patient_id: patientId,
      consent_type: defaultConsentType as "general_treatment" | "package_treatment" | "data_privacy" | "telehealth" | "photography" | "research",
      signed_by: "patient",
      guardian_name: "",
      guardian_relationship: "",
      guardian_phone: "",
      guardian_national_id: "",
    });
  };

  const clearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const startCamera = async () => {
    try {
      if (videoRef.current?.srcObject) {
        const prev = videoRef.current.srcObject as MediaStream;
        prev.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }

      const permissionStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      const frontRegex = /front|user|facetime/i;
      const frontCamId = videoInputs.find(d => frontRegex.test(d.label))?.deviceId || videoInputs[0]?.deviceId;

      let stream: MediaStream = permissionStream;
      if (frontCamId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: frontCamId }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          permissionStream.getTracks().forEach(t => t.stop());
        } catch (e) {
          console.warn('Exact device selection failed, using permission stream instead', e);
        }
      }

      if (videoRef.current) {
        const el = videoRef.current;
        el.srcObject = stream;
        el.muted = true;
        el.playsInline = true;
        el.setAttribute('playsinline', 'true');
        el.setAttribute('autoplay', 'true');

        el.onloadedmetadata = async () => {
          try {
            await el.play();
            setIsCameraOpen(true);
          } catch (playError) {
            console.error('Play error:', playError);
          }
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        variant: 'destructive',
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions.',
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

  const consentContent = getConsentContent(formData.consent_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Consent Form</DialogTitle>
          <DialogDescription>
            Review the consent details below, capture a photo, optionally record voice consent, and sign to proceed.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-4 pb-4">
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

            {formData.signed_by === "guardian" && (
              <div className="space-y-3 p-4 border rounded-md bg-muted/30">
                <h4 className="font-medium text-sm">Guardian Information</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Guardian Name *</Label>
                    <Input
                      value={formData.guardian_name}
                      onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                      placeholder="Full name"
                      required={formData.signed_by === "guardian"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship to Patient *</Label>
                    <Input
                      value={formData.guardian_relationship}
                      onChange={(e) => setFormData({ ...formData, guardian_relationship: e.target.value })}
                      placeholder="e.g., Parent, Spouse"
                      required={formData.signed_by === "guardian"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Guardian Phone *</Label>
                    <Input
                      value={formData.guardian_phone}
                      onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                      placeholder="Phone number"
                      required={formData.signed_by === "guardian"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Guardian ID Number *</Label>
                    <Input
                      value={formData.guardian_national_id}
                      onChange={(e) => setFormData({ ...formData, guardian_national_id: e.target.value })}
                      placeholder="National ID or Passport"
                      required={formData.signed_by === "guardian"}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-muted/50 rounded-md">
              <h4 className="font-semibold mb-2">{consentContent.title}</h4>
              <p className="text-sm whitespace-pre-line">{consentContent.content}</p>
            </div>

            <div className="space-y-2">
              <Label>Photo Capture (Required)</Label>
              <div className="flex gap-2">
                {!photoData && (
                  <>
                    {!isCameraOpen ? (
                      <Button type="button" onClick={startCamera} variant="outline" size="sm">
                        <Camera className="h-4 w-4 mr-2" />
                        Open Camera
                      </Button>
                    ) : (
                      <Button type="button" onClick={capturePhoto} variant="outline" size="sm">
                        <Camera className="h-4 w-4 mr-2" />
                        Capture Photo
                      </Button>
                    )}
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>Upload Photo</span>
                      </Button>
                      <Input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoFile}
                      />
                    </Label>
                  </>
                )}
                {photoData && (
                  <Button type="button" onClick={() => setPhotoData(null)} variant="destructive" size="sm">
                    Remove Photo
                  </Button>
                )}
              </div>
              {isCameraOpen && (
                <div className="relative">
                  <video ref={videoRef} className="w-full rounded-md border" />
                </div>
              )}
              {photoData && (
                <img src={photoData} alt="Captured" className="w-full max-w-xs rounded-md border" />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="space-y-2">
              <Label>Voice Consent (Optional)</Label>
              <div className="flex gap-2">
                {!voiceData ? (
                  !isRecording ? (
                    <Button type="button" onClick={startRecording} variant="outline" size="sm">
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button type="button" onClick={stopRecording} variant="destructive" size="sm">
                      <StopCircle className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                  )
                ) : (
                  <Button type="button" onClick={() => setVoiceData(null)} variant="destructive" size="sm">
                    Remove Voice Recording
                  </Button>
                )}
              </div>
              {voiceData && (
                <audio src={voiceData} controls className="w-full" />
              )}
            </div>

            <div className="space-y-2">
              <Label>Signature *</Label>
              <div className="border rounded-md bg-white">
                <SignatureCanvas
                  ref={signaturePadRef}
                  canvasProps={{
                    className: "w-full h-32 rounded-md",
                  }}
                />
              </div>
              <Button type="button" onClick={clearSignature} variant="outline" size="sm">
                Clear Signature
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Submit Consent"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
