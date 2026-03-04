import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LOGO_URL } from '../constants';
import { usePassengerTrips } from '../hooks/usePassengerTrips';
import { useDocuments, RequiredDocument, PassengerDocument } from '../hooks/useDocuments';

type FlowStep = 'list' | 'method_selection' | 'camera' | 'review' | 'success';
// For DNI/Passport: 'front' = first photo (front side), 'back' = second photo (back side)
type PhotoSide = 'front' | 'back';

export const UploadDocument: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { primaryTrip, passenger } = usePassengerTrips();
  const {
    requiredDocuments,
    passengerDocuments,
    fetchRequiredDocuments,
    fetchPassengerDocuments,
    uploadPassengerDocument
  } = useDocuments();

  const isDni = (req: RequiredDocument) => {
    const name = req.document_types?.name.toLowerCase() || '';
    return name.includes('dni') || name.includes('identidad') || name.includes('passport') || name.includes('pasaporte');
  };

  const [step, setStep] = useState<FlowStep>('list');
  const [selectedReq, setSelectedReq] = useState<RequiredDocument | null>(null);
  // Which side we're currently capturing (only relevant for DNI/Passport)
  const [photoSide, setPhotoSide] = useState<PhotoSide>('front');

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (primaryTrip && passenger) {
      loadData();
    }
  }, [primaryTrip, passenger]);

  // Auto-select document from navigation state
  useEffect(() => {
    const state = location.state as { selectedDocId?: string };
    if (state?.selectedDocId && requiredDocuments.length > 0 && step === 'list') {
      const req = requiredDocuments.find(r => r.id === state.selectedDocId);
      if (req) {
        const status = getDocStatus(req.id, req);
        if (status === 'missing' || status === 'rejected' || status === 'partial') {
          setSelectedReq(req);
          // If partial, we already have the front — go straight to back side
          if (status === 'partial' && isDni(req)) {
            setPhotoSide('back');
          } else {
            setPhotoSide('front');
          }
          setStep('method_selection');
        }
      }
      window.history.replaceState({}, document.title);
    }
  }, [requiredDocuments, location.state]);

  const loadData = async () => {
    if (!primaryTrip || !passenger) return;
    await Promise.all([
      fetchRequiredDocuments(primaryTrip.id),
      fetchPassengerDocuments({ tripId: primaryTrip.id, passengerId: passenger.id })
    ]);
  };

  useEffect(() => {
    if (step === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("No se pudo acceder a la cámara. Por favor intenta subir un archivo.");
      setStep('list');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);

        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "captured_doc.jpg", { type: "image/jpeg" });
            setCapturedFile(file);
            setStep('review');
          });
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("El archivo es demasiado grande. El tamaño máximo permitido es 5MB.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setCapturedFile(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCapturedImage(reader.result as string);
          setStep('review');
        };
        reader.readAsDataURL(file);
      } else {
        setCapturedImage(null);
        setStep('review');
      }
    }
  };

  const handleUpload = async () => {
    if (!capturedFile || !selectedReq || !primaryTrip || !passenger) return;

    setUploading(true);
    try {
      const format = capturedFile.type === 'application/pdf' ? 'pdf' : 'image';

      const { error } = await uploadPassengerDocument({
        trip_id: primaryTrip.id,
        passenger_id: passenger.id,
        required_document_id: selectedReq.id,
        format: format
      }, capturedFile);

      if (error) throw new Error(error);

      // Refresh data
      await loadData();

      // For DNI/Passport: if we just uploaded the front, move to back side
      if (selectedReq && isDni(selectedReq) && photoSide === 'front') {
        setPhotoSide('back');
        setCapturedImage(null);
        setCapturedFile(null);
        setStep('method_selection');
      } else {
        // Single-photo docs OR back side done → success
        setStep('success');
      }
    } catch (err) {
      alert('Error al subir documento: ' + err);
    } finally {
      setUploading(false);
    }
  };

  const getDocFiles = (reqId: string) => {
    return passengerDocuments
      .filter(d => d.required_document_id === reqId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const getDocStatus = (reqId: string, req?: RequiredDocument) => {
    const allFiles = getDocFiles(reqId);

    // Logic for DNI/Passport (requires 2 files)
    if (req && isDni(req)) {
      const latestFiles = allFiles.slice(0, 2);

      if (latestFiles.length === 0) return 'missing';
      if (latestFiles.length === 1) return 'partial';

      if (latestFiles.some(f => f.status === 'rejected')) return 'rejected';
      if (latestFiles.every(f => f.status === 'approved')) return 'approved';
      return 'uploaded';
    }

    // Default logic (1 file)
    if (allFiles.length === 0) return 'missing';
    const doc = allFiles[0];
    return doc?.status || 'missing';
  };

  // ─── SUCCESS SCREEN ───────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center px-8 text-center min-h-screen bg-white max-w-md mx-auto">
        <div className="mb-10">
          <img alt="Logo" className="h-8 mx-auto" src={LOGO_URL} />
        </div>
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 mb-8 animate-bounce">
          <span className="material-symbols-outlined text-white text-5xl font-bold">check</span>
        </div>
        <h1 className="text-2xl font-extrabold text-triex-grey mb-4 font-ubuntu">¡Documentos subidos!</h1>
        <p className="text-zinc-500 mb-12 px-6">
          Tus documentos se han enviado correctamente. Te notificaremos cuando sean revisados.
        </p>
        <button
          onClick={() => {
            setStep('list');
            setSelectedReq(null);
            setCapturedImage(null);
            setCapturedFile(null);
            setPhotoSide('front');
          }}
          className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          Volver a mis documentos
        </button>
      </div>
    );
  }

  // ─── METHOD SELECTION ─────────────────────────────────────────────────────────
  if (step === 'method_selection') {
    const isMultiPhoto = selectedReq && isDni(selectedReq);
    const sideLabel = photoSide === 'front' ? 'Foto frontal' : 'Foto posterior (dorso)';
    const sideHint = photoSide === 'front'
      ? 'Cara delantera del documento'
      : 'Cara trasera del documento';

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
        <div className="bg-white w-full max-w-sm sm:rounded-[32px] rounded-t-[32px] p-6 animate-in slide-in-from-bottom duration-200">
          <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-8 sm:hidden"></div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Subir Documento</h3>
            <p className="text-zinc-500 text-sm mt-1">
              {selectedReq?.document_types?.name}
            </p>

            {/* Photo step indicator for DNI/Passport */}
            {isMultiPhoto && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${photoSide === 'front' ? 'bg-primary text-white' : 'bg-green-100 text-green-700'}`}>
                  {photoSide === 'front' ? (
                    <>
                      <span className="material-symbols-outlined text-sm">looks_one</span>
                      Foto 1 de 2
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Foto 1 ✓
                    </>
                  )}
                </div>
                <div className="w-4 h-px bg-zinc-300" />
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${photoSide === 'back' ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                  <span className="material-symbols-outlined text-sm">looks_two</span>
                  Foto 2 de 2
                </div>
              </div>
            )}

            {isMultiPhoto && (
              <p className="text-sm font-semibold text-primary mt-3">{sideLabel}</p>
            )}
            {isMultiPhoto && (
              <p className="text-xs text-zinc-400 mt-0.5">{sideHint}</p>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setStep('camera')}
              className="w-full flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-zinc-600 group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">photo_camera</span>
                </div>
                <div className="text-left">
                  <span className="block font-bold text-zinc-800">Usar Cámara</span>
                  <span className="text-xs text-zinc-400">Tomar una foto ahora</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-zinc-300">chevron_right</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-zinc-600 group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">folder_open</span>
                </div>
                <div className="text-left">
                  <span className="block font-bold text-zinc-800">Subir Archivo</span>
                  <span className="text-xs text-zinc-400">PDF o Imagen de galería</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-zinc-300">chevron_right</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
            />
          </div>

          <button
            onClick={() => {
              setStep('list');
              setSelectedReq(null);
              setPhotoSide('front');
            }}
            className="w-full py-4 mt-6 text-zinc-400 font-bold text-sm hover:text-zinc-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ─── CAMERA ───────────────────────────────────────────────────────────────────
  if (step === 'camera') {
    const isMultiPhoto = selectedReq && isDni(selectedReq);
    const sideLabel = photoSide === 'front' ? 'Cara frontal' : 'Cara posterior (dorso)';

    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col max-w-md mx-auto">
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none">
            <div className="w-full aspect-[3/4] border-2 border-white/50 rounded-2xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
            </div>
            <p className="mt-6 text-white text-sm font-bold text-center bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
              {isMultiPhoto ? `${selectedReq?.document_types?.name} — ${sideLabel}` : `Encuadra el documento: ${selectedReq?.document_types?.name}`}
            </p>
          </div>
        </div>
        <div className="h-40 bg-black flex items-center justify-around px-8">
          <button onClick={() => setStep('list')} className="text-white p-3 rounded-full bg-white/10">
            <span className="material-symbols-outlined">close</span>
          </button>
          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-white p-1"
          >
            <div className="w-full h-full bg-white rounded-full"></div>
          </button>
          <button className="text-white p-3 rounded-full bg-white/10 opacity-50">
            <span className="material-symbols-outlined">flash_on</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── REVIEW ───────────────────────────────────────────────────────────────────
  if (step === 'review') {
    const isMultiPhoto = selectedReq && isDni(selectedReq);
    const sideLabel = photoSide === 'front' ? 'Foto 1 de 2 — Cara frontal' : 'Foto 2 de 2 — Cara posterior';

    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 max-w-md mx-auto">
        <header className="p-4 flex items-center justify-between bg-white border-b">
          <button onClick={() => setStep('camera')} className="material-symbols-outlined text-triex-grey">arrow_back</button>
          <span className="font-bold text-triex-grey">Revisar Foto</span>
          <div className="w-6"></div>
        </header>
        <main className="flex-1 p-6">
          {isMultiPhoto && (
            <div className="mb-4 flex items-center justify-center gap-2">
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${photoSide === 'front' ? 'bg-primary text-white' : 'bg-green-100 text-green-700'}`}>
                <span className="material-symbols-outlined text-sm">{photoSide === 'front' ? 'looks_one' : 'check_circle'}</span>
                {sideLabel}
              </div>
            </div>
          )}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-200 mb-6 flex items-center justify-center min-h-[300px] bg-zinc-100">
            {capturedImage ? (
              <img src={capturedImage} alt="Review" className="w-full h-auto object-contain" />
            ) : (
              <div className="text-center p-8">
                <span className="material-symbols-outlined text-6xl text-red-500 mb-4 block">picture_as_pdf</span>
                <p className="font-bold text-zinc-800 text-lg mb-1">{capturedFile?.name}</p>
                <p className="text-zinc-500 text-sm">{(capturedFile?.size ? (capturedFile.size / 1024 / 1024).toFixed(2) : 0)} MB</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-zinc-200">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
              <p className="text-sm font-medium text-zinc-600">
                {capturedImage ? 'Buena iluminación detectada' : 'Archivo listo para subir'}
              </p>
            </div>
            {isMultiPhoto && photoSide === 'front' && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="material-symbols-outlined text-blue-500">info</span>
                <p className="text-sm font-medium text-blue-700">
                  Después de confirmar, se te pedirá la cara posterior del documento.
                </p>
              </div>
            )}
          </div>
        </main>
        <footer className="p-5 bg-white border-t space-y-3">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Subiendo...
              </>
            ) : (
              isMultiPhoto && photoSide === 'front' ? 'Confirmar y continuar →' : 'Confirmar y Enviar'
            )}
          </button>
          <button
            onClick={() => setStep('camera')}
            disabled={uploading}
            className="w-full py-4 text-zinc-400 font-bold"
          >
            Tomar de nuevo
          </button>
        </footer>
      </div>
    );
  }

  // ─── LIST (DEFAULT) ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto lg:max-w-2xl">
      <header className="flex items-center justify-between p-4 h-16 border-b border-zinc-50">
        <img alt="Triex" className="h-7" src={LOGO_URL} />
        <button onClick={() => navigate(-1)} className="p-2 text-triex-grey">
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      <main className="flex-1 px-5 pt-8 pb-20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">folder_shared</span>
          </div>
          <h2 className="text-2xl font-bold text-triex-grey font-ubuntu">Tu Documentación</h2>
          <p className="text-zinc-500 mt-2">Gestiona los requisitos para tu viaje a <span className="font-bold">{primaryTrip?.destination}</span>.</p>
        </div>

        <div className="space-y-4">
          {requiredDocuments.length === 0 ? (
            <div className="text-center p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
              <p className="text-zinc-400">No hay requisitos de documentación para este viaje.</p>
            </div>
          ) : (
            requiredDocuments.map(req => {
              const status = getDocStatus(req.id, req);
              const doc = passengerDocuments.find(d => d.required_document_id === req.id);
              const isActionable = status === 'missing' || status === 'rejected' || status === 'partial';

              return (
                <div
                  key={req.id}
                  onClick={() => {
                    if (isActionable) {
                      setSelectedReq(req);
                      // If partial (front already done), jump straight to back side
                      if (status === 'partial' && isDni(req)) {
                        setPhotoSide('back');
                      } else {
                        setPhotoSide('front');
                      }
                      setStep('method_selection');
                    }
                  }}
                  className={`p-5 rounded-[24px] border transition-all ${isActionable
                    ? 'bg-white border-zinc-200 shadow-sm cursor-pointer hover:border-primary active:scale-[0.98]'
                    : 'bg-zinc-50 border-zinc-100 opacity-90'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${status === 'approved' ? 'bg-green-100 text-green-600' :
                        status === 'uploaded' ? 'bg-amber-100 text-amber-600' :
                          status === 'rejected' ? 'bg-red-100 text-red-600' :
                            status === 'partial' ? 'bg-blue-100 text-blue-600' :
                              'bg-zinc-100 text-zinc-400'
                        }`}>
                        <span className="material-symbols-outlined">
                          {status === 'approved' ? 'check_circle' :
                            status === 'uploaded' ? 'schedule' :
                              status === 'rejected' ? 'error' :
                                status === 'partial' ? 'looks_two' :
                                  'upload_file'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-triex-grey text-lg">{req.document_types?.name}</h3>
                        <p className={`text-sm font-medium ${status === 'approved' ? 'text-green-600' :
                          status === 'uploaded' ? 'text-amber-600' :
                            status === 'rejected' ? 'text-red-600' :
                              status === 'partial' ? 'text-blue-600' :
                                'text-zinc-400'
                          }`}>
                          {status === 'approved' ? 'Aprobado' :
                            status === 'uploaded' ? 'En revisión' :
                              status === 'rejected' ? 'Rechazado' :
                                status === 'partial' ? 'Falta cara posterior (foto 2 de 2)' :
                                  'Pendiente'}
                        </p>
                      </div>
                    </div>
                    {isActionable && (
                      <span className="material-symbols-outlined text-zinc-300">chevron_right</span>
                    )}
                  </div>

                  {status === 'rejected' && doc?.review_comment && (
                    <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-700">
                      <span className="font-bold">Motivo:</span> {doc.review_comment}
                    </div>
                  )}

                  {status === 'partial' && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">info</span>
                      Toca para subir la cara posterior del documento.
                    </div>
                  )}

                  {req.description && (
                    <p className="mt-3 text-sm text-zinc-500 pl-[4.5rem]">
                      {req.description}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};
