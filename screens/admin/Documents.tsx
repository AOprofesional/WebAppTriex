import React, { useState } from 'react';
import { AdminDocumentRequirements } from './DocumentRequirements';
import { AdminDocumentReview } from './DocumentReview';
import { AdminDocumentCompliance } from './DocumentCompliance';

export const AdminDocuments: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'requirements' | 'review' | 'compliance'>('requirements');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-triex-grey dark:text-white">Documentación</h1>
                    <p className="text-sm text-zinc-500 mt-1">Gestiona los requisitos y revisa la documentación de los pasajeros</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex gap-6 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('requirements')}
                        className={`pb-4 text-sm font-semibold transition-colors relative whitespace-nowrap ${activeTab === 'requirements'
                                ? 'text-primary'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                            }`}
                    >
                        Requisitos del Viaje
                        {activeTab === 'requirements' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('review')}
                        className={`pb-4 text-sm font-semibold transition-colors relative whitespace-nowrap ${activeTab === 'review'
                                ? 'text-primary'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                            }`}
                    >
                        Revisión de Documentos
                        {activeTab === 'review' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('compliance')}
                        className={`pb-4 text-sm font-semibold transition-colors relative whitespace-nowrap ${activeTab === 'compliance'
                                ? 'text-primary'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                            }`}
                    >
                        Estado de Cumplimiento
                        {activeTab === 'compliance' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'requirements' ? (
                    <AdminDocumentRequirements />
                ) : activeTab === 'review' ? (
                    <AdminDocumentReview />
                ) : (
                    <AdminDocumentCompliance />
                )}
            </div>
        </div>
    );
};
