
// Re-export types from our hooks implementation
import { type ToastActionElement, type ToastProps } from "@/components/ui/toast"
import { useToast, toast } from "@/hooks/use-toast"

export { useToast, toast, type ToastProps, type ToastActionElement }
