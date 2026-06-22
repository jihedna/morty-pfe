interface FormFieldErrorProps {
  message: string | null | undefined
}

export default function FormFieldError({ message }: FormFieldErrorProps) {
  if (!message) return null

  return (
    <p className="mt-1 text-sm text-red-600" role="alert">
      {message}
    </p>
  )
}
