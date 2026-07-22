import { useState, useMemo } from 'react';

/**
 * usePagination Custom Hook
 * Manages item counts, total pages, current page state, and active page slices.
 */
export function usePagination<T>(data: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(data.length / itemsPerPage));
  }, [data.length, itemsPerPage]);

  // Adjust page if data size shrinks
  useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    const boundPage = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(boundPage);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    setPage: setCurrentPage,
  };
}

export default usePagination;
