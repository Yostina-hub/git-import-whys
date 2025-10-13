import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, FileText, Pill, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface VisitData {
  id: string;
  opened_at: string;
  state: string;
  notes: Array<{
    id: string;
    created_at: string;
    note_type: string;
    content: string;
    author: { first_name: string; last_name: string };
  }>;
  medications: Array<{
    id: string;
    medication_name: string;
    dosage: string;
    start_date: string;
  }>;
  vitals: Array<{
    id: string;
    recorded_at: string;
    vital_type: string;
    value: string;
  }>;
}

interface VisitTimelineProps {
  visits: VisitData[];
  emrNotes: any[];
}

export const VisitTimeline = ({ visits, emrNotes }: VisitTimelineProps) => {
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());

  const toggleVisit = (visitId: string) => {
    const newExpanded = new Set(expandedVisits);
    if (newExpanded.has(visitId)) {
      newExpanded.delete(visitId);
    } else {
      newExpanded.add(visitId);
    }
    setExpandedVisits(newExpanded);
  };

  // Group EMR notes by date for visits without visit records
  const groupedNotes = emrNotes.reduce((acc, note) => {
    const date = format(new Date(note.created_at), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(note);
    return acc;
  }, {} as Record<string, any[]>);

  const allEntries = [
    ...visits.map(v => ({ type: 'visit' as const, data: v, date: v.opened_at })),
    ...Object.entries(groupedNotes).map(([date, notes]) => ({ 
      type: 'notes' as const, 
      data: { notes, date }, 
      date 
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (allEntries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No clinical history recorded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visit History Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allEntries.map((entry, index) => {
            const isExpanded = expandedVisits.has(
              entry.type === 'visit' ? (entry.data as VisitData).id : (entry.data as any).date
            );
            const entryId = entry.type === 'visit' ? (entry.data as VisitData).id : (entry.data as any).date;
            const visitData = entry.type === 'visit' ? entry.data as VisitData : null;
            const notesData = entry.type === 'notes' ? entry.data as { notes: any[]; date: string } : null;

            return (
              <div key={entryId} className="relative">
                {index !== allEntries.length - 1 && (
                  <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-border" />
                )}
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      entry.type === 'visit' ? "bg-primary" : "bg-muted"
                    )}>
                      {entry.type === 'visit' ? (
                        <Activity className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">
                            {entry.type === 'visit' ? 'Visit' : 'Clinical Notes'}
                          </p>
                          {visitData?.state && (
                            <Badge variant="outline" className="text-xs">
                              {visitData.state}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(entry.date), "PPP 'at' p")}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVisit(entryId)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="bg-muted/50 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2">
                        {visitData ? (
                          <>
                            {visitData.notes && visitData.notes.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Clinical Notes ({visitData.notes.length})
                                </h4>
                                {visitData.notes.map((note: any) => (
                                  <div key={note.id} className="bg-background rounded p-3 text-sm">
                                    <div className="flex items-start justify-between mb-2">
                                      <Badge variant="secondary" className="text-xs">
                                        {note.note_type}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {note.author?.first_name} {note.author?.last_name}
                                      </span>
                                    </div>
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                      {note.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {visitData.vitals && visitData.vitals.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                  <Activity className="h-4 w-4" />
                                  Vital Signs
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {visitData.vitals.map((vital: any) => (
                                    <div key={vital.id} className="bg-background rounded p-2 text-sm">
                                      <span className="font-medium">{vital.vital_type}:</span>{" "}
                                      <span className="text-muted-foreground">{vital.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {visitData.medications && visitData.medications.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                  <Pill className="h-4 w-4" />
                                  Medications Prescribed
                                </h4>
                                {visitData.medications.map((med: any) => (
                                  <div key={med.id} className="bg-background rounded p-2 text-sm">
                                    <span className="font-medium">{med.medication_name}</span>
                                    <span className="text-muted-foreground"> - {med.dosage}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : notesData ? (
                          <div className="space-y-2">
                            {notesData.notes.map((note: any) => (
                              <div key={note.id} className="bg-background rounded p-3 text-sm">
                                <div className="flex items-start justify-between mb-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {note.note_type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(note.created_at), "p")}
                                  </span>
                                </div>
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                  {note.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
