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
  
  if (totalPages <= 1) return null;

  const renderPageButton = (pageNum: number) => (
    <button
      key={pageNum}
      onClick={() => onPageChange(pageNum)}
      className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
        pageNum === currentPage
          ? "bg-cyan-500/20 text-white ring-2 ring-cyan-500/50 font-medium"
          : "text-white/70 hover:text-white hover:bg-white/10 hover:ring-1 hover:ring-white/30"
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
    <div className="flex items-center justify-center gap-3 bg-white/5 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          "transition-all duration-300",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          "text-white/70 hover:text-white hover:bg-white/10",
          "hover:ring-1 hover:ring-white/30"
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      {renderPaginationItems()}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          "transition-all duration-300",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          "text-white/70 hover:text-white hover:bg-white/10",
          "hover:ring-1 hover:ring-white/30"
        )}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
