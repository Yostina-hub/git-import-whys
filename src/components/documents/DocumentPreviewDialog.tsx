import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentPreviewDialogProps {
  document: {
    id: string;
    file_name: string;
    file_path: string;
    mime_type: string;
    bucket_name: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DocumentPreviewDialog = ({
  document,
  open,
  onOpenChange,
}: DocumentPreviewDialogProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (document && open) {
      loadPreview();
    } else {
      setPreviewUrl(null);
    }

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [document, open]);

  const loadPreview = async () => {
    if (!document) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(document.bucket_name)
        .download(document.file_path);

      if (error) throw error;

      if (data) {
        const url = URL.createObjectURL(data);
        setPreviewUrl(url);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Preview failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl || !document) return;

    const a = window.document.createElement("a");
    a.href = previewUrl;
    a.download = document.file_name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  const isImage = document?.mime_type.startsWith("image/");
  const isPdf = document?.mime_type === "application/pdf";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{document?.file_name}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading preview...</p>
            </div>
          )}

          {!loading && previewUrl && isImage && (
            <img
              src={previewUrl}
              alt={document.file_name}
              className="w-full h-auto"
            />
          )}

          {!loading && previewUrl && isPdf && (
            <iframe
              src={previewUrl}
              className="w-full h-[600px] border-0"
              title={document.file_name}
            />
          )}

          {!loading && previewUrl && !isImage && !isPdf && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Preview not available for this file type
              </p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download to View
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
