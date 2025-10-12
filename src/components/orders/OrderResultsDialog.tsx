import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, File, Trash2, Download, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface OrderResultsDialogProps {
  orderId: string;
  orderType: string;
  onSuccess?: () => void;
}

interface ResultFile {
  id: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
  description?: string;
  file_path: string;
}

export const OrderResultsDialog = ({ orderId, orderType, onSuccess }: OrderResultsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<ResultFile[]>([]);
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const loadResults = async () => {
    // In production, fetch from a results_attachments table
    // For now, using mock data
    setResults([
      {
        id: "1",
        file_name: "lab_result_2024.pdf",
        file_size: 245000,
        uploaded_at: new Date().toISOString(),
        uploaded_by: "Dr. Smith",
        description: "Complete Blood Count results",
        file_path: "/results/lab_result_2024.pdf",
      },
    ]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 10MB",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload to Supabase Storage
      const filePath = `order-results/${orderId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("patient-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // In production, save metadata to database
      // For now, just show success
      toast({
        title: "Result uploaded",
        description: "Order result has been attached successfully",
      });

      setDescription("");
      loadResults();
      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (result: ResultFile) => {
    try {
      const { data, error } = await supabase.storage
        .from("patient-documents")
        .download(result.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${result.file_name}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: error.message,
      });
    }
  };

  const handleDelete = async (resultId: string) => {
    if (!confirm("Are you sure you want to delete this result?")) return;

    try {
      // In production, delete from database and storage
      toast({
        title: "Result deleted",
        description: "Order result has been removed",
      });
      loadResults();
      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message,
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) loadResults();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <File className="h-4 w-4 mr-2" />
          Results
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Results & Attachments</DialogTitle>
          <DialogDescription>
            Upload and manage result files for this {orderType} order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Upload New Result</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the result file (e.g., X-Ray Report, Lab Results)"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="file-upload">Select File</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.dicom"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading && (
                    <Badge variant="secondary">Uploading...</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: PDF, Images, DICOM (max 10MB)
                </p>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Attached Results</h3>
            
            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No results uploaded yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <File className="h-4 w-4 text-muted-foreground" />
                        {result.file_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {result.description || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatFileSize(result.file_size)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(result.uploaded_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {result.uploaded_by}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(result)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(result.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
