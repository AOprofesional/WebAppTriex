import React from 'react';

export interface SalesAgent {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  phone?: string;
}

const SALES_AGENTS: SalesAgent[] = [
  { id: '1', name: 'Agostina Melica', role: 'Administración', imageUrl: 'https://gcziorsiqzwxbebxafeo.supabase.co/storage/v1/object/public/Equipo/AGOSTINA%20MELICA%20ADMINISTRACION.jpg', phone: '5492612455808' },
  { id: '2', name: 'Benjamín Arrojo', role: 'Ventas', imageUrl: 'https://gcziorsiqzwxbebxafeo.supabase.co/storage/v1/object/public/Equipo/BENJAMIN%20ARROJO%20VENTAS.jpg' },
  { id: '3', name: 'Celeste Garro', role: 'Ventas', imageUrl: 'https://gcziorsiqzwxbebxafeo.supabase.co/storage/v1/object/public/Equipo/CELESTE%20GARRO%20VENTAS.jpg' },
  { id: '4', name: 'Eliana Rivero', role: 'Ventas', imageUrl: 'https://gcziorsiqzwxbebxafeo.supabase.co/storage/v1/object/public/Equipo/ELIANA%20RIVERO%20VENTAS.jpg', phone: '5492612469416' },
  { id: '5', name: 'Florencia Benavides', role: 'Ventas', imageUrl: 'https://gcziorsiqzwxbebxafeo.supabase.co/storage/v1/object/public/Equipo/FLORENCIA%20BENAVIDES%20VENTAS.jpg', phone: '5492613378514' },
  { id: '6', name: 'Hugo Fisigaro', role: 'Ventas', imageUrl: 'https://gcziorsiqzwxbebxafeo.supabase.co/storage/v1/object/public/Equipo/HUGO%20FISIGARO%20VENTAS.jpg', phone: '5492613343492' },
  { id: '7', name: 'Nicolás Cozzani', role: 'Ventas', imageUrl: 'https://gcziorsiqzwxbebxafeo.supabase.co/storage/v1/object/public/Equipo/NICOLAS%20COZZANI%20VENTAS.jpg', phone: '5492613460978' },
  { id: '8', name: 'Victoria Amaya', role: 'Ventas', imageUrl: 'https://gcziorsiqzwxbebxafeo.supabase.co/storage/v1/object/public/Equipo/VICTORIA%20AMAYA%20VENTAS.jpg', phone: '5492616569000' },
];

interface SalesTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinatorPhone?: string | null;
}

export const SalesTeamModal: React.FC<SalesTeamModalProps> = ({ isOpen, onClose, coordinatorPhone }) => {
  if (!isOpen) return null;

  const handleWhatsApp = (agent: SalesAgent) => {
    // If we have a specific coordinator phone we could use it, but they want to contact the specific agent.
    // If agent phone is missing, fallback to coordinatorPhone or a default.
    const phone = agent.phone || coordinatorPhone?.replace(/\D/g, '') || '5492615908839';
    window.open(`https://wa.me/${phone}?text=Hola%20${encodeURIComponent(agent.name)},%20necesito%20ayuda%20con%20mi%20viaje`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Background click handler */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-white font-ubuntu">
                Equipo Triex
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Elegí con quién hablar</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Content - Scrollable Grid */}
        <div className="p-6 overflow-y-auto hide-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            {SALES_AGENTS.map((agent) => (
              <div 
                key={agent.id}
                onClick={() => handleWhatsApp(agent)}
                className="flex flex-col items-center bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 gap-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors active:scale-95 border border-zinc-100/50 dark:border-zinc-700/30 shadow-sm"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white dark:border-zinc-700 shadow-md">
                  <img 
                    src={agent.imageUrl} 
                    alt={agent.name} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(agent.name) + '&background=F97316&color=fff';
                    }}
                  />
                </div>
                <div className="text-center w-full">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
                    {agent.name}
                  </h3>
                  <p className="text-[11px] font-bold text-[#F97316] uppercase tracking-wider mt-1">
                    {agent.role}
                  </p>
                </div>
                {/* WhatsApp Icon */}
                <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
