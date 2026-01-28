
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '../constants';
import { useVouchers } from '../hooks/useVouchers';

export const Vouchers: React.FC = () => {
  const navigate = useNavigate();
  const { vouchers, loading } = useVouchers();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter vouchers by category
  const filteredVouchers = selectedCategory
    ? vouchers.filter(v => v.category === selectedCategory)
    : vouchers;

  // Get unique categories
  const categories = Array.from(new Set(vouchers.map(v => v.category).filter(Boolean))) as string[];

  const categoryIcons: Record<string, string> = {
    HOTEL: 'hotel',
    TRANSPORTE: 'directions_car',
    ACTIVIDAD: 'hiking',
    EVENTO: 'event',
    ASISTENCIA: 'medical_services',
    EXPERIENCIA: 'stars',
    OTRO: 'folder',
  };

  const handleVoucherClick = (voucher: any) => {
    if (voucher.external_url) {
      window.open(voucher.external_url, '_blank');
    } else if (voucher.file_url) {
      window.open(voucher.file_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-triex-bg dark:bg-zinc-950 pb-20 lg:pb-8">
        <div className="px-5 py-4 flex items-center justify-center bg-white dark:bg-zinc-950">
          <div className="animate-pulse">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-48"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-triex-bg dark:bg-zinc-950 pb-20 lg:pb-8">
      {/* Custom Header - Hidden on desktop */}
      <div className="px-5 py-4 flex items-center justify-between bg-white dark:bg-zinc-950 sticky top-0 z-50 lg:hidden">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-zinc-800 dark:text-zinc-200">
          <span className="material-symbols-outlined text-[28px]">chevron_left</span>
        </button>
        <h1 className="text-lg font-bold text-zinc-800 dark:text-white">Mis Vouchers</h1>
        <div className="w-16 flex justify-end">
          <img src={LOGO_URL} alt="Triex" className="h-4 object-contain brightness-0 dark:brightness-200 opacity-80" />
        </div>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {/* Desktop Title */}
        <div className="hidden lg:block">
          <h1 className="text-[32px] font-extrabold text-triex-grey dark:text-white">
            Mis Vouchers
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            Toda tu documentación de viaje en un solo lugar
          </p>
        </div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full font-bold text-[13px] whitespace-nowrap transition-all ${!selectedCategory
                  ? 'bg-[#3D3935] text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
            >
              Todos ({vouchers.length})
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-bold text-[13px] whitespace-nowrap transition-all flex items-center gap-1.5 ${selectedCategory === category
                    ? 'bg-[#3D3935] text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {categoryIcons[category] || 'folder'}
                </span>
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Vouchers Grid */}
        {filteredVouchers.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredVouchers.map((voucher) => (
              <div
                key={voucher.id}
                onClick={() => handleVoucherClick(voucher)}
                className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#F0F5FA] dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#E0592A] text-[24px]">
                      {voucher.format === 'PDF'
                        ? 'picture_as_pdf'
                        : voucher.format === 'IMAGE'
                          ? 'image'
                          : 'link'}
                    </span>
                  </div>
                  {voucher.category && (
                    <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded-full uppercase tracking-wide">
                      {voucher.category}
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-[17px] text-triex-grey dark:text-white mb-2 leading-tight">
                  {voucher.title}
                </h3>

                {voucher.description && (
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-snug mb-4">
                    {voucher.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wide">
                    {voucher.format || 'ARCHIVO'}
                  </span>
                  <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600">
                    chevron_right
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-6">
              <span className="material-symbols-outlined text-5xl">confirmation_number</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-800 dark:text-white mb-3">
              {selectedCategory ? 'No hay vouchers en esta categoría' : 'No hay vouchers disponibles'}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8">
              Los vouchers estarán disponibles más cerca de la fecha de tu viaje
            </p>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-8 py-3 bg-[#3D3935] hover:bg-black/90 text-white rounded-[20px] font-bold transition-all"
              >
                Ver todos los vouchers
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
