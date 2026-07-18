import { Pagination } from '../../Pagination'

interface PropertyPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PropertyPagination({ currentPage, totalPages, onPageChange }: PropertyPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="py-6">
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  )
}
