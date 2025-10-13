import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Patient {
  id: string;
  mrn: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  sex_at_birth: string;
  phone_mobile: string;
  email?: string;
  registration_invoice_status?: string;
  registration_invoice_id?: string;
  queue_status?: string;
  queue_token?: string;
  visit_count?: number;
  last_visit_date?: string;
  is_returning?: boolean;
}

interface UsePatientsReturn {
  patients: Patient[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refetch: () => void;
  ITEMS_PER_PAGE: number;
}

export const usePatients = (): UsePatientsReturn => {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const loadPatients = useCallback(async (page: number, search: string) => {
    setLoading(true);
    
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from("patients")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`mrn.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone_mobile.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    setTotalCount(count || 0);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading patients",
        description: error.message,
      });
      setPatients([]);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setPatients([]);
      setLoading(false);
      return;
    }

    // Fetch invoice status for all patients in parallel
    const patientIds = data.map(p => p.id);
    const { data: invoices } = await supabase
      .from("invoices")
      .select("patient_id, id, status, created_at")
      .in("patient_id", patientIds);

    // Fetch both appointments and visits for complete visit history
    const [appointmentsRes, visitsRes, notesRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("patient_id, scheduled_start, status")
        .in("patient_id", patientIds)
        .order("scheduled_start", { ascending: false }),
      supabase
        .from("visits")
        .select("patient_id, opened_at, state")
        .in("patient_id", patientIds)
        .order("opened_at", { ascending: false }),
      supabase
        .from("emr_notes")
        .select("patient_id, created_at")
        .in("patient_id", patientIds)
        .order("created_at", { ascending: false })
    ]);

    // Create a map of patient_id to invoice status (and created_at for last-visit calc)
    const invoiceMap = new Map();
    const invoiceDatesMap = new Map();
    invoices?.forEach((inv: any) => {
      if (!invoiceMap.has(inv.patient_id)) {
        invoiceMap.set(inv.patient_id, { id: inv.id, status: inv.status });
      }
      // Track most recent invoice date
      const prev = invoiceDatesMap.get(inv.patient_id) as string | undefined;
      if (!prev || new Date(inv.created_at) > new Date(prev)) {
        invoiceDatesMap.set(inv.patient_id, inv.created_at);
      }
    });

    // Create a map of patient_id to combined visit info (appointments + visits + notes + invoices)
    const visitMap = new Map();
    
    // Process appointments
    appointmentsRes.data?.forEach((apt: any) => {
      if (!visitMap.has(apt.patient_id)) {
        visitMap.set(apt.patient_id, {
          count: 1,
          lastVisit: apt.scheduled_start,
          visits: [{ date: apt.scheduled_start, type: 'appointment', status: apt.status }]
        });
      } else {
        const current = visitMap.get(apt.patient_id);
        visitMap.set(apt.patient_id, {
          count: current.count + 1,
          lastVisit: current.lastVisit,
          visits: [...current.visits, { date: apt.scheduled_start, type: 'appointment', status: apt.status }]
        });
      }
    });

    // Process actual visits (check-ins)
    visitsRes.data?.forEach((visit: any) => {
      if (!visitMap.has(visit.patient_id)) {
        visitMap.set(visit.patient_id, {
          count: 1,
          lastVisit: visit.opened_at,
          visits: [{ date: visit.opened_at, type: 'visit', state: visit.state }]
        });
      } else {
        const current = visitMap.get(visit.patient_id);
        const allVisits = [...current.visits, { date: visit.opened_at, type: 'visit', state: visit.state }];
        allVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        visitMap.set(visit.patient_id, {
          count: current.count + 1,
          lastVisit: allVisits[0].date,
          visits: allVisits
        });
      }
    });

    // Process EMR notes as encounters
    notesRes.data?.forEach((note: any) => {
      if (!visitMap.has(note.patient_id)) {
        visitMap.set(note.patient_id, {
          count: 1,
          lastVisit: note.created_at,
          visits: [{ date: note.created_at, type: 'note' }]
        });
      } else {
        const current = visitMap.get(note.patient_id);
        const allVisits = [...current.visits, { date: note.created_at, type: 'note' }];
        allVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        visitMap.set(note.patient_id, {
          count: current.count + 1,
          lastVisit: allVisits[0].date,
          visits: allVisits
        });
      }
    });

    // Factor in most recent invoice date for last visit if newer
    invoiceDatesMap.forEach((created_at: string, pid: string) => {
      if (!visitMap.has(pid)) {
        visitMap.set(pid, { count: 1, lastVisit: created_at, visits: [{ date: created_at, type: 'invoice' }] });
      } else {
        const current = visitMap.get(pid);
        const allVisits = [...current.visits, { date: created_at, type: 'invoice' }];
        allVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        visitMap.set(pid, {
          count: current.count + 1,
          lastVisit: allVisits[0].date,
          visits: allVisits
        });
      }
    });

    const patientsWithStatus = data.map(patient => {
      const invoice = invoiceMap.get(patient.id);
      const visitInfo = visitMap.get(patient.id);
      return {
        ...patient,
        registration_invoice_status: invoice?.status || "pending",
        registration_invoice_id: invoice?.id || null,
        queue_status: null,
        queue_token: null,
        visit_count: visitInfo?.count || 0,
        last_visit_date: visitInfo?.lastVisit || null,
        is_returning: (visitInfo?.count || 0) > 0
      };
    });

    setPatients(patientsWithStatus);
    setLoading(false);
  }, [toast, ITEMS_PER_PAGE]);

  useEffect(() => {
    loadPatients(currentPage, searchTerm);
  }, [currentPage, loadPatients, searchTerm]);

  const refetch = useCallback(() => {
    loadPatients(currentPage, searchTerm);
  }, [currentPage, searchTerm, loadPatients]);

  return {
    patients,
    loading,
    totalCount,
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    refetch,
    ITEMS_PER_PAGE,
  };
};
