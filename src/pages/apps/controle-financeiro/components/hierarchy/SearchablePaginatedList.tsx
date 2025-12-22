import React, { useMemo, useState, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search } from 'lucide-react';

interface SearchablePaginatedListProps<T> {
  items: T[];
  searchPlaceholder: string;
  searchFields: (keyof T)[];
  renderItem: (item: T) => ReactNode;
  itemsPerPageOptions?: number[];
  defaultItemsPerPage?: number;
}

export function SearchablePaginatedList<T extends { id: string }>({
  items,
  searchPlaceholder,
  searchFields,
  renderItem,
  itemsPerPageOptions = [5, 10, 25, 50, 100],
  defaultItemsPerPage = 10
}: SearchablePaginatedListProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const filteredAndPaginated = useMemo(() => {
    const filtered = items.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      return searchFields.some((field) => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchLower);
        }
        return false;
      });
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    return { items: paginated, total: filtered.length, totalPages };
  }, [items, searchQuery, currentPage, itemsPerPage, searchFields]);

  return (
    <div className="space-y-4">
      {/* Search and pagination controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={String(itemsPerPage)}
          onValueChange={(value) => {
            setItemsPerPage(Number(value));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {itemsPerPageOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} itens
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        <div className="grid gap-2">
          {filteredAndPaginated.items.map((item) => (
            <div key={item.id}>{renderItem(item)}</div>
          ))}
        </div>

        {/* Counter and pagination */}
        {filteredAndPaginated.total > 0 && (
          <>
            <div className="text-sm text-muted-foreground text-center">
              Mostrando {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredAndPaginated.total)} de{' '}
              {filteredAndPaginated.total} itens
            </div>

            {filteredAndPaginated.totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className={
                        currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: filteredAndPaginated.totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      if (
                        page === 1 ||
                        page === filteredAndPaginated.totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={page === currentPage}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <PaginationEllipsis key={page} />;
                      }
                      return null;
                    }
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(filteredAndPaginated.totalPages, prev + 1)
                        )
                      }
                      className={
                        currentPage === filteredAndPaginated.totalPages
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}

        {filteredAndPaginated.total === 0 && (
          <div className="text-center text-muted-foreground py-8">
            {searchQuery ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
          </div>
        )}
      </div>
    </div>
  );
}
