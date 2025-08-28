import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, AlertCircle, XCircle, Info, AlertTriangle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  const getIcon = (variant?: string) => {
    const iconClass = "w-5 h-5 flex-shrink-0 mt-0.5"
    switch (variant) {
      case "success":
        return <CheckCircle className={`${iconClass} text-green-600 dark:text-green-400`} />
      case "destructive":
        return <XCircle className={`${iconClass} text-red-600 dark:text-red-400`} />
      case "warning":
        return <AlertTriangle className={`${iconClass} text-yellow-600 dark:text-yellow-400`} />
      case "info":
        return <Info className={`${iconClass} text-blue-600 dark:text-blue-400`} />
      default:
        return <AlertCircle className={`${iconClass} text-blue-600 dark:text-blue-400`} />
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, icon, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start space-x-3 w-full">
              {icon || getIcon(variant)}
              <div className="grid gap-1 flex-1 min-w-0">
                {title && <ToastTitle className="text-sm font-semibold">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-sm opacity-90">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
