import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadDocument, getSignedUrl } from '../utils/storage';
import { checkNotificationEnabled } from './useAutoNotificationSettings';
import { queryCache } from '../lib/queryCache';

/** Returns current user's uid and role from profiles. */
const getCurrentUserRole = async (): Promise<{ uid: string | null; role: string | null }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { uid: null, role: null };
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    return { uid: user.id, role: profile?.role ?? null };
};

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
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>(() => {
        return queryCache.get<DocumentType[]>('document_types')?.data || [];
    });
    const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
    const [passengerDocuments, setPassengerDocuments] = useState<PassengerDocument[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchDocumentTypes = async () => {
        const cacheKey = 'document_types';
        const cached = queryCache.get<DocumentType[]>(cacheKey);
        if (cached?.data) {
            setDocumentTypes(cached.data);
            if (cached.isFresh) {
                return { data: cached.data, error: null };
            }
        }

        try {
            const { data, error } = await supabase
                .from('document_types')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            const res = data || [];
            setDocumentTypes(res);
            queryCache.set(cacheKey, res);
            return { data: res, error: null };
        } catch (err: any) {
            console.error('Error fetching document types:', err);
            return { data: null, error: err.message };
        }
    };

    const fetchRequiredDocuments = async (tripId: string) => {
        const cacheKey = `required_docs:${tripId}`;
        const cached = queryCache.get<RequiredDocument[]>(cacheKey);
        if (cached?.data) {
            setRequiredDocuments(cached.data);
            if (cached.isFresh) {
                return { data: cached.data, error: null };
            }
        }

        try {
            if (!cached?.data) {
                setLoading(true);
            }
            const { data, error } = await supabase
                .from('required_documents')
                .select('*, document_types(name)')
                .eq('trip_id', tripId)
                .order('created_at');

            if (error) throw error;
            const res = data || [];
            setRequiredDocuments(res);
            queryCache.set(cacheKey, res);
            return { data: res, error: null };
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

            // 1. Fetch existing requirements for this trip
            const { data: existingReqs, error: fetchExistingError } = await supabase
                .from('required_documents')
                .select('id, doc_type_id, is_required, description, due_date')
                .eq('trip_id', tripId);

            if (fetchExistingError) throw fetchExistingError;

            const existing = existingReqs || [];
            const existingIds = existing.map(r => r.id);

            const incomingIds = requirements.map(r => (r as any).id).filter(Boolean) as string[];

            // 2. Determine which existing requirements were REMOVED
            const removedIds = existingIds.filter(id => !incomingIds.includes(id));

            if (removedIds.length > 0) {
                await supabase
                    .from('passenger_documents')
                    .delete()
                    .in('required_document_id', removedIds)
                    .eq('trip_id', tripId);

                await supabase
                    .from('required_documents')
                    .delete()
                    .in('id', removedIds);
            }

            // 4. Insert brand-new requirements
            const newRequirements = requirements.filter(r => !(r as any).id);

            if (newRequirements.length > 0) {
                const cleanRequirements = newRequirements.map(req => ({
                    trip_id: tripId,
                    doc_type_id: req.doc_type_id,
                    is_required: req.is_required,
                    description: req.description,
                    due_date: req.due_date,
                }));

                const { data: insertedReqs, error: insertError } = await supabase
                    .from('required_documents')
                    .insert(cleanRequirements)
                    .select();

                if (insertError) throw insertError;

                // 5. Create passenger_documents for each assigned passenger + each NEW requirement
                const { data: tripPassengers } = await supabase
                    .from('trip_passengers')
                    .select('passenger_id, passengers(profile_id)')
                    .eq('trip_id', tripId);

                if (tripPassengers && tripPassengers.length > 0 && insertedReqs) {
                    const newPassengerDocuments: object[] = [];
                    const userIds: string[] = [];

                    for (const tripPassenger of tripPassengers) {
                        for (const req of insertedReqs) {
                            newPassengerDocuments.push({
                                trip_id: tripId,
                                passenger_id: tripPassenger.passenger_id,
                                required_document_id: req.id,
                                status: 'pending',
                                format: 'pdf',
                            });
                        }

                        const pProfileId = (tripPassenger.passengers as any)?.profile_id;
                        if (pProfileId && !userIds.includes(pProfileId)) {
                            userIds.push(pProfileId);
                        }
                    }

                    if (newPassengerDocuments.length > 0) {
                        await supabase
                            .from('passenger_documents')
                            .insert(newPassengerDocuments);
                    }

                    if (userIds.length > 0) {
                        try {
                            const { data: trip } = await supabase
                                .from('trips')
                                .select('name')
                                .eq('id', tripId)
                                .single();

                            await supabase.functions.invoke('send-push', {
                                body: {
                                    userIds,
                                    title: '📄 Nuevos documentos requeridos',
                                    body: `Se han asignado ${insertedReqs.length} documento(s) para ${trip?.name || 'tu viaje'}`,
                                    url: '/#/my-documents',
                                    tag: 'document-required',
                                },
                            });
                        } catch (notifError) {
                            console.error('Error sending push notification:', notifError);
                        }
                    }
                }
            }

            queryCache.invalidate(`required_docs:${tripId}`);
            queryCache.invalidate('pax_docs:*');
            await fetchRequiredDocuments(tripId);
            return { error: null };
        } catch (err: any) {
            console.error('Error saving required documents:', err);
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
        const cacheKey = `pax_docs:${JSON.stringify(filters || {})}`;
        const cached = queryCache.get<PassengerDocument[]>(cacheKey);
        if (cached?.data) {
            setPassengerDocuments(cached.data);
            if (cached.isFresh) {
                return { data: cached.data, error: null };
            }
        }

        try {
            if (!cached?.data) {
                setLoading(true);
            }

            // Scope to operator's assigned passengers automatically
            const { uid, role } = await getCurrentUserRole();
            const isOperator = role === 'operator';

            let query = supabase
                .from('passenger_documents')
                .select('*, passengers(first_name, last_name), required_documents(*, document_types(name))')
                .order('created_at', { ascending: false });

            if (filters?.tripId) query = query.eq('trip_id', filters.tripId);
            if (filters?.passengerId) query = query.eq('passenger_id', filters.passengerId);
            if (filters?.status) query = query.eq('status', filters.status);

            // If operator, restrict to their assigned passengers
            if (isOperator && uid) {
                const { data: ap } = await supabase
                    .from('passengers')
                    .select('id')
                    .eq('assigned_to', uid)
                    .is('archived_at', null);
                const ids = (ap || []).map(p => p.id);
                query = query.in('passenger_id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000']);
            }

            const { data, error } = await query;

            if (error) throw error;
            const res = data || [];
            setPassengerDocuments(res);
            queryCache.set(cacheKey, res);
            return { data: res, error: null };
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
                    size: uploadResult.size,
                }])
                .select()
                .single();

            if (insertError) {
                console.error('Insert failed after upload', insertError);
                throw insertError;
            }

            queryCache.invalidate('pax_docs:*');
            queryCache.invalidate('passenger_trips:*');
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

            const { error: storageError } = await supabase.storage
                .from('triex-documents')
                .remove([filePath]);

            if (storageError) {
                console.error('Error deleting file from storage:', storageError);
            }

            const { error: dbError } = await supabase
                .from('passenger_documents')
                .update({
                    bucket: null,
                    file_path: null,
                    mime_type: null,
                    size: null,
                })
                .eq('id', id);

            if (dbError) throw dbError;

            queryCache.invalidate('pax_docs:*');
            queryCache.invalidate('passenger_trips:*');
            await fetchPassengerDocuments();
            return { error: null };
        } catch (err: any) {
            console.error('Error deleting document file:', err);
            return { error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const deleteDocument = async (id: string, filePath: string | null) => {
        try {
            setLoading(true);

            if (filePath) {
                const { error: storageError } = await supabase.storage
                    .from('triex-documents')
                    .remove([filePath]);

                if (storageError) {
                    console.error('Error deleting file from storage:', storageError);
                }
            }

            const { error: dbError } = await supabase
                .from('passenger_documents')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            queryCache.invalidate('pax_docs:*');
            queryCache.invalidate('passenger_trips:*');
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

            const { data: doc } = await supabase
                .from('passenger_documents')
                .select('*, passengers(id, user_id), required_documents(*, document_types(name))')
                .eq('id', id)
                .single();

            const { error } = await supabase
                .from('passenger_documents')
                .update({
                    status,
                    review_comment: comment || null,
                    reviewed_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) throw error;

            if (doc) {
                const notificationType = status === 'approved' ? 'doc_approved' : 'doc_rejected';
                const eventKey = 'document_approved';

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
                        message,
                    });

                    const passenger = doc.passengers as any;
                    if (passenger?.user_id) {
                        try {
                            const pushTitle = status === 'approved' ? '✅ Documento aprobado' : '❌ Documento rechazado';
                            const pushBody = status === 'approved'
                                ? `Tu ${doc.required_documents?.document_types?.name || 'documento'} ha sido aprobado`
                                : `Tu ${doc.required_documents?.document_types?.name || 'documento'} fue rechazado${comment ? '. Motivo: ' + comment : ''}`;

                            await supabase.functions.invoke('send-push', {
                                body: {
                                    userId: passenger.user_id,
                                    title: pushTitle,
                                    body: pushBody,
                                    url: '/#/my-documents',
                                    tag: `document-${status}`,
                                    requireInteraction: status === 'rejected',
                                },
                            });
                        } catch (pushError) {
                            console.error('Error sending push notification:', pushError);
                        }
                    }
                }
            }

            queryCache.invalidate('pax_docs:*');
            queryCache.invalidate('passenger_trips:*');
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
