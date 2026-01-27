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
            points_history: {
                Row: {
                    amount: number
                    created_at: string | null
                    description: string | null
                    id: string
                    passenger_id: string
                    type: string
                }
                Insert: {
                    amount: number
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    passenger_id: string
                    type: string
                }
                Update: {
                    amount?: number
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    passenger_id?: string
                    type?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "points_history_passenger_id_fkey"
                        columns: ["passenger_id"]
                        isOneToOne: false
                        referencedRelation: "passengers"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "points_history_passenger_id_fkey"
                        columns: ["passenger_id"]
                        isOneToOne: false
                        referencedRelation: "v_admin_passengers_list"
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
                }
                Insert: {
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id: string
                    role?: string
                }
                Update: {
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    role?: string
                }
                Relationships: []
            }
            trip_passengers: {
                Row: {
                    created_at: string | null
                    id: string
                    passenger_id: string
                    trip_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    passenger_id: string
                    trip_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    passenger_id?: string
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
                    created_at: string | null
                    created_by: string | null
                    departure_date: string
                    destination: string
                    end_date: string
                    id: string
                    notes: string | null
                    origin: string
                    start_date: string
                    status: string
                    title: string
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    created_at?: string | null
                    created_by?: string | null
                    departure_date: string
                    destination: string
                    end_date: string
                    id?: string
                    notes?: string | null
                    origin: string
                    start_date: string
                    status?: string
                    title: string
                    updated_at?: string | null
                    updated_by?: string | null
                }
                Update: {
                    created_at?: string | null
                    created_by?: string | null
                    departure_date?: string
                    destination?: string
                    end_date?: string
                    id?: string
                    notes?: string | null
                    origin?: string
                    start_date?: string
                    status?: string
                    title?: string
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
                    created_at: string | null
                    file_path: string
                    file_type: string
                    id: string
                    notes: string | null
                    passenger_id: string
                    trip_id: string | null
                    uploaded_by: string | null
                }
                Insert: {
                    created_at?: string | null
                    file_path: string
                    file_type: string
                    id?: string
                    notes?: string | null
                    passenger_id: string
                    trip_id?: string | null
                    uploaded_by?: string | null
                }
                Update: {
                    created_at?: string | null
                    file_path?: string
                    file_type?: string
                    id?: string
                    notes?: string | null
                    passenger_id?: string
                    trip_id?: string | null
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
                        foreignKeyName: "vouchers_passenger_id_fkey"
                        columns: ["passenger_id"]
                        isOneToOne: false
                        referencedRelation: "v_admin_passengers_list"
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
                Insert: {
                    archived_at?: string | null
                    created_at?: string | null
                    document_number?: string | null
                    document_type?: string | null
                    first_name?: string | null
                    id?: string | null
                    is_recurrent?: boolean | null
                    last_name?: string | null
                    passenger_email?: string | null
                    phone?: string | null
                    type_code?: string | null
                    type_name?: string | null
                    user_id?: string | null
                }
                Update: {
                    archived_at?: string | null
                    created_at?: string | null
                    document_number?: string | null
                    document_type?: string | null
                    first_name?: string | null
                    id?: string | null
                    is_recurrent?: boolean | null
                    last_name?: string | null
                    passenger_email?: string | null
                    phone?: string | null
                    type_code?: string | null
                    type_name?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
        }
        Functions: {
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

type DefaultSchema = Database['public']

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
}
    ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
}
    ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof Database },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
}
    ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
}
    ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {},
    },
} as const
