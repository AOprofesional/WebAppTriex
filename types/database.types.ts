export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            trips: {
                Row: {
                    id: string
                    internal_code: string | null
                    name: string
                    destination: string
                    origin: string | null
                    start_date: string
                    end_date: string
                    departure_date: string | null
                    brand_sub: string | null
                    trip_type: string | null
                    status_operational: string | null
                    status_commercial: string | null
                    main_provider: string | null
                    includes_text: string | null
                    excludes_text: string | null
                    general_itinerary: string | null
                    next_step_type: string | null
                    next_step_title: string | null
                    next_step_detail: string | null
                    next_step_cta_label: string | null
                    next_step_cta_route: string | null
                    coordinator_name: string | null
                    coordinator_phone: string | null
                    coordinator_email: string | null
                    emergency_contact: string | null
                    notes: string | null
                    created_at: string | null
                    updated_at: string | null
                    created_by: string | null
                    updated_by: string | null
                    archived_at: string | null
                    next_step_override_enabled: boolean | null
                    next_step_type_override: string | null
                    next_step_title_override: string | null
                    next_step_detail_override: string | null
                    next_step_cta_label_override: string | null
                    next_step_cta_route_override: string | null
                    image_url: string | null
                    trip_category: string | null
                    purchase_confirmed: boolean | null
                    purchase_confirmed_at: string | null
                }
                Insert: {
                    id?: string
                    internal_code?: string | null
                    name: string
                    destination: string
                    origin?: string | null
                    start_date: string
                    end_date: string
                    departure_date?: string | null
                    brand_sub?: string | null
                    trip_type?: string | null
                    status_operational?: string | null
                    status_commercial?: string | null
                    main_provider?: string | null
                    includes_text?: string | null
                    excludes_text?: string | null
                    general_itinerary?: string | null
                    next_step_type?: string | null
                    next_step_title?: string | null
                    next_step_detail?: string | null
                    next_step_cta_label?: string | null
                    next_step_cta_route?: string | null
                    coordinator_name?: string | null
                    coordinator_phone?: string | null
                    coordinator_email?: string | null
                    emergency_contact?: string | null
                    notes?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    created_by?: string | null
                    updated_by?: string | null
                    archived_at?: string | null
                    next_step_override_enabled?: boolean | null
                    next_step_type_override?: string | null
                    next_step_title_override?: string | null
                    next_step_detail_override?: string | null
                    next_step_cta_label_override?: string | null
                    next_step_cta_route_override?: string | null
                    image_url?: string | null
                    trip_category?: string | null
                    purchase_confirmed?: boolean | null
                    purchase_confirmed_at?: string | null
                }
                Update: {
                    id?: string
                    internal_code?: string | null
                    name?: string
                    destination?: string
                    origin?: string | null
                    start_date?: string
                    end_date?: string
                    departure_date?: string | null
                    brand_sub?: string | null
                    trip_type?: string | null
                    status_operational?: string | null
                    status_commercial?: string | null
                    main_provider?: string | null
                    includes_text?: string | null
                    excludes_text?: string | null
                    general_itinerary?: string | null
                    next_step_type?: string | null
                    next_step_title?: string | null
                    next_step_detail?: string | null
                    next_step_cta_label?: string | null
                    next_step_cta_route?: string | null
                    coordinator_name?: string | null
                    coordinator_phone?: string | null
                    coordinator_email?: string | null
                    emergency_contact?: string | null
                    notes?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    created_by?: string | null
                    updated_by?: string | null
                    archived_at?: string | null
                    next_step_override_enabled?: boolean | null
                    next_step_type_override?: string | null
                    next_step_title_override?: string | null
                    next_step_detail_override?: string | null
                    next_step_cta_label_override?: string | null
                    next_step_cta_route_override?: string | null
                    image_url?: string | null
                    trip_category?: string | null
                    purchase_confirmed?: boolean | null
                    purchase_confirmed_at?: string | null
                }
            }
            passengers: {
                Row: {
                    id: string
                    created_at: string | null
                    updated_at: string | null
                    first_name: string
                    last_name: string
                    email: string
                    phone: string | null
                    dni: string | null
                    birth_date: string | null
                    profile_id: string | null
                    created_by: string | null
                    updated_by: string | null
                    archived_at: string | null
                    orange_member_number: string | null
                    orange_referral_code: string | null
                    referred_by_passenger_id: string | null
                    referred_by_code_raw: string | null
                    referral_linked_at: string | null
                    is_orange_member: boolean | null
                }
                Insert: {
                    id?: string
                    created_at?: string | null
                    updated_at?: string | null
                    first_name: string
                    last_name: string
                    email: string
                    phone?: string | null
                    dni?: string | null
                    birth_date?: string | null
                    profile_id?: string | null
                    created_by?: string | null
                    updated_by?: string | null
                    archived_at?: string | null
                    orange_member_number?: string | null
                    orange_referral_code?: string | null
                    referred_by_passenger_id?: string | null
                    referred_by_code_raw?: string | null
                    referral_linked_at?: string | null
                    is_orange_member?: boolean | null
                }
                Update: {
                    id?: string
                    created_at?: string | null
                    updated_at?: string | null
                    first_name?: string
                    last_name?: string
                    email?: string
                    phone?: string | null
                    dni?: string | null
                    birth_date?: string | null
                    profile_id?: string | null
                    created_by?: string | null
                    updated_by?: string | null
                    archived_at?: string | null
                    orange_member_number?: string | null
                    orange_referral_code?: string | null
                    referred_by_passenger_id?: string | null
                    referred_by_code_raw?: string | null
                    referral_linked_at?: string | null
                    is_orange_member?: boolean | null
                }
            }
            vouchers: {
                Row: {
                    id: string
                    trip_id: string | null
                    passenger_id: string | null
                    type_id: string
                    title: string
                    provider_name: string | null
                    service_date: string | null
                    format: string
                    external_url: string | null
                    notes: string | null
                    visibility: string
                    status: string
                    created_at: string | null
                    updated_at: string | null
                    bucket: string | null
                    file_path: string | null
                    mime_type: string | null
                    size: number | null
                    archived_at: string | null
                }
                Insert: {
                    id?: string
                    trip_id?: string | null
                    passenger_id?: string | null
                    type_id: string
                    title: string
                    provider_name?: string | null
                    service_date?: string | null
                    format: string
                    external_url?: string | null
                    notes?: string | null
                    visibility: string
                    status: string
                    created_at?: string | null
                    updated_at?: string | null
                    bucket?: string | null
                    file_path?: string | null
                    mime_type?: string | null
                    size?: number | null
                    archived_at?: string | null
                }
                Update: {
                    id?: string
                    trip_id?: string | null
                    passenger_id?: string | null
                    type_id?: string
                    title?: string
                    provider_name?: string | null
                    service_date?: string | null
                    format?: string
                    external_url?: string | null
                    notes?: string | null
                    visibility?: string
                    status?: string
                    created_at?: string | null
                    updated_at?: string | null
                    bucket?: string | null
                    file_path?: string | null
                    mime_type?: string | null
                    size?: number | null
                    archived_at?: string | null
                }
            }
            trip_documents_requirements: {
                Row: {
                    id: string
                    trip_id: string
                    doc_name: string
                    description: string | null
                    is_required: boolean
                    due_date: string | null
                    created_at: string | null
                    updated_at: string | null
                    created_by: string | null
                    updated_by: string | null
                    archived_at: string | null
                }
                Insert: {
                    id?: string
                    trip_id: string
                    doc_name: string
                    description?: string | null
                    is_required?: boolean
                    due_date?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    created_by?: string | null
                    updated_by?: string | null
                    archived_at?: string | null
                }
                Update: {
                    id?: string
                    trip_id?: string
                    doc_name?: string
                    description?: string | null
                    is_required?: boolean
                    due_date?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    created_by?: string | null
                    updated_by?: string | null
                    archived_at?: string | null
                }
            }
            passenger_documents: {
                Row: {
                    id: string
                    trip_id: string
                    passenger_id: string
                    required_document_id: string
                    format: string
                    bucket: string
                    file_path: string | null
                    mime_type: string | null
                    size: number | null
                    status: string | null
                    review_comment: string | null
                    uploaded_at: string | null
                    reviewed_at: string | null
                    created_at: string | null
                    updated_at: string | null
                    archived_at: string | null
                }
                Insert: {
                    id?: string
                    trip_id: string
                    passenger_id: string
                    required_document_id: string
                    format: string
                    bucket: string
                    file_path?: string | null
                    mime_type?: string | null
                    size?: number | null
                    status?: string | null
                    review_comment?: string | null
                    uploaded_at?: string | null
                    reviewed_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    archived_at?: string | null
                }
                Update: {
                    id?: string
                    trip_id?: string
                    passenger_id?: string
                    required_document_id?: string
                    format?: string
                    bucket?: string
                    file_path?: string | null
                    mime_type?: string | null
                    size?: number | null
                    status?: string | null
                    review_comment?: string | null
                    uploaded_at?: string | null
                    reviewed_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    archived_at?: string | null
                }
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
            }
            trip_passengers: {
                Row: {
                    id: string
                    trip_id: string
                    passenger_id: string
                    created_at: string | null
                    updated_at: string | null
                    referral_points_awarded: boolean | null
                    referral_points_awarded_at: string | null
                }
                Insert: {
                    id?: string
                    trip_id: string
                    passenger_id: string
                    created_at?: string | null
                    updated_at?: string | null
                    referral_points_awarded?: boolean | null
                    referral_points_awarded_at?: string | null
                }
                Update: {
                    id?: string
                    trip_id?: string
                    passenger_id?: string
                    created_at?: string | null
                    updated_at?: string | null
                    referral_points_awarded?: boolean | null
                    referral_points_awarded_at?: string | null
                }
            }
            orange_points_ledger: {
                Row: {
                    id: string
                    passenger_id: string
                    source_passenger_id: string
                    trip_id: string | null
                    points: number
                    reason: string
                    trip_category: string | null
                    credited_at: string
                    expires_at: string
                    status: string
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    passenger_id: string
                    source_passenger_id: string
                    trip_id?: string | null
                    points: number
                    reason: string
                    trip_category?: string | null
                    credited_at?: string
                    expires_at: string
                    status?: string
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    passenger_id?: string
                    source_passenger_id?: string
                    trip_id?: string | null
                    points?: number
                    reason?: string
                    trip_category?: string | null
                    credited_at?: string
                    expires_at?: string
                    status?: string
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
