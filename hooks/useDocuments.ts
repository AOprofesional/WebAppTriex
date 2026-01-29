import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadDocument, getSignedUrl } from '../utils/storage';

export interface DocumentType {
    id: string;
    name: string;
    is_active: boolean;
}

export interface RequiredDocument {
    id: string;
    trip_id: string;
    doc_type_id: string;
    is_required: boolean;
    description: string | null;
    due_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface PassengerDocument {
    id: string;
    trip_id: string;
    passenger_id: string;
    required_document_id: string;
    format: 'pdf' | 'image';
    file_url: string;
    status: 'pending' | 'uploaded' | 'approved' | 'rejected';
    review_comment: string | null;
    uploaded_at: string | null;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
}

export const useDocuments = () => {
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
    const [passengerDocuments, setPassengerDocuments] = useState<PassengerDocument[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchDocumentTypes = async () => {
        try {
            const { data, error } = await supabase
                .from('document_types')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setDocumentTypes(data || []);
            return { data, error: null };
        } catch (err: any) {
            console.error('Error fetching document types:', err);
            return { data: null, error: err.message };
        }
    };

    const fetchRequiredDocuments = async (tripId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('required_documents')
                .select('*, document_types(name)')
                .eq('trip_id', tripId)
                .order('created_at');

            if (error) throw error;
            setRequiredDocuments(data || []);
            return { data, error: null };
        } catch (err: any) {
            console.error('Error fetching required documents:', err);
            return { data: null, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const saveRequiredDocuments = async (tripId: string, requirements: Partial<RequiredDocument>[]) => {
        try {
            setLoading(true);

            // Delete existing requirements
            await supabase
                .from('required_documents')
                .delete()
                .eq('trip_id', tripId);

            // Insert new requirements
            if (requirements.length > 0) {
                const { error } = await supabase
                    .from('required_documents')
                    .insert(requirements.map(req => ({ ...req, trip_id: tripId })));

                if (error) throw error;
            }

            await fetchRequiredDocuments(tripId);
            return { error: null };
        } catch (err: any) {
            console.error('Error setting required documents:', err);
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const fetchPassengerDocuments = async (filters?: {
        tripId?: string;
        passengerId?: string;
        status?: string;
    }) => {
        try {
            setLoading(true);
            let query = supabase
                .from('passenger_documents')
                .select('*, passengers(first_name, last_name), required_documents(*, document_types(name))')
                .order('created_at', { ascending: false });

            if (filters?.tripId) query = query.eq('trip_id', filters.tripId);
            if (filters?.passengerId) query = query.eq('passenger_id', filters.passengerId);
            if (filters?.status) query = query.eq('status', filters.status);

            const { data, error } = await query;

            if (error) throw error;
            setPassengerDocuments(data || []);
            return { data, error: null };
        } catch (err: any) {
            console.error('Error fetching passenger documents:', err);
            return { data: null, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const uploadPassengerDocument = async (
        data: {
            trip_id: string;
            passenger_id: string;
            required_document_id: string;
            format: 'pdf' | 'image';
        },
        file: File
    ) => {
        try {
            setLoading(true);

            // Create document record
            const { data: doc, error: insertError } = await supabase
                .from('passenger_documents')
                .insert([{
                    ...data,
                    file_url: 'temp', // Temporary value
                    status: 'uploaded',
                    uploaded_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            // Upload file using imported utility
            const uploadResult = await uploadDocument(
                file,
                data.trip_id,
                data.passenger_id,
                doc.id
            );

            if (uploadResult.error) throw new Error(uploadResult.error);

            // Update document with file URL
            const { error: updateError } = await supabase
                .from('passenger_documents')
                .update({ file_url: uploadResult.fileUrl })
                .eq('id', doc.id);

            if (updateError) throw updateError;

            return { data: doc, error: null };
        } catch (err: any) {
            console.error('Error uploading document:', err);
            return { data: null, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const reviewDocument = async (id: string, status: 'approved' | 'rejected', comment?: string) => {
        try {
            setLoading(true);

            // Get document details for notification
            const { data: doc } = await supabase
                .from('passenger_documents')
                .select('*, passengers(id), required_documents(*, document_types(name))')
                .eq('id', id)
                .single();

            // Update document status
            const { error } = await supabase
                .from('passenger_documents')
                .update({
                    status,
                    review_comment: comment || null,
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            // Create notification
            if (doc) {
                const notificationType = status === 'approved' ? 'doc_approved' : 'doc_rejected';
                const title = status === 'approved'
                    ? 'Documento aprobado'
                    : 'Documento rechazado';
                const message = status === 'approved'
                    ? `Tu documento ${doc.required_documents?.document_types?.name} ha sido aprobado`
                    : `Tu documento ${doc.required_documents?.document_types?.name} ha sido rechazado${comment ? `: ${comment}` : ''}`;

                await supabase.from('notifications').insert({
                    passenger_id: doc.passenger_id,
                    trip_id: doc.trip_id,
                    type: notificationType,
                    title,
                    message
                });
            }

            await fetchPassengerDocuments();
            return { error: null };
        } catch (err: any) {
            console.error('Error reviewing document:', err);
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const getDocumentSignedUrl = async (fileUrl: string) => {
        return await getSignedUrl('triex-documents', fileUrl);
    };

    return {
        documentTypes,
        requiredDocuments,
        passengerDocuments,
        loading,
        fetchDocumentTypes,
        fetchRequiredDocuments,
        saveRequiredDocuments,
        fetchPassengerDocuments,
        uploadPassengerDocument,
        reviewDocument,
        getDocumentSignedUrl,
    };
};
