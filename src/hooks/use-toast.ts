
import * as React from "react"
import { useToast as useToastUI } from "@/components/ui/toast"

export type ToastProps = React.ComponentPropsWithoutRef<typeof useToastUI>

export function useToast() {
  const { toast } = useToastUI()
  
  return {
    toast,
    dismiss: useToastUI.dismiss,
    toasts: useToastUI.toasts,
  }
}

export { toast } from "@/components/ui/toast"
