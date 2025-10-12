import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, Trash2, FileText, Image } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  bucket_name: string;
  document_type: string;
  document_date: string | null;
  description: string | null;
  created_at: string;
}

interface DocumentsListProps {
  patientId: string;
  refreshTrigger?: number;
}

export const DocumentsList = ({ patientId, refreshTrigger }: DocumentsListProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("document_attachments")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading documents",
        description: error.message,
      });
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDocuments();
  }, [patientId, refreshTrigger]);

  const handleDownload = async (doc: Document) => {
    const { data, error } = await supabase.storage
      .from(doc.bucket_name)
      .download(doc.file_path);

    if (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: error.message,
      });
    } else if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = async (doc: Document) => {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(doc.bucket_name)
      .remove([doc.file_path]);

    if (storageError) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: storageError.message,
      });
      return;
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("document_attachments")
      .delete()
      .eq("id", doc.id);

    if (dbError) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: dbError.message,
      });
    } else {
      toast({
        title: "Document deleted",
        description: "File has been removed successfully",
      });
      loadDocuments();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      lab_result: "bg-blue-500",
      imaging: "bg-purple-500",
      consent: "bg-green-500",
      referral: "bg-orange-500",
      prescription: "bg-pink-500",
      other: "bg-gray-500",
    };
    return colors[type] || "bg-gray-500";
  };

  if (loading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No documents uploaded yet
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {doc.mime_type.startsWith("image/") ? (
                    <Image className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <div className="font-medium">{doc.file_name}</div>
                    {doc.description && (
                      <div className="text-sm text-muted-foreground">
                        {doc.description}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getDocumentTypeColor(doc.document_type)}>
                  {doc.document_type.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                {doc.document_date
                  ? format(new Date(doc.document_date), "MMM d, yyyy")
                  : "-"}
              </TableCell>
              <TableCell>{formatFileSize(doc.file_size)}</TableCell>
              <TableCell>
                {format(new Date(doc.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{doc.file_name}"? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(doc)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
