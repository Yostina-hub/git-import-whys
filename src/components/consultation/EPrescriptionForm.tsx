import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface EPrescriptionFormProps {
  consultationId: string;
  patientId: string;
  onSaved?: () => void;
}

export function EPrescriptionForm({
  consultationId,
  patientId,
  onSaved,
}: EPrescriptionFormProps) {
  const { toast } = useToast();
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
  ]);
  const [diagnosis, setDiagnosis] = useState('');
  const [generalInstructions, setGeneralInstructions] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  const [isSaving, setIsSaving] = useState(false);

  const addMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const savePrescription = async () => {
    // Validate
    const validMeds = medications.filter((m) => m.name && m.dosage);
    if (validMeds.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one medication with name and dosage',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in',
        variant: 'destructive',
      });
      setIsSaving(false);
      return;
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(validityDays));

    const { error } = await supabase.from('consultation_prescriptions').insert([{
      consultation_id: consultationId,
      patient_id: patientId,
      prescribed_by: user.id,
      medications: validMeds as any,
      diagnosis,
      instructions: generalInstructions,
      valid_until: validUntil.toISOString().split('T')[0],
      status: 'active',
    }]);

    setIsSaving(false);

    if (error) {
      console.error('Error saving prescription:', error);
      toast({
        title: 'Error',
        description: 'Failed to save prescription',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Prescription Saved',
        description: 'E-prescription has been created successfully',
      });
      onSaved?.();
    }
  };

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <CardTitle>E-Prescription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Diagnosis */}
        <div className="space-y-2">
          <Label>Diagnosis</Label>
          <Textarea
            placeholder="Enter diagnosis..."
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            rows={2}
          />
        </div>

        {/* Medications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Medications</Label>
            <Button variant="outline" size="sm" onClick={addMedication}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </div>

          {medications.map((med, index) => (
            <Card key={index} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Medication Name *</Label>
                      <Input
                        placeholder="e.g., Amoxicillin"
                        value={med.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Dosage *</Label>
                      <Input
                        placeholder="e.g., 500mg"
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Frequency</Label>
                      <Input
                        placeholder="e.g., 3 times daily"
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Duration</Label>
                      <Input
                        placeholder="e.g., 7 days"
                        value={med.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Instructions</Label>
                      <Input
                        placeholder="e.g., Take after meals"
                        value={med.instructions}
                        onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                      />
                    </div>
                  </div>
                  {medications.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMedication(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* General Instructions */}
        <div className="space-y-2">
          <Label>General Instructions</Label>
          <Textarea
            placeholder="Additional instructions for the patient..."
            value={generalInstructions}
            onChange={(e) => setGeneralInstructions(e.target.value)}
            rows={3}
          />
        </div>

        {/* Validity */}
        <div className="space-y-2">
          <Label>Prescription Validity (days)</Label>
          <Input
            type="number"
            value={validityDays}
            onChange={(e) => setValidityDays(e.target.value)}
            min="1"
            max="365"
          />
        </div>

        {/* Save Button */}
        <Button onClick={savePrescription} disabled={isSaving} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Prescription'}
        </Button>
      </CardContent>
    </Card>
  );
}
