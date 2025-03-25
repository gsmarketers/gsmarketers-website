import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  const renderPageButton = (pageNum: number) => (
    <button
      key={pageNum}
      onClick={() => onPageChange(pageNum)}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
        pageNum === currentPage
          ? "bg-cyan-500/20 text-white ring-1 ring-cyan-500/30"
          : "text-white/70 hover:text-white hover:bg-white/10"
      )}
    >
      {pageNum}
    </button>
  );

  const renderEllipsis = (key: string) => (
    <span key={key} className="px-2 text-white/40">
      ...
    </span>
  );

  const renderPaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(renderPageButton(1));
    
    if (currentPage > 3) {
      items.push(renderEllipsis('start'));
    }
    
    // Show current page and neighbors
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      items.push(renderPageButton(i));
    }
    
    if (currentPage < totalPages - 2) {
      items.push(renderEllipsis('end'));
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(renderPageButton(totalPages));
    }
    
    return items;
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      {renderPaginationItems()}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}