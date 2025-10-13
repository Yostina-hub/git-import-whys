export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_summary: {
        Row: {
          actions_count: number | null
          appointments_created: number | null
          created_at: string
          id: string
          invoices_created: number | null
          last_login: string | null
          patients_viewed: number | null
          summary_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions_count?: number | null
          appointments_created?: number | null
          created_at?: string
          id?: string
          invoices_created?: number | null
          last_login?: string | null
          patients_viewed?: number | null
          summary_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions_count?: number | null
          appointments_created?: number | null
          created_at?: string
          id?: string
          invoices_created?: number | null
          last_login?: string | null
          patients_viewed?: number | null
          summary_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      allergies: {
        Row: {
          allergen: string
          created_at: string
          id: string
          notes: string | null
          onset_date: string | null
          patient_id: string
          reaction: string
          severity: string
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          allergen: string
          created_at?: string
          id?: string
          notes?: string | null
          onset_date?: string | null
          patient_id: string
          reaction: string
          severity: string
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          allergen?: string
          created_at?: string
          id?: string
          notes?: string | null
          onset_date?: string | null
          patient_id?: string
          reaction?: string
          severity?: string
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allergies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allergies_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          patient_id: string
          provider_id: string | null
          reason_for_visit: string | null
          scheduled_end: string
          scheduled_start: string
          service_id: string | null
          source: Database["public"]["Enums"]["appointment_source"] | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          provider_id?: string | null
          reason_for_visit?: string | null
          scheduled_end: string
          scheduled_start: string
          service_id?: string | null
          source?: Database["public"]["Enums"]["appointment_source"] | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          provider_id?: string | null
          reason_for_visit?: string | null
          scheduled_end?: string
          scheduled_start?: string
          service_id?: string | null
          source?: Database["public"]["Enums"]["appointment_source"] | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          schema: Json
          stage: Database["public"]["Enums"]["assessment_stage"]
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          schema?: Json
          stage: Database["public"]["Enums"]["assessment_stage"]
          updated_at?: string
          version?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          schema?: Json
          stage?: Database["public"]["Enums"]["assessment_stage"]
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          appointment_id: string | null
          assessment_stage: Database["public"]["Enums"]["assessment_stage"]
          completed_at: string | null
          completed_by: string | null
          created_at: string
          flags: Json | null
          id: string
          patient_id: string
          responses: Json
          score: number | null
          template_id: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          assessment_stage: Database["public"]["Enums"]["assessment_stage"]
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          flags?: Json | null
          id?: string
          patient_id: string
          responses?: Json
          score?: number | null
          template_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          assessment_stage?: Database["public"]["Enums"]["assessment_stage"]
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          flags?: Json | null
          id?: string
          patient_id?: string
          responses?: Json
          score?: number | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "assessment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_rules: {
        Row: {
          actions: Json
          category: string | null
          code: string
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          rule_type: string
          updated_at: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          actions?: Json
          category?: string | null
          code: string
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          rule_type: string
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          actions?: Json
          category?: string | null
          code?: string
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          rule_type?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      clinics: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          code: string
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          postal_code: string | null
          region: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          code: string
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      consent_forms: {
        Row: {
          captured_channel: string | null
          consent_type: Database["public"]["Enums"]["consent_type"]
          content_html: string | null
          created_at: string
          expires_at: string | null
          guardian_name: string | null
          guardian_national_id: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          id: string
          patient_id: string
          signature_blob: string | null
          signed_at: string | null
          signed_by: string | null
          updated_at: string
          version: string
          witness_id: string | null
        }
        Insert: {
          captured_channel?: string | null
          consent_type: Database["public"]["Enums"]["consent_type"]
          content_html?: string | null
          created_at?: string
          expires_at?: string | null
          guardian_name?: string | null
          guardian_national_id?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          patient_id: string
          signature_blob?: string | null
          signed_at?: string | null
          signed_by?: string | null
          updated_at?: string
          version?: string
          witness_id?: string | null
        }
        Update: {
          captured_channel?: string | null
          consent_type?: Database["public"]["Enums"]["consent_type"]
          content_html?: string | null
          created_at?: string
          expires_at?: string | null
          guardian_name?: string | null
          guardian_national_id?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          patient_id?: string
          signature_blob?: string | null
          signed_at?: string | null
          signed_by?: string | null
          updated_at?: string
          version?: string
          witness_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_forms_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_code: string
          discount_amount: number
          id: string
          invoice_id: string
          patient_id: string
          used_at: string
          used_by: string | null
        }
        Insert: {
          coupon_code: string
          discount_amount: number
          id?: string
          invoice_id: string
          patient_id: string
          used_at?: string
          used_by?: string | null
        }
        Update: {
          coupon_code?: string
          discount_amount?: number
          id?: string
          invoice_id?: string
          patient_id?: string
          used_at?: string
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_policies: {
        Row: {
          applicable_items: Json | null
          applicable_to: string
          code: string
          created_at: string | null
          customer_eligibility: Json | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_purchase_amount: number | null
          name: string
          requires_approval: boolean | null
          updated_at: string | null
          usage_limit: number | null
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          applicable_items?: Json | null
          applicable_to: string
          code: string
          created_at?: string | null
          customer_eligibility?: Json | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          name: string
          requires_approval?: boolean | null
          updated_at?: string | null
          usage_limit?: number | null
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          applicable_items?: Json | null
          applicable_to?: string
          code?: string
          created_at?: string | null
          customer_eligibility?: Json | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          name?: string
          requires_approval?: boolean | null
          updated_at?: string | null
          usage_limit?: number | null
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      document_attachments: {
        Row: {
          bucket_name: string
          created_at: string
          description: string | null
          document_date: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          patient_id: string
          tags: string[] | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          bucket_name: string
          created_at?: string
          description?: string | null
          document_date?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          patient_id: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          bucket_name?: string
          created_at?: string
          description?: string | null
          document_date?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          patient_id?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_attachments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      emr_notes: {
        Row: {
          appointment_id: string | null
          author_id: string
          content: string
          created_at: string
          id: string
          note_type: Database["public"]["Enums"]["note_type"]
          patient_id: string
          tags: string[] | null
          updated_at: string
          visibility: string | null
        }
        Insert: {
          appointment_id?: string | null
          author_id: string
          content: string
          created_at?: string
          id?: string
          note_type: Database["public"]["Enums"]["note_type"]
          patient_id: string
          tags?: string[] | null
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          appointment_id?: string | null
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          note_type?: Database["public"]["Enums"]["note_type"]
          patient_id?: string
          tags?: string[] | null
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emr_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emr_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      exemption_policies: {
        Row: {
          applicable_items: Json | null
          applies_to: string
          approval_workflow: Json | null
          code: string
          created_at: string | null
          description: string | null
          eligibility_criteria: Json
          exemption_percentage: number | null
          exemption_type: string
          id: string
          is_active: boolean | null
          name: string
          required_documents: Json | null
          requires_documentation: boolean | null
          updated_at: string | null
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          applicable_items?: Json | null
          applies_to: string
          approval_workflow?: Json | null
          code: string
          created_at?: string | null
          description?: string | null
          eligibility_criteria?: Json
          exemption_percentage?: number | null
          exemption_type: string
          id?: string
          is_active?: boolean | null
          name: string
          required_documents?: Json | null
          requires_documentation?: boolean | null
          updated_at?: string | null
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          applicable_items?: Json | null
          applies_to?: string
          approval_workflow?: Json | null
          code?: string
          created_at?: string | null
          description?: string | null
          eligibility_criteria?: Json
          exemption_percentage?: number | null
          exemption_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          required_documents?: Json | null
          requires_documentation?: boolean | null
          updated_at?: string | null
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          appointment_id: string | null
          balance_due: number | null
          created_at: string
          created_by: string | null
          discount_amount: number | null
          discount_code: string | null
          discount_type: string | null
          due_date: string | null
          id: string
          issued_at: string | null
          lines: Json
          patient_id: string
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          balance_due?: number | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          discount_type?: string | null
          due_date?: string | null
          id?: string
          issued_at?: string | null
          lines?: Json
          patient_id: string
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          balance_due?: number | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          discount_type?: string | null
          due_date?: string | null
          id?: string
          issued_at?: string | null
          lines?: Json
          patient_id?: string
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          created_at: string
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          medication_name: string
          notes: string | null
          patient_id: string
          prescribed_by: string | null
          route: string | null
          start_date: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          medication_name: string
          notes?: string | null
          patient_id: string
          prescribed_by?: string | null
          route?: string | null
          start_date: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          medication_name?: string
          notes?: string | null
          patient_id?: string
          prescribed_by?: string | null
          route?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_prescribed_by_fkey"
            columns: ["prescribed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body_template: string
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          is_active: boolean | null
          name: string
          subject: string | null
          type: string
          updated_at: string
        }
        Insert: {
          body_template: string
          created_at?: string
          created_by?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          name: string
          subject?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_log: {
        Row: {
          body: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          notification_type: string
          recipient_id: string
          recipient_type: string
          sent_at: string | null
          status: string
          subject: string | null
          template_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          recipient_id: string
          recipient_type: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          recipient_id?: string
          recipient_type?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          appointment_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          linked_invoice_id: string | null
          notes: string | null
          order_payload: Json
          order_type: Database["public"]["Enums"]["order_type"]
          ordered_by: string
          patient_id: string
          priority: Database["public"]["Enums"]["priority_level"] | null
          result_payload: Json | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          linked_invoice_id?: string | null
          notes?: string | null
          order_payload?: Json
          order_type: Database["public"]["Enums"]["order_type"]
          ordered_by: string
          patient_id: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          result_payload?: Json | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          linked_invoice_id?: string | null
          notes?: string | null
          order_payload?: Json
          order_type?: Database["public"]["Enums"]["order_type"]
          ordered_by?: string
          patient_id?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          result_payload?: Json | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_linked_invoice_id_fkey"
            columns: ["linked_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          bundle_price: number
          code: string
          components: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          validity_days: number | null
        }
        Insert: {
          bundle_price: number
          code: string
          components?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          validity_days?: number | null
        }
        Update: {
          bundle_price?: number
          code?: string
          components?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          validity_days?: number | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          consent_completed_at: string | null
          country: string | null
          created_at: string
          date_of_birth: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          first_name: string
          gender_identity: Database["public"]["Enums"]["gender_identity"] | null
          id: string
          last_name: string
          marketing_opt_in: boolean | null
          middle_name: string | null
          mrn: string
          national_id: string | null
          passport_no: string | null
          payment_completed_at: string | null
          phone_alt: string | null
          phone_mobile: string
          postal_code: string | null
          preferred_language: string | null
          region: string | null
          registration_notes: string | null
          registration_status:
            | Database["public"]["Enums"]["registration_status"]
            | null
          sex_at_birth: Database["public"]["Enums"]["sex_at_birth"] | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          consent_completed_at?: string | null
          country?: string | null
          created_at?: string
          date_of_birth: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name: string
          gender_identity?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          id?: string
          last_name: string
          marketing_opt_in?: boolean | null
          middle_name?: string | null
          mrn: string
          national_id?: string | null
          passport_no?: string | null
          payment_completed_at?: string | null
          phone_alt?: string | null
          phone_mobile: string
          postal_code?: string | null
          preferred_language?: string | null
          region?: string | null
          registration_notes?: string | null
          registration_status?:
            | Database["public"]["Enums"]["registration_status"]
            | null
          sex_at_birth?: Database["public"]["Enums"]["sex_at_birth"] | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          consent_completed_at?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string
          gender_identity?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          id?: string
          last_name?: string
          marketing_opt_in?: boolean | null
          middle_name?: string | null
          mrn?: string
          national_id?: string | null
          passport_no?: string | null
          payment_completed_at?: string | null
          phone_alt?: string | null
          phone_mobile?: string
          postal_code?: string | null
          preferred_language?: string | null
          region?: string | null
          registration_notes?: string | null
          registration_status?:
            | Database["public"]["Enums"]["registration_status"]
            | null
          sex_at_birth?: Database["public"]["Enums"]["sex_at_birth"] | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_types: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_reference: boolean | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_reference?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_reference?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          received_at: string
          received_by: string | null
          transaction_ref: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          received_at?: string
          received_by?: string | null
          transaction_ref?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          received_at?: string
          received_by?: string | null
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      post_treatment_assessments: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          follow_up_required: boolean | null
          id: string
          next_appointment_id: string | null
          outcome: string | null
          patient_id: string
          responses: Json
          score: number | null
          session_id: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          follow_up_required?: boolean | null
          id?: string
          next_appointment_id?: string | null
          outcome?: string | null
          patient_id: string
          responses?: Json
          score?: number | null
          session_id: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          follow_up_required?: boolean | null
          id?: string
          next_appointment_id?: string | null
          outcome?: string | null
          patient_id?: string
          responses?: Json
          score?: number | null
          session_id?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_treatment_assessments_next_appointment_id_fkey"
            columns: ["next_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_treatment_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_treatment_assessments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "treatment_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_treatment_assessments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "assessment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list_items: {
        Row: {
          created_at: string | null
          custom_price: number
          discount_percentage: number | null
          id: string
          price_list_id: string
          service_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_price: number
          discount_percentage?: number | null
          id?: string
          price_list_id: string
          service_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_price?: number
          discount_percentage?: number | null
          id?: string
          price_list_id?: string
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_list_items_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          markup_percentage: number | null
          name: string
          updated_at: string | null
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          markup_percentage?: number | null
          name: string
          updated_at?: string | null
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          markup_percentage?: number | null
          name?: string
          updated_at?: string | null
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          first_name: string
          hire_date: string | null
          id: string
          job_title: string | null
          last_login: string | null
          last_name: string
          license_number: string | null
          middle_name: string | null
          phone_alt: string | null
          phone_mobile: string | null
          signature_file: string | null
          specialty: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          first_name: string
          hire_date?: string | null
          id: string
          job_title?: string | null
          last_login?: string | null
          last_name: string
          license_number?: string | null
          middle_name?: string | null
          phone_alt?: string | null
          phone_mobile?: string | null
          signature_file?: string | null
          specialty?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          last_login?: string | null
          last_name?: string
          license_number?: string | null
          middle_name?: string | null
          phone_alt?: string | null
          phone_mobile?: string | null
          signature_file?: string | null
          specialty?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_schedules: {
        Row: {
          break_end: string | null
          break_start: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          effective_from: string
          effective_until: string | null
          end_time: string
          id: string
          is_active: boolean | null
          max_appointments: number | null
          notes: string | null
          provider_id: string
          schedule_type: Database["public"]["Enums"]["schedule_type"]
          start_time: string
          updated_at: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          effective_from?: string
          effective_until?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          max_appointments?: number | null
          notes?: string | null
          provider_id: string
          schedule_type?: Database["public"]["Enums"]["schedule_type"]
          start_time: string
          updated_at?: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          effective_from?: string
          effective_until?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          max_appointments?: number | null
          notes?: string | null
          provider_id?: string
          schedule_type?: Database["public"]["Enums"]["schedule_type"]
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_schedules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_schedules_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      queues: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          queue_type: Database["public"]["Enums"]["queue_type"]
          sla_minutes: number | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          queue_type: Database["public"]["Enums"]["queue_type"]
          sla_minutes?: number | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          queue_type?: Database["public"]["Enums"]["queue_type"]
          sla_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queues_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          approved_by: string | null
          created_at: string
          id: string
          payment_id: string
          processed_at: string | null
          reason: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          created_at?: string
          id?: string
          payment_id: string
          processed_at?: string | null
          reason: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          id?: string
          payment_id?: string
          processed_at?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_execution_log: {
        Row: {
          actions_taken: Json | null
          conditions_met: Json | null
          error_message: string | null
          executed_at: string | null
          executed_by: string | null
          execution_context: Json | null
          id: string
          result: string | null
          rule_id: string | null
        }
        Insert: {
          actions_taken?: Json | null
          conditions_met?: Json | null
          error_message?: string | null
          executed_at?: string | null
          executed_by?: string | null
          execution_context?: Json | null
          id?: string
          result?: string | null
          rule_id?: string | null
        }
        Update: {
          actions_taken?: Json | null
          conditions_met?: Json | null
          error_message?: string | null
          executed_at?: string | null
          executed_by?: string | null
          execution_context?: Json | null
          id?: string
          result?: string | null
          rule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rule_execution_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "business_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_exceptions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          end_time: string | null
          exception_date: string
          exception_type: Database["public"]["Enums"]["schedule_type"]
          id: string
          provider_id: string
          reason: string
          start_time: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_time?: string | null
          exception_date: string
          exception_type: Database["public"]["Enums"]["schedule_type"]
          id?: string
          provider_id: string
          reason: string
          start_time?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_time?: string | null
          exception_date?: string
          exception_type?: Database["public"]["Enums"]["schedule_type"]
          id?: string
          provider_id?: string
          reason?: string
          start_time?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_exceptions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_exceptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          metadata: Json | null
          notification_type: string
          recipient_id: string
          recipient_type: string
          scheduled_for: string
          sent_at: string | null
          status: string
          subject: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          recipient_id: string
          recipient_type: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          recipient_id?: string
          recipient_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_notifications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          tax_rate: number | null
          type: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tax_rate?: number | null
          type: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tax_rate?: number | null
          type?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          appointment_id: string | null
          called_at: string | null
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          priority: Database["public"]["Enums"]["priority_level"] | null
          queue_id: string
          served_at: string | null
          served_by: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          token_number: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          called_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          queue_id: string
          served_at?: string | null
          served_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          token_number: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          called_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          queue_id?: string
          served_at?: string | null
          served_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          token_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_protocols: {
        Row: {
          attachments: Json | null
          created_at: string
          created_from_assessment_id: string | null
          goals: string | null
          id: string
          is_optional: boolean | null
          name: string
          owner_provider_id: string | null
          patient_id: string
          plan: Json
          status: Database["public"]["Enums"]["protocol_status"] | null
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          created_from_assessment_id?: string | null
          goals?: string | null
          id?: string
          is_optional?: boolean | null
          name: string
          owner_provider_id?: string | null
          patient_id: string
          plan?: Json
          status?: Database["public"]["Enums"]["protocol_status"] | null
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          created_from_assessment_id?: string | null
          goals?: string | null
          id?: string
          is_optional?: boolean | null
          name?: string
          owner_provider_id?: string | null
          patient_id?: string
          plan?: Json
          status?: Database["public"]["Enums"]["protocol_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_protocols_created_from_assessment_id_fkey"
            columns: ["created_from_assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_protocols_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_sessions: {
        Row: {
          appointment_id: string
          billing_status: string | null
          clinician_id: string
          complications: string | null
          consumables_used: Json | null
          created_at: string
          id: string
          patient_id: string
          performed_at: string
          procedure_notes: string | null
          protocol_id: string | null
          services_rendered: Json | null
          sign_off_at: string | null
          updated_at: string
          vitals: Json | null
        }
        Insert: {
          appointment_id: string
          billing_status?: string | null
          clinician_id: string
          complications?: string | null
          consumables_used?: Json | null
          created_at?: string
          id?: string
          patient_id: string
          performed_at?: string
          procedure_notes?: string | null
          protocol_id?: string | null
          services_rendered?: Json | null
          sign_off_at?: string | null
          updated_at?: string
          vitals?: Json | null
        }
        Update: {
          appointment_id?: string
          billing_status?: string | null
          clinician_id?: string
          complications?: string | null
          consumables_used?: Json | null
          created_at?: string
          id?: string
          patient_id?: string
          performed_at?: string
          procedure_notes?: string | null
          protocol_id?: string | null
          services_rendered?: Json | null
          sign_off_at?: string | null
          updated_at?: string
          vitals?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_sessions_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "treatment_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      user_clinic_grant: {
        Row: {
          all_clinics: boolean
          clinic_id: string | null
          created_at: string
          id: string
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_clinics?: boolean
          clinic_id?: string | null
          created_at?: string
          id?: string
          scope: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_clinics?: boolean
          clinic_id?: string | null
          created_at?: string
          id?: string
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_clinic_grant_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_clinic_grant_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          linked_invoice_id: string | null
          opened_at: string
          patient_id: string
          primary_provider_id: string | null
          state: string | null
          updated_at: string
          visit_type: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          linked_invoice_id?: string | null
          opened_at?: string
          patient_id: string
          primary_provider_id?: string | null
          state?: string | null
          updated_at?: string
          visit_type?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          linked_invoice_id?: string | null
          opened_at?: string
          patient_id?: string
          primary_provider_id?: string | null
          state?: string | null
          updated_at?: string
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_linked_invoice_id_fkey"
            columns: ["linked_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      vital_signs: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          bmi: number | null
          created_at: string
          heart_rate: number | null
          height: number | null
          height_unit: string | null
          id: string
          notes: string | null
          oxygen_saturation: number | null
          patient_id: string
          recorded_at: string
          recorded_by: string
          respiratory_rate: number | null
          session_id: string | null
          temperature: number | null
          temperature_unit: string | null
          updated_at: string
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          bmi?: number | null
          created_at?: string
          heart_rate?: number | null
          height?: number | null
          height_unit?: string | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          patient_id: string
          recorded_at?: string
          recorded_by: string
          respiratory_rate?: number | null
          session_id?: string | null
          temperature?: number | null
          temperature_unit?: string | null
          updated_at?: string
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          bmi?: number | null
          created_at?: string
          heart_rate?: number | null
          height?: number | null
          height_unit?: string | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          patient_id?: string
          recorded_at?: string
          recorded_by?: string
          respiratory_rate?: number | null
          session_id?: string | null
          temperature?: number | null
          temperature_unit?: string | null
          updated_at?: string
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vital_signs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vital_signs_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vital_signs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "treatment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      appointment_analytics: {
        Row: {
          appointment_count: number | null
          report_date: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          unique_patients: number | null
          unique_providers: number | null
        }
        Relationships: []
      }
      clinical_activity: {
        Row: {
          active_clinicians: number | null
          report_date: string | null
          session_count: number | null
          unique_patients: number | null
        }
        Relationships: []
      }
      patient_demographics: {
        Row: {
          age_bracket: number | null
          gender_identity: Database["public"]["Enums"]["gender_identity"] | null
          patient_count: number | null
          sex_at_birth: Database["public"]["Enums"]["sex_at_birth"] | null
        }
        Relationships: []
      }
      revenue_analytics: {
        Row: {
          draft_revenue: number | null
          invoice_count: number | null
          outstanding_balance: number | null
          paid_revenue: number | null
          report_date: string | null
          total_revenue: number | null
          unique_patients: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_admin_role: {
        Args: { user_email: string }
        Returns: undefined
      }
      generate_mrn: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_ticket_token: {
        Args: { queue_prefix: string }
        Returns: string
      }
      get_user_with_roles: {
        Args: { user_uuid: string }
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone_mobile: string
          roles: string[]
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_all_users_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone_mobile: string
          roles: string[]
          status: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "reception"
        | "clinician"
        | "billing"
        | "manager"
        | "patient"
      appointment_source:
        | "call_center"
        | "website"
        | "walk_in"
        | "mobile_app"
        | "referral"
      appointment_status:
        | "booked"
        | "confirmed"
        | "arrived"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
        | "rescheduled"
      assessment_stage: "S1" | "S2" | "S3" | "SA_online"
      consent_type:
        | "general_treatment"
        | "data_privacy"
        | "photography"
        | "telehealth"
        | "package_treatment"
        | "research"
      day_of_week:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
      gender_identity:
        | "male"
        | "female"
        | "non_binary"
        | "prefer_not_to_say"
        | "other"
      invoice_status:
        | "draft"
        | "issued"
        | "paid"
        | "partial"
        | "refunded"
        | "void"
      note_type:
        | "subjective"
        | "objective"
        | "assessment"
        | "plan"
        | "discharge"
        | "admin"
        | "follow_up"
        | "message"
      order_status:
        | "draft"
        | "billed_pending_payment"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      order_type: "lab" | "imaging" | "procedure" | "other"
      payment_method:
        | "cash"
        | "card"
        | "bank"
        | "mobile_money"
        | "wallet"
        | "insurance"
        | "online"
      priority_level: "routine" | "stat" | "vip"
      protocol_status:
        | "draft"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      queue_type:
        | "triage"
        | "doctor"
        | "lab"
        | "imaging"
        | "cashier"
        | "pharmacy"
      registration_status: "pending" | "consented" | "paid" | "completed"
      schedule_type: "regular" | "override" | "leave"
      sex_at_birth: "male" | "female" | "intersex" | "unknown"
      ticket_status: "waiting" | "called" | "no_show" | "served" | "transferred"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "reception",
        "clinician",
        "billing",
        "manager",
        "patient",
      ],
      appointment_source: [
        "call_center",
        "website",
        "walk_in",
        "mobile_app",
        "referral",
      ],
      appointment_status: [
        "booked",
        "confirmed",
        "arrived",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
        "rescheduled",
      ],
      assessment_stage: ["S1", "S2", "S3", "SA_online"],
      consent_type: [
        "general_treatment",
        "data_privacy",
        "photography",
        "telehealth",
        "package_treatment",
        "research",
      ],
      day_of_week: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      gender_identity: [
        "male",
        "female",
        "non_binary",
        "prefer_not_to_say",
        "other",
      ],
      invoice_status: [
        "draft",
        "issued",
        "paid",
        "partial",
        "refunded",
        "void",
      ],
      note_type: [
        "subjective",
        "objective",
        "assessment",
        "plan",
        "discharge",
        "admin",
        "follow_up",
        "message",
      ],
      order_status: [
        "draft",
        "billed_pending_payment",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      order_type: ["lab", "imaging", "procedure", "other"],
      payment_method: [
        "cash",
        "card",
        "bank",
        "mobile_money",
        "wallet",
        "insurance",
        "online",
      ],
      priority_level: ["routine", "stat", "vip"],
      protocol_status: ["draft", "active", "on_hold", "completed", "cancelled"],
      queue_type: ["triage", "doctor", "lab", "imaging", "cashier", "pharmacy"],
      registration_status: ["pending", "consented", "paid", "completed"],
      schedule_type: ["regular", "override", "leave"],
      sex_at_birth: ["male", "female", "intersex", "unknown"],
      ticket_status: ["waiting", "called", "no_show", "served", "transferred"],
    },
  },
} as const
