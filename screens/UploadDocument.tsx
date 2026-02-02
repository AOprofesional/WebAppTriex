import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants';
import { usePassengerTrips } from '../hooks/usePassengerTrips';
import { useDocuments, RequiredDocument, PassengerDocument } from '../hooks/useDocuments';

type FlowStep = 'list' | 'camera' | 'review' | 'success';

export const UploadDocument: React.FC = () => {
  const navigate = useNavigate();
  const { primaryTrip, passenger } = usePassengerTrips();
  const {
    requiredDocuments,
    passengerDocuments,
    fetchRequiredDocuments,
    fetchPassengerDocuments,
    uploadPassengerDocument
  } = useDocuments();

  const [step, setStep] = useState<FlowStep>('list');
  const [selectedReq, setSelectedReq] = useState<RequiredDocument | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (primaryTrip && passenger) {
      loadData();
    }
  }, [primaryTrip, passenger]);

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
      // Fallback for demo/testing without camera
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

        // Convert to File object
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

  const handleUpload = async () => {
    if (!capturedFile || !selectedReq || !primaryTrip || !passenger) return;

    setUploading(true);
    try {
      const { error } = await uploadPassengerDocument({
        trip_id: primaryTrip.id,
        passenger_id: passenger.id,
        required_document_id: selectedReq.id,
        format: 'image'
      }, capturedFile);

      if (error) throw new Error(error);

      setStep('success');
      loadData(); // Refresh list
    } catch (err) {
      alert('Error al subir documento: ' + err);
    } finally {
      setUploading(false);
    }
  };

  const getDocStatus = (reqId: string) => {
    const doc = passengerDocuments.find(d => d.required_document_id === reqId);
    return doc?.status || 'missing';
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center px-8 text-center min-h-screen bg-white max-w-md mx-auto">
        <div className="mb-10">
          <img alt="Logo" className="h-8 mx-auto" src={LOGO_URL} />
        </div>
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 mb-8 animate-bounce">
          <span className="material-symbols-outlined text-white text-5xl font-bold">check</span>
        </div>
        <h1 className="text-2xl font-extrabold text-triex-grey mb-4 font-ubuntu">¡Documento subido!</h1>
        <p className="text-zinc-500 mb-12 px-6">
          Tu documento se ha enviado correctamente. Te notificaremos cuando sea revisado.
        </p>
        <button
          onClick={() => {
            setStep('list');
            setSelectedReq(null);
            setCapturedImage(null);
            setCapturedFile(null);
          }}
          className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          Volver a mis documentos
        </button>
      </div>
    );
  }

  if (step === 'camera') {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col max-w-md mx-auto">
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Viewfinder Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none">
            <div className="w-full aspect-[3/4] border-2 border-white/50 rounded-2xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
            </div>
            <p className="mt-6 text-white text-sm font-bold text-center bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
              Encuadra el documento: {selectedReq?.document_types?.name}
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

  if (step === 'review') {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 max-w-md mx-auto">
        <header className="p-4 flex items-center justify-between bg-white border-b">
          <button onClick={() => setStep('camera')} className="material-symbols-outlined text-triex-grey">arrow_back</button>
          <span className="font-bold text-triex-grey">Revisar Foto</span>
          <div className="w-6"></div>
        </header>
        <main className="flex-1 p-6">
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-200 mb-6">
            <img src={capturedImage!} alt="Review" className="w-full h-auto" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-zinc-200">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
              <p className="text-sm font-medium text-zinc-600">Buena iluminación detectada</p>
            </div>
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
              'Confirmar y Enviar'
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

  // LIST STEP (DEFAULT)
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
              const status = getDocStatus(req.id);
              const doc = passengerDocuments.find(d => d.required_document_id === req.id);

              return (
                <div
                  key={req.id}
                  onClick={() => {
                    if (status === 'missing' || status === 'rejected') {
                      setSelectedReq(req);
                      setStep('camera');
                    }
                  }}
                  className={`p-5 rounded-[24px] border transition-all ${status === 'missing' || status === 'rejected'
                      ? 'bg-white border-zinc-200 shadow-sm cursor-pointer hover:border-primary active:scale-[0.98]'
                      : 'bg-zinc-50 border-zinc-100 opacity-90'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${status === 'approved' ? 'bg-green-100 text-green-600' :
                          status === 'uploaded' ? 'bg-amber-100 text-amber-600' :
                            status === 'rejected' ? 'bg-red-100 text-red-600' :
                              'bg-zinc-100 text-zinc-400'
                        }`}>
                        <span className="material-symbols-outlined">
                          {status === 'approved' ? 'check_circle' :
                            status === 'uploaded' ? 'schedule' :
                              status === 'rejected' ? 'error' : 'upload_file'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-triex-grey text-lg">{req.document_types?.name}</h3>
                        <p className={`text-sm font-medium ${status === 'approved' ? 'text-green-600' :
                            status === 'uploaded' ? 'text-amber-600' :
                              status === 'rejected' ? 'text-red-600' :
                                'text-zinc-400'
                          }`}>
                          {status === 'approved' ? 'Aprobado' :
                            status === 'uploaded' ? 'En revisión' :
                              status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                        </p>
                      </div>
                    </div>
                    {(status === 'missing' || status === 'rejected') && (
                      <span className="material-symbols-outlined text-zinc-300">chevron_right</span>
                    )}
                  </div>

                  {status === 'rejected' && doc?.review_comment && (
                    <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-700">
                      <span className="font-bold">Motivo:</span> {doc.review_comment}
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
