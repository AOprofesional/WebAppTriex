// Generated Supabase Types
export type Database = {
    public: {
        Tables: {
            passengers: {
                Row: {
                    id: string
                    profile_id: string | null
                    first_name: string
                    last_name: string
                    email: string
                    phone: string | null
                    birth_date: string | null
                    cuil: string | null
                    document_type: string | null
                    document_number: string | null
                    passenger_type_id: number | null
                    is_recurrent: boolean | null
                    notes: string | null
                    created_at: string | null
                    updated_at: string | null
                    created_by: string | null
                    updated_by: string | null
                }
                Insert: {
                    id?: string
                    profile_id?: string | null
                    first_name: string
                    last_name: string
                    email: string
                    phone?: string | null
                    birth_date?: string | null
                    cuil?: string | null
                    document_type?: string | null
                    document_number?: string | null
                    passenger_type_id?: number | null
                    is_recurrent?: boolean | null
                    notes?: string | null
                    created_by?: string | null
                    updated_by?: string | null
                }
                Update: {
                    first_name?: string
                    last_name?: string
                    email?: string
                    phone?: string | null
                    birth_date?: string | null
                    cuil?: string | null
                    document_type?: string | null
                    document_number?: string | null
                    passenger_type_id?: number | null
                    is_recurrent?: boolean | null
                    notes?: string | null
                    updated_by?: string | null
                }
            }
            passenger_types: {
                Row: {
                    id: number
                    code: string
                    name: string
                    created_at: string | null
                }
            }
        }
        Views: {
            v_admin_passengers_list: {
                Row: {
                    id: string
                    profile_id: string | null
                    auth_email: string | null
                    profile_role: string | null
                    profile_full_name: string | null
                    first_name: string
                    last_name: string
                    passenger_email: string
                    phone: string | null
                    birth_date: string | null
                    cuil: string | null
                    document_type: string | null
                    document_number: string | null
                    type_code: string | null
                    type_name: string | null
                    is_recurrent: boolean | null
                    notes: string | null
                    created_at: string | null
                    updated_at: string | null
                    created_by_email: string | null
                    updated_by_email: string | null
                }
            }
        }
    }
}
