import React from 'react';

interface PaginationProps {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
    totalItems,
    itemsPerPage,
    currentPage,
    onPageChange
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Show pages around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4">
            {/* Items count */}
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Mostrando <span className="font-semibold text-zinc-900 dark:text-white">{startItem}</span> a{' '}
                <span className="font-semibold text-zinc-900 dark:text-white">{endItem}</span> de{' '}
                <span className="font-semibold text-zinc-900 dark:text-white">{totalItems}</span> resultados
            </p>

            {/* Page controls */}
            <div className="flex items-center gap-2">
                {/* Previous button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página anterior"
                >
                    <span className="material-icons text-xl">chevron_left</span>
                </button>

                {/* Page numbers */}
                <div className="hidden sm:flex gap-1">
                    {getPageNumbers().map((page, index) => (
                        typeof page === 'number' ? (
                            <button
                                key={index}
                                onClick={() => onPageChange(page)}
                                className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-semibold transition-colors ${currentPage === page
                                        ? 'bg-primary text-white'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                {page}
                            </button>
                        ) : (
                            <span
                                key={index}
                                className="min-w-[40px] h-10 flex items-center justify-center text-zinc-400 dark:text-zinc-600"
                            >
                                {page}
                            </span>
                        )
                    ))}
                </div>

                {/* Mobile page indicator */}
                <div className="sm:hidden">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 font-semibold">
                        {currentPage} / {totalPages}
                    </span>
                </div>

                {/* Next button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página siguiente"
                >
                    <span className="material-icons text-xl">chevron_right</span>
                </button>
            </div>
        </div>
    );
};
