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
      .select("patient_id, id, status")
      .in("patient_id", patientIds);

    // Create a map of patient_id to invoice status
    const invoiceMap = new Map();
    invoices?.forEach(inv => {
      if (!invoiceMap.has(inv.patient_id)) {
        invoiceMap.set(inv.patient_id, { id: inv.id, status: inv.status });
      }
    });

    const patientsWithStatus = data.map(patient => {
      const invoice = invoiceMap.get(patient.id);
      return {
        ...patient,
        registration_invoice_status: invoice?.status || "pending",
        registration_invoice_id: invoice?.id || null,
        queue_status: null,
        queue_token: null,
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
