import { useState } from "react";
import { UploadDocumentDialog } from "./UploadDocumentDialog";
import { DocumentsList } from "./DocumentsList";

interface DocumentsTabProps {
  patientId: string;
}

export const DocumentsTab = ({ patientId }: DocumentsTabProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Patient Documents</h3>
          <p className="text-sm text-muted-foreground">
            Upload and manage patient files, images, and records
          </p>
        </div>
        <UploadDocumentDialog
          patientId={patientId}
          onUploadComplete={handleUploadComplete}
        />
      </div>
      <DocumentsList patientId={patientId} refreshTrigger={refreshTrigger} />
    </div>
  );
};
