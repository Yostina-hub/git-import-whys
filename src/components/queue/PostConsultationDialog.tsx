import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ClipboardList, CreditCard, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PostConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  ticketId: string;
}

export function PostConsultationDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  ticketId,
}: PostConsultationDialogProps) {
  const navigate = useNavigate();

  const handleCreateEMRNote = () => {
    onOpenChange(false);
    navigate(`/clinical-records?patientId=${patientId}&openEMR=true`);
  };

  const handleCreateOrder = () => {
    onOpenChange(false);
    navigate(`/orders?patientId=${patientId}&action=create`);
  };

  const handleCreateInvoice = () => {
    onOpenChange(false);
    navigate(`/billing?patientId=${patientId}&action=create`);
  };

  const handleViewClinicalRecords = () => {
    onOpenChange(false);
    navigate(`/clinical-records?patientId=${patientId}`);
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Consultation Complete</DialogTitle>
          <DialogDescription>
            Patient {patientName} has been marked as served. What would you like to do next?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Card 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={handleCreateEMRNote}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Create EMR Note</CardTitle>
                  <CardDescription>Document consultation findings and treatment</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={handleCreateOrder}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Create Order/Prescription</CardTitle>
                  <CardDescription>Add lab tests, imaging, or prescriptions</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={handleCreateInvoice}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Create Invoice</CardTitle>
                  <CardDescription>Generate billing for services rendered</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={handleViewClinicalRecords}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">View Clinical Records</CardTitle>
                  <CardDescription>Access complete patient clinical history</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleSkip}>
            Skip for Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
