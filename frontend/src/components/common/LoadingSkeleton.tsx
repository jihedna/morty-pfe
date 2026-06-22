interface LoadingSkeletonProps {
  className?: string
}

export default function LoadingSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} aria-hidden="true" />
  )
}
