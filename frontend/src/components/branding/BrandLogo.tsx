interface BrandLogoProps {
  className?: string
  alt?: string
}

export default function BrandLogo({ className = 'h-10 w-auto', alt = 'RE/MAX' }: BrandLogoProps) {
  return <img src="/remax-logo.png" alt={alt} className={`object-contain ${className}`} />
}
