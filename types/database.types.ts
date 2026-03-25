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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      auto_notification_settings: {
        Row: {
          created_at: string | null
          event_key: string
          event_name: string
          id: string
          is_enabled: boolean | null
          trigger_description: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_key: string
          event_name: string
          id?: string
          is_enabled?: boolean | null
          trigger_description: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_key?: string
          event_name?: string
          id?: string
          is_enabled?: boolean | null
          trigger_description?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      document_types: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          passenger_id: string
          title: string
          trip_id: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          passenger_id: string
          title: string
          trip_id?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          passenger_id?: string
          title?: string
          trip_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "v_admin_passengers_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "v_my_passenger_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      orange_points_ledger: {
        Row: {
          created_at: string | null
          credited_at: string
          expires_at: string
          id: string
          passenger_id: string
          points: number
          reason: string
          redemption_request_id: string | null
          source_passenger_id: string
          status: string
          trip_category: string | null
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credited_at?: string
          expires_at: string
          id?: string
          passenger_id: string
          points: number
          reason: string
          redemption_request_id?: string | null
          source_passenger_id: string
          status?: string
          trip_category?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credited_at?: string
          expires_at?: string
          id?: string
          passenger_id?: string
          points?: number
          reason?: string
          redemption_request_id?: string | null
          source_passenger_id?: string
          status?: string
          trip_category?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orange_points_ledger_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orange_points_ledger_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "v_admin_passengers_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orange_points_ledger_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "v_my_passenger_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orange_points_ledger_redemption_request_id_fkey"
            columns: ["redemption_request_id"]
            isOneToOne: false
            referencedRelation: "redemption_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orange_points_ledger_source_passenger_id_fkey"
            columns: ["source_passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orange_points_ledger_source_passenger_id_fkey"
            columns: ["source_passenger_id"]
            isOneToOne: false
            referencedRelation: "v_admin_passengers_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orange_points_ledger_source_passenger_id_fkey"
            columns: ["source_passenger_id"]
            isOneToOne: false
            referencedRelation: "v_my_passenger_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orange_points_ledger_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      passenger_documents: {
        Row: {
          archived_at: string | null
          bucket: string | null
          created_at: string | null
          file_path: string | null
          format: string
          id: string
          mime_type: string | null
          passenger_id: string
          required_document_id: string
          review_comment: string | null
          reviewed_at: string | null
          size: number | null
          status: string | null
          trip_id: string
          updated_at: string | null
          uploaded_at: string | null
        }
        Insert: {
          archived_at?: string | null
          bucket?: string | null
          created_at?: string | null
          file_path?: string | null
          format: string
          id?: string
          mime_type?: string | null
          passenger_id: string
          required_document_id: string
          review_comment?: string | null
          reviewed_at?: string | null
          size?: number | null
          status?: string | null
          trip_id: string
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Update: {
          archived_at?: string | null
          bucket?: string | null
          created_at?: string | null
          file_path?: string | null
          format?: string
          id?: string
          mime_type?: string | null
          passenger_id?: string
          required_document_id?: string
          review_comment?: string | null
          reviewed_at?: string | null
          size?: number | null
          status?: string | null
          trip_id?: string
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passenger_documents_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_documents_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "v_admin_passengers_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_documents_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "v_my_passenger_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_documents_required_document_id_fkey"
            columns: ["required_document_id"]
            isOneToOne: false
            referencedRelation: "required_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      passenger_purge_log: {
        Row: {
          archived_at: string
          deleted_counts: Json
          id: string
          passenger_email: string
          passenger_id: string
          passenger_name: string
          purged_at: string
          purged_by: string | null
          total_deleted: number
        }
        Insert: {
          archived_at: string
          deleted_counts: Json
          id?: string
          passenger_email: string
          passenger_id: string
          passenger_name: string
          purged_at?: string
          purged_by?: string | null
          total_deleted: number
        }
        Update: {
          archived_at?: string
          deleted_counts?: Json
          id?: string
          passenger_email?: string
          passenger_id?: string
          passenger_name?: string
          purged_at?: string
          purged_by?: string | null
          total_deleted?: number
        }
        Relationships: []
      }
      passenger_types: {
        Row: {
          code: string
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id: number
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      passengers: {
        Row: {
          archived_at: string | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          created_by: string | null
          cuil: string | null
          document_number: string | null
          document_type: string | null
          email: string
          first_name: string
          id: string
          is_orange_member: boolean | null
          is_recurrent: boolean | null
          last_name: string
          notes: string | null
          notification_preferences: Json | null
          orange_member_number: string | null
          orange_referral_code: string | null
          passenger_type_id: number | null
          phone: string | null
          profile_id: string | null
          referral_linked_at: string | null
          referred_by_code_raw: string | null
          referred_by_passenger_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          created_by?: string | null
          cuil?: string | null
          document_number?: string | null
          document_type?: string | null
          email: string
          first_name: string
          id?: string
          is_orange_member?: boolean | null
          is_recurrent?: boolean | null
          last_name: string
          notes?: string | null
          notification_preferences?: Json | null
          orange_member_number?: string | null
          orange_referral_code?: string | null
          passenger_type_id?: number | null
          phone?: string | null
          profile_id?: string | null
          referral_linked_at?: string | null
          referred_by_code_raw?: string | null
          referred_by_passenger_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          created_by?: string | null
          cuil?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string
          first_name?: string
          id?: string
          is_orange_member?: boolean | null
          is_recurrent?: boolean | null
          last_name?: string
          notes?: string | null
          notification_preferences?: Json | null
          orange_member_number?: string | null
          orange_referral_code?: string | null
          passenger_type_id?: number | null
          phone?: string | null
          profile_id?: string | null
          referral_linked_at?: string | null
          referred_by_code_raw?: string | null
          referred_by_passenger_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passengers_passenger_type_id_fkey"
            columns: ["passenger_type_id"]
            isOneToOne: false
            referencedRelation: "passenger_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passengers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passengers_referred_by_passenger_id_fkey"
            columns: ["referred_by_passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passengers_referred_by_passenger_id_fkey"
            columns: ["referred_by_passenger_id"]
            isOneToOne: false
            referencedRelation: "v_admin_passengers_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passengers_referred_by_passenger_id_fkey"
            columns: ["referred_by_passenger_id"]
            isOneToOne: false
            referencedRelation: "v_my_passenger_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          banned_until: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          banned_until?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          banned_until?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      redemption_requests: {
        Row: {
          admin_comment: string | null
          comment: string | null
          created_at: string | null
          id: string
          passenger_id: string
          points_amount: number
          processed_at: string | null
          processed_by: string | null
          status: string
          type: string
        }
        Insert: {
          admin_comment?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          passenger_id: string
          points_amount: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          type: string
        }
        Update: {
          admin_comment?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          passenger_id?: string
          points_amount?: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemption_requests_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemption_requests_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "v_admin_passengers_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemption_requests_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "v_my_passenger_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      required_documents: {
        Row: {
          created_at: string | null
          description: string | null
          doc_type_id: string
          due_date: string | null
          id: string
          is_required: boolean | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          doc_type_id: string
          due_date?: string | null
          id?: string
          is_required?: boolean | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          doc_type_id?: string
          due_date?: string | null
          id?: string
          is_required?: boolean | null
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "required_documents_doc_type_id_fkey"
            columns: ["doc_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "required_documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_settings: {
        Row: {
          comment_placeholder: string
          google_review_url: string | null
          id: number
          is_active: boolean
          q1_text: string
          q2_text: string
          q3_text: string
          updated_at: string | null
        }
        Insert: {
          comment_placeholder?: string
          google_review_url?: string | null
          id: number
          is_active?: boolean
          q1_text?: string
          q2_text?: string
          q3_text?: string
          updated_at?: string | null
        }
        Update: {
          comment_placeholder?: string
          google_review_url?: string | null
          id?: number
          is_active?: boolean
          q1_text?: string
          q2_text?: string
          q3_text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_encrypted: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      trip_documents_requirements: {
        Row: {
          archived_at: string | null
          created_at: string | null
          doc_name: string
          due_date: string | null
          id: string
          is_required: boolean | null
          trip_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          doc_name: string
          due_date?: string | null
          id?: string
          is_required?: boolean | null
          trip_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          doc_name?: string
          due_date?: string | null
          id?: string
          is_required?: boolean | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_documents_requirements_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_itinerary_days: {
        Row: {
          archived_at: string | null
          created_at: string | null
          date: string | null
          day_number: number
          id: string
          sort_index: number
          title: string | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          date?: string | null
          day_number: number
          id?: string
          sort_index?: number
          title?: string | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          date?: string | null
          day_number?: number
          id?: string
          sort_index?: number
          title?: string | null
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_itinerary_days_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_itinerary_items: {
        Row: {
          archived_at: string | null
          created_at: string | null
          day_id: string
          description: string | null
          id: string
          instructions_text: string | null
          instructions_url: string | null
          location_detail: string | null
          location_name: string | null
          sort_index: number
          time: string | null
          title: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          day_id: string
          description?: string | null
          id?: string
          instructions_text?: string | null
          instructions_url?: string | null
          location_detail?: string | null
          location_name?: string | null
          sort_index?: number
          time?: string | null
          title: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          day_id?: string
          description?: string | null
          id?: string
          instructions_text?: string | null
          instructions_url?: string | null
          location_detail?: string | null
          location_name?: string | null
          sort_index?: number
          time?: string | null
          title?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_itinerary_items_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "trip_itinerary_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_itinerary_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_passengers: {
        Row: {
          created_at: string | null
          id: string
          passenger_id: string
          referral_points_awarded: boolean | null
          referral_points_awarded_at: string | null
          role_type: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          passenger_id: string
          referral_points_awarded?: boolean | null
          referral_points_awarded_at?: string | null
          role_type?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          passenger_id?: string
          referral_points_awarded?: boolean | null
          referral_points_awarded_at?: string | null
          role_type?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_passengers_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_passengers_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "v_admin_passengers_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_passengers_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "v_my_passenger_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_passengers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_surveys: {
        Row: {
          comment: string | null
          id: string
          nps: number | null
          passenger_id: string
          rating_attention: number | null
          rating_organization: number | null
          responded_at: string
          trip_id: string
          rating_general: number | null
          destination_expectation: string | null
          services_ratings: Json | null
          had_incident: boolean | null
          incident_comment: string | null
          would_buy_again: string | null
        }
        Insert: {
          comment?: string | null
          id?: string
          nps?: number | null
          passenger_id: string
          rating_attention?: number | null
          rating_organization?: number | null
          responded_at?: string
          trip_id: string
          rating_general?: number | null
          destination_expectation?: string | null
          services_ratings?: Json | null
          had_incident?: boolean | null
          incident_comment?: string | null
          would_buy_again?: string | null
        }
        Update: {
          comment?: string | null
          id?: string
          nps?: number | null
          passenger_id?: string
          rating_attention?: number | null
          rating_organization?: number | null
          responded_at?: string
          trip_id?: string
          rating_general?: number | null
          destination_expectation?: string | null
          services_ratings?: Json | null
          had_incident?: boolean | null
          incident_comment?: string | null
          would_buy_again?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_surveys_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_surveys_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "v_admin_passengers_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_surveys_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "v_my_passenger_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_surveys_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          archived_at: string | null
          banner_image_url: string | null
          brand_sub: string | null
          coordinator_email: string | null
          coordinator_name: string | null
          coordinator_phone: string | null
          created_at: string | null
          created_by: string | null
          departure_date: string | null
          destination: string
          emergency_contact: string | null
          end_date: string
          excludes_text: string | null
          general_itinerary: string | null
          id: string
          image_url: string | null
          includes_text: string | null
          internal_code: string | null
          main_provider: string | null
          name: string
          next_step_cta_label: string | null
          next_step_cta_label_override: string | null
          next_step_cta_route: string | null
          next_step_cta_route_override: string | null
          next_step_detail: string | null
          next_step_detail_override: string | null
          next_step_override_enabled: boolean | null
          next_step_title: string | null
          next_step_title_override: string | null
          next_step_type: string | null
          next_step_type_override: string | null
          notes: string | null
          origin: string | null
          purchase_confirmed: boolean | null
          purchase_confirmed_at: string | null
          start_date: string
          status_commercial: string | null
          status_operational: string | null
          trip_category: string | null
          trip_type: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          banner_image_url?: string | null
          brand_sub?: string | null
          coordinator_email?: string | null
          coordinator_name?: string | null
          coordinator_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          departure_date?: string | null
          destination: string
          emergency_contact?: string | null
          end_date: string
          excludes_text?: string | null
          general_itinerary?: string | null
          id?: string
          image_url?: string | null
          includes_text?: string | null
          internal_code?: string | null
          main_provider?: string | null
          name: string
          next_step_cta_label?: string | null
          next_step_cta_label_override?: string | null
          next_step_cta_route?: string | null
          next_step_cta_route_override?: string | null
          next_step_detail?: string | null
          next_step_detail_override?: string | null
          next_step_override_enabled?: boolean | null
          next_step_title?: string | null
          next_step_title_override?: string | null
          next_step_type?: string | null
          next_step_type_override?: string | null
          notes?: string | null
          origin?: string | null
          purchase_confirmed?: boolean | null
          purchase_confirmed_at?: string | null
          start_date: string
          status_commercial?: string | null
          status_operational?: string | null
          trip_category?: string | null
          trip_type?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          banner_image_url?: string | null
          brand_sub?: string | null
          coordinator_email?: string | null
          coordinator_name?: string | null
          coordinator_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          departure_date?: string | null
          destination?: string
          emergency_contact?: string | null
          end_date?: string
          excludes_text?: string | null
          general_itinerary?: string | null
          id?: string
          image_url?: string | null
          includes_text?: string | null
          internal_code?: string | null
          main_provider?: string | null
          name?: string
          next_step_cta_label?: string | null
          next_step_cta_label_override?: string | null
          next_step_cta_route?: string | null
          next_step_cta_route_override?: string | null
          next_step_detail?: string | null
          next_step_detail_override?: string | null
          next_step_override_enabled?: boolean | null
          next_step_title?: string | null
          next_step_title_override?: string | null
          next_step_type?: string | null
          next_step_type_override?: string | null
          notes?: string | null
          origin?: string | null
          purchase_confirmed?: boolean | null
          purchase_confirmed_at?: string | null
          start_date?: string
          status_commercial?: string | null
          status_operational?: string | null
          trip_category?: string | null
          trip_type?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      voucher_types: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          archived_at: string | null
          bucket: string | null
          created_at: string | null
          external_url: string | null
          file_path: string | null
          format: string
          id: string
          mime_type: string | null
          notes: string | null
          passenger_id: string | null
          provider_name: string | null
          service_date: string | null
          size: number | null
          status: string
          title: string
          trip_id: string | null
          type_id: string
          updated_at: string | null
          visibility: string
        }
        Insert: {
          archived_at?: string | null
          bucket?: string | null
          created_at?: string | null
          external_url?: string | null
          file_path?: string | null
          format: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          passenger_id?: string | null
          provider_name?: string | null
          service_date?: string | null
          size?: number | null
          status?: string
          title: string
          trip_id?: string | null
          type_id: string
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          archived_at?: string | null
          bucket?: string | null
          created_at?: string | null
          external_url?: string | null
          file_path?: string | null
          format?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          passenger_id?: string | null
          provider_name?: string | null
          service_date?: string | null
          size?: number | null
          status?: string
          title?: string
          trip_id?: string | null
          type_id?: string
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "v_admin_passengers_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "v_my_passenger_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "voucher_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_admin_passengers_list: {
        Row: {
          archived_at: string | null
          created_at: string | null
          document_number: string | null
          document_type: string | null
          first_name: string | null
          id: string | null
          is_recurrent: boolean | null
          last_name: string | null
          passenger_email: string | null
          phone: string | null
          type_code: string | null
          type_name: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passengers_profile_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_my_passenger_profile: {
        Row: {
          birth_date: string | null
          created_at: string | null
          cuil: string | null
          document_number: string | null
          document_type: string | null
          email: string | null
          first_name: string | null
          id: string | null
          is_recurrent: boolean | null
          last_name: string | null
          passenger_type_code: string | null
          passenger_type_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_orange_membership: {
        Args: { p_passenger_id: string }
        Returns: undefined
      }
      auto_update_trip_status: { Args: never; Returns: undefined }
      award_referral_points_for_passenger: {
        Args: { p_passenger_id: string; p_trip_id: string }
        Returns: boolean
      }
      award_referral_points_for_trip: {
        Args: { p_trip_id: string }
        Returns: number
      }
      can_read_voucher_path: {
        Args: { object_name: string; user_id: string }
        Returns: boolean
      }
      claim_passenger_by_email: { Args: never; Returns: Json }
      delete_passenger_cascade: {
        Args: { passenger_id: string }
        Returns: Json
      }
      generate_orange_member_number: { Args: never; Returns: string }
      generate_orange_referral_code: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
      get_my_role_direct: { Args: never; Returns: string }
      get_my_trip_ids: { Args: never; Returns: string[] }
      get_points_for_category: { Args: { p_category: string }; Returns: number }
      is_admin_or_operator: { Args: { user_id: string }; Returns: boolean }
      is_email_archived: { Args: { email_to_check: string }; Returns: boolean }
      is_owner_of_document_path: {
        Args: { object_name: string; user_id: string }
        Returns: boolean
      }
      is_passenger_archived: { Args: never; Returns: boolean }
      is_role: { Args: { required_role: string }; Returns: boolean }
      process_redemption_request: {
        Args: {
          p_admin_comment?: string
          p_request_id: string
          p_status: string
        }
        Returns: Json
      }
      promote_to_admin: { Args: { user_email: string }; Returns: string }
      promote_to_operator: { Args: { user_email: string }; Returns: string }
      purge_archived_passenger: {
        Args: { p_passenger_id: string }
        Returns: Json
      }
      purge_archived_passenger_as: {
        Args: { p_passenger_id: string; p_purged_by: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
