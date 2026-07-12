export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8" aria-live="polite" aria-busy="true">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin" aria-hidden="true" />
    </div>
  )
}
