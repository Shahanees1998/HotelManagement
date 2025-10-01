"use client";

import React, { useState, useRef, useEffect } from "react";

interface CustomPaginatorProps {
  currentPage: number;
  totalRecords: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  rowsPerPageOptions?: number[];
}

export const CustomPaginator: React.FC<CustomPaginatorProps> = ({
  currentPage,
  totalRecords,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25, 50],
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endRecord = Math.min(currentPage * rowsPerPage, totalRecords);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format number with K suffix if >= 1000
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + "K";
    }
    return num.toString();
  };

  // Generate page numbers to display
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 7;

    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        pages.push(2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // In the middle
        pages.push("...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="custom-paginator">
      {/* Left side */}
      <div className="custom-paginator-left">
        <div className="custom-paginator-items">
          <span className="custom-paginator-label">Items per page</span>
          
          {/* Custom Dropdown */}
          <div className="custom-dropdown" ref={dropdownRef}>
            <button
              className="custom-dropdown-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <span className="custom-dropdown-value">{rowsPerPage}</span>
              <i className={`pi ${isDropdownOpen ? 'pi-chevron-up' : 'pi-chevron-down'} custom-dropdown-icon`}></i>
            </button>
            
            {isDropdownOpen && (
              <div className="custom-dropdown-panel">
                <ul className="custom-dropdown-list" role="listbox">
                  {rowsPerPageOptions.map((option) => (
                    <li
                      key={option}
                      className={`custom-dropdown-item ${option === rowsPerPage ? 'custom-dropdown-item-selected' : ''}`}
                      onClick={() => {
                        onRowsPerPageChange(option);
                        setIsDropdownOpen(false);
                      }}
                      role="option"
                      aria-selected={option === rowsPerPage}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <span className="custom-paginator-info">
          {startRecord}-{endRecord} of {formatNumber(totalRecords)} entries
        </span>
      </div>

      {/* Right side */}
      <div className="custom-paginator-right">
        {/* Previous button */}
        <button
          className="custom-paginator-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <i className="pi pi-angle-left"></i>
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="custom-paginator-ellipsis">
              ...
            </span>
          ) : (
            <button
              key={page}
              className={`custom-paginator-btn ${
                currentPage === page ? "custom-paginator-btn-active" : ""
              }`}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </button>
          )
        )}

        {/* Next button */}
        <button
          className="custom-paginator-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <i className="pi pi-angle-right"></i>
        </button>
      </div>
    </div>
  );
};

