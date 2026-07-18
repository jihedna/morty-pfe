import { Link } from 'react-router-dom'
import { ListingType } from '../../types/property'

interface PropertyBreadcrumbsProps {
  title: string
  listingType?: ListingType | null
  city?: string | null
}

export function PropertyBreadcrumbs({ title, listingType, city }: PropertyBreadcrumbsProps) {
  const getListingQuery = () => {
    if (listingType === ListingType.RENT) return '?listing_type=rent'
    if (listingType === ListingType.SALE) return '?listing_type=sale'
    return ''
  }

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-navy-500 mb-6">
      <ol className="flex items-center flex-wrap gap-2">
        <li>
          <Link to="/" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
        </li>
        <li aria-hidden="true" className="text-navy-300">/</li>
        <li>
          <Link to={`/properties${getListingQuery()}`} className="hover:text-primary-600 transition-colors">
            Properties
          </Link>
        </li>
        {city && (
          <>
            <li aria-hidden="true" className="text-navy-300">/</li>
            <li>
              <Link to={`/properties?city=${encodeURIComponent(city)}`} className="hover:text-primary-600 transition-colors">
                {city}
              </Link>
            </li>
          </>
        )}
        <li aria-hidden="true" className="text-navy-300">/</li>
        <li>
          <span className="text-navy-900 font-medium truncate max-w-[200px] sm:max-w-xs" title={title}>
            {title}
          </span>
        </li>
      </ol>
    </nav>
  )
}
