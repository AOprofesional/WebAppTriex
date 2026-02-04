import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadDocument, getSignedUrl } from '../utils/storage';
import { checkNotificationEnabled } from './useAutoNotificationSettings';

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
    document_types?: {
        name: string;
    };
}

export interface PassengerDocument {
    id: string;
    trip_id: string;
    passenger_id: string;
    required_document_id: string;
    format: 'pdf' | 'image';
    bucket: string | null;
    file_path: string | null;
    mime_type: string | null;
    size: number | null;
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
                const cleanRequirements = requirements.map(req => ({
                    trip_id: tripId,
                    doc_type_id: req.doc_type_id,
                    is_required: req.is_required,
                    description: req.description,
                    due_date: req.due_date
                }));

                const { error } = await supabase
                    .from('required_documents')
                    .insert(cleanRequirements);

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

            // Generate ID client-side
            const docId = crypto.randomUUID();

            // Upload file using imported utility first
            const uploadResult = await uploadDocument(
                file,
                data.trip_id,
                data.passenger_id,
                docId
            );

            if (uploadResult.error) throw new Error(uploadResult.error);

            // Create document record with full data
            const { data: doc, error: insertError } = await supabase
                .from('passenger_documents')
                .insert([{
                    id: docId,
                    ...data,
                    status: 'uploaded', // Pending review
                    uploaded_at: new Date().toISOString(),
                    bucket: uploadResult.bucket,
                    file_path: uploadResult.filePath,
                    mime_type: uploadResult.mimeType,
                    size: uploadResult.size
                }])
                .select()
                .single();

            if (insertError) {
                // If insert fails, we should technically clean up the file, but for now throwing is safer
                console.error('Insert failed after upload', insertError);
                throw insertError;
            }

            return { data: doc, error: null };
        } catch (err: any) {
            console.error('Error uploading document:', err);
            return { data: null, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const deleteDocumentFile = async (id: string, filePath: string) => {
        try {
            setLoading(true);

            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('triex-documents')
                .remove([filePath]);

            if (storageError) {
                // We log but continue to try to update DB if it was just a "file not found" or similar
                console.error('Error deleting file from storage:', storageError);
            }

            // 2. Clear file metadata in DB
            const { error: dbError } = await supabase
                .from('passenger_documents')
                .update({
                    bucket: null,
                    file_path: null,
                    mime_type: null,
                    size: null
                })
                .eq('id', id);

            if (dbError) throw dbError;

            await fetchPassengerDocuments();
            return { error: null };
        } catch (err: any) {
            console.error('Error deleting document file:', err);
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Completely deletes a document (file + database record)
     * Unlike deleteDocumentFile which keeps the record
     */
    const deleteDocument = async (id: string, filePath: string | null) => {
        try {
            setLoading(true);

            // 1. Delete file from storage if exists
            if (filePath) {
                const { error: storageError } = await supabase.storage
                    .from('triex-documents')
                    .remove([filePath]);

                if (storageError) {
                    console.error('Error deleting file from storage:', storageError);
                    // Continue anyway - file might not exist
                }
            }

            // 2. Delete database record completely
            const { error: dbError } = await supabase
                .from('passenger_documents')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            await fetchPassengerDocuments();
            return { error: null };
        } catch (err: any) {
            console.error('Error deleting document:', err);
            return { error: err.message };
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

            // Create notification if enabled
            if (doc) {
                const notificationType = status === 'approved' ? 'doc_approved' : 'doc_rejected';
                const eventKey = status === 'approved' ? 'document_approved' : 'document_approved'; // Both use same setting

                // Check if notifications are enabled for this event
                const isEnabled = await checkNotificationEnabled(eventKey);

                if (isEnabled) {
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

    const getDocumentSignedUrl = async (filePath: string) => {
        return await getSignedUrl('triex-documents', filePath);
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
        deleteDocumentFile,
        deleteDocument,
        getDocumentSignedUrl,
    };
};
