import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Phone, UserX, ArrowRightLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface QueueActionsProps {
  ticket: any;
  queues: any[];
  onUpdate: () => void;
}

export const QueueActions = ({ ticket, queues, onUpdate }: QueueActionsProps) => {
  const { toast } = useToast();
  const [showNoShowDialog, setShowNoShowDialog] = useState(false);

  const callPatient = async () => {
    const { error } = await supabase
      .from("tickets")
      .update({ status: "called", called_at: new Date().toISOString() })
      .eq("id", ticket.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Patient called",
        description: `${ticket.token_number} - ${ticket.patients?.first_name} ${ticket.patients?.last_name}`,
      });
      onUpdate();
    }
  };

  const markNoShow = async () => {
    const { error } = await supabase
      .from("tickets")
      .update({ status: "no_show" })
      .eq("id", ticket.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Marked as no-show",
        description: `Patient ${ticket.token_number} marked as no-show`,
      });
      onUpdate();
    }
    setShowNoShowDialog(false);
  };

  const transferToQueue = async (newQueueId: string) => {
    const newQueue = queues.find(q => q.id === newQueueId);
    
    const { error } = await supabase
      .from("tickets")
      .update({ queue_id: newQueueId })
      .eq("id", ticket.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Patient transferred",
        description: `Moved to ${newQueue?.name}`,
      });
      onUpdate();
    }
  };

  const otherQueues = queues.filter(q => q.id !== ticket.queue_id);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Queue Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {ticket.status === "waiting" && (
            <DropdownMenuItem onClick={callPatient}>
              <Phone className="h-4 w-4 mr-2" />
              Call Now
            </DropdownMenuItem>
          )}

          {(ticket.status === "waiting" || ticket.status === "called") && (
            <DropdownMenuItem 
              onClick={() => setShowNoShowDialog(true)}
              className="text-destructive"
            >
              <UserX className="h-4 w-4 mr-2" />
              Mark No-Show
            </DropdownMenuItem>
          )}

          {otherQueues.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">Transfer to</DropdownMenuLabel>
              {otherQueues.map((queue) => (
                <DropdownMenuItem 
                  key={queue.id}
                  onClick={() => transferToQueue(queue.id)}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  {queue.name}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showNoShowDialog} onOpenChange={setShowNoShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Mark as No-Show
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark {ticket.patients?.first_name} {ticket.patients?.last_name} 
              (Token: {ticket.token_number}) as no-show? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={markNoShow} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Mark No-Show
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
