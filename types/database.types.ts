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
            passenger_documents: {
                Row: {
                    file_url: string | null
                    id: string
                    notes: string | null
                    passenger_id: string
                    requirement_id: string
                    status: string | null
                    updated_at: string | null
                }
                Insert: {
                    file_url?: string | null
                    id?: string
                    notes?: string | null
                    passenger_id: string
                    requirement_id: string
                    status?: string | null
                    updated_at?: string | null
                }
                Update: {
                    file_url?: string | null
                    id?: string
                    notes?: string | null
                    passenger_id?: string
                    requirement_id?: string
                    status?: string | null
                    updated_at?: string | null
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
                        foreignKeyName: "passenger_documents_requirement_id_fkey"
                        columns: ["requirement_id"]
                        isOneToOne: false
                        referencedRelation: "trip_documents_requirements"
                        referencedColumns: ["id"]
                    },
                ]
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
                    birth_date: string | null
                    created_at: string | null
                    created_by: string | null
                    cuil: string | null
                    document_number: string | null
                    document_type: string | null
                    email: string
                    first_name: string
                    id: string
                    is_recurrent: boolean | null
                    last_name: string
                    notes: string | null
                    passenger_type_id: number | null
                    phone: string | null
                    profile_id: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    archived_at?: string | null
                    birth_date?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    cuil?: string | null
                    document_number?: string | null
                    document_type?: string | null
                    email: string
                    first_name: string
                    id?: string
                    is_recurrent?: boolean | null
                    last_name: string
                    notes?: string | null
                    passenger_type_id?: number | null
                    phone?: string | null
                    profile_id?: string | null
                    updated_at?: string | null
                    updated_by?: string | null
                }
                Update: {
                    archived_at?: string | null
                    birth_date?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    cuil?: string | null
                    document_number?: string | null
                    document_type?: string | null
                    email?: string
                    first_name?: string
                    id?: string
                    is_recurrent?: boolean | null
                    last_name?: string
                    notes?: string | null
                    passenger_type_id?: number | null
                    phone?: string | null
                    profile_id?: string | null
                    updated_at?: string | null
                    updated_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "passengers_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
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
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "passengers_updated_by_fkey"
                        columns: ["updated_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    created_at: string | null
                    email: string | null
                    full_name: string | null
                    id: string
                    role: string
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id: string
                    role?: string
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    role?: string
                    updated_at?: string | null
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
            trip_passengers: {
                Row: {
                    created_at: string | null
                    id: string
                    passenger_id: string
                    role_type: string | null
                    trip_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    passenger_id: string
                    role_type?: string | null
                    trip_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    passenger_id?: string
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
                        foreignKeyName: "trip_passengers_trip_id_fkey"
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
                    includes_text: string | null
                    internal_code: string | null
                    main_provider: string | null
                    name: string
                    next_step_cta_label: string | null
                    next_step_cta_route: string | null
                    next_step_detail: string | null
                    next_step_title: string | null
                    next_step_type: string | null
                    notes: string | null
                    origin: string | null
                    start_date: string
                    status_commercial: string | null
                    status_operational: string | null
                    trip_type: string | null
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    archived_at?: string | null
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
                    includes_text?: string | null
                    internal_code?: string | null
                    main_provider?: string | null
                    name: string
                    next_step_cta_label?: string | null
                    next_step_cta_route?: string | null
                    next_step_detail?: string | null
                    next_step_title?: string | null
                    next_step_type?: string | null
                    notes?: string | null
                    origin?: string | null
                    start_date: string
                    status_commercial?: string | null
                    status_operational?: string | null
                    trip_type?: string | null
                    updated_at?: string | null
                    updated_by?: string | null
                }
                Update: {
                    archived_at?: string | null
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
                    includes_text?: string | null
                    internal_code?: string | null
                    main_provider?: string | null
                    name?: string
                    next_step_cta_label?: string | null
                    next_step_cta_route?: string | null
                    next_step_detail?: string | null
                    next_step_title?: string | null
                    next_step_type?: string | null
                    notes?: string | null
                    origin?: string | null
                    start_date?: string
                    status_commercial?: string | null
                    status_operational?: string | null
                    trip_type?: string | null
                    updated_at?: string | null
                    updated_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "trips_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "trips_updated_by_fkey"
                        columns: ["updated_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            vouchers: {
                Row: {
                    archived_at: string | null
                    available_from: string | null
                    category: string | null
                    created_at: string | null
                    description: string | null
                    external_url: string | null
                    file_url: string | null
                    format: string | null
                    id: string
                    passenger_id: string | null
                    title: string
                    trip_id: string | null
                    updated_at: string | null
                    uploaded_by: string | null
                }
                Insert: {
                    archived_at?: string | null
                    available_from?: string | null
                    category?: string | null
                    created_at?: string | null
                    description?: string | null
                    external_url?: string | null
                    file_url?: string | null
                    format?: string | null
                    id?: string
                    passenger_id?: string | null
                    title: string
                    trip_id?: string | null
                    updated_at?: string | null
                    uploaded_by?: string | null
                }
                Update: {
                    archived_at?: string | null
                    available_from?: string | null
                    category?: string | null
                    created_at?: string | null
                    description?: string | null
                    external_url?: string | null
                    file_url?: string | null
                    format?: string | null
                    id?: string
                    passenger_id?: string | null
                    title?: string
                    trip_id?: string | null
                    updated_at?: string | null
                    uploaded_by?: string | null
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
                        foreignKeyName: "vouchers_trip_id_fkey"
                        columns: ["trip_id"]
                        isOneToOne: false
                        referencedRelation: "trips"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "vouchers_uploaded_by_fkey"
                        columns: ["uploaded_by"]
                        isOneToOne: false
                        referencedRelation: "users"
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
                Relationships: []
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
                    notes: string | null
                    passenger_type_id: number | null
                    phone: string | null
                    profile_id: string | null
                    type_code: string | null
                    type_name: string | null
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
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Functions: {
            auto_update_trip_status: {
                Args: Record<PropertyKey, never>
                Returns: undefined
            }
            check_email_archived: {
                Args: {
                    email_to_check: string
                }
                Returns: boolean
            }
            check_passenger_archived: {
                Args: {
                    passenger_id: string
                }
                Returns: boolean
            }
            claim_passenger: {
                Args: {
                    passenger_id: string
                }
                Returns: Json
            }
            delete_passenger_cascade: {
                Args: {
                    passenger_id: string
                }
                Returns: Json
            }
            get_my_role: {
                Args: Record<PropertyKey, never>
                Returns: string
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

type DefaultSchema = Database["public"]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
}
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
}
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
}
    ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
}
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {},
    },
} as const
