
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants';

type FlowStep = 'intro' | 'camera' | 'review' | 'success';

export const UploadDocument: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<FlowStep>('intro');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

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
      // Fallback to review step with a mock image if camera fails
      setCapturedImage("https://placehold.co/600x400?text=Documento+Simulado");
      setStep('review');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleCapture = () => {
    // In a real app, we'd draw to canvas and get base64
    setCapturedImage("https://placehold.co/600x800/f3f4f6/333?text=Documento+Escaneado");
    setStep('review');
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
        <h1 className="text-2xl font-extrabold text-triex-grey mb-4 font-ubuntu">¡Escaneo recibido!</h1>
        <p className="text-zinc-500 mb-12 px-6">
          Tu documento se está procesando. Te notificaremos en cuanto sea validado.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          Volver al inicio
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
              Encuadra el documento dentro del marco
            </p>
          </div>
        </div>
        <div className="h-40 bg-black flex items-center justify-around px-8">
          <button onClick={() => setStep('intro')} className="text-white p-3 rounded-full bg-white/10">
            <span className="material-symbols-outlined">close</span>
          </button>
          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-white p-1"
          >
            <div className="w-full h-full bg-white rounded-full"></div>
          </button>
          <button className="text-white p-3 rounded-full bg-white/10">
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
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-zinc-200">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
              <p className="text-sm font-medium text-zinc-600">Texto legible en el documento</p>
            </div>
          </div>
        </main>
        <footer className="p-5 bg-white border-t space-y-3">
          <button
            onClick={() => setStep('success')}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg"
          >
            Confirmar y Enviar
          </button>
          <button
            onClick={() => setStep('camera')}
            className="w-full py-4 text-zinc-400 font-bold"
          >
            Tomar de nuevo
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto lg:max-w-2xl">
      <header className="flex items-center justify-between p-4 h-16 border-b border-zinc-50">
        <img alt="Triex" className="h-7" src={LOGO_URL} />
        <button onClick={() => navigate(-1)} className="p-2 text-triex-grey">
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      <main className="flex-1 px-5 pt-8">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">add_a_photo</span>
          </div>
          <h2 className="text-2xl font-bold text-triex-grey font-ubuntu">Escanea tu documento</h2>
          <p className="text-zinc-500 mt-2">Necesitamos una foto nítida de tu <span className="font-bold">Seguro de Viaje</span>.</p>
        </div>

        <div className="bg-zinc-50 rounded-3xl p-6 border-2 border-dashed border-zinc-200">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-triex-grey text-white flex items-center justify-center shrink-0 font-bold text-sm">1</div>
              <div>
                <p className="font-bold text-triex-grey">Prepara el documento</p>
                <p className="text-xs text-zinc-400 mt-1">Colócalo sobre una superficie plana y oscura para mejor contraste.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-triex-grey text-white flex items-center justify-center shrink-0 font-bold text-sm">2</div>
              <div>
                <p className="font-bold text-triex-grey">Evita reflejos</p>
                <p className="text-xs text-zinc-400 mt-1">Busca un lugar con luz natural indirecta si es posible.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-triex-grey text-white flex items-center justify-center shrink-0 font-bold text-sm">3</div>
              <div>
                <p className="font-bold text-triex-grey">Captura y envía</p>
                <p className="text-xs text-zinc-400 mt-1">Toma la foto y nosotros nos encargamos del resto.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-5">
        <button
          onClick={() => setStep('camera')}
          className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">camera_alt</span>
          Comenzar escaneo
        </button>
      </footer>
    </div>
  );
};
