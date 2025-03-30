
import { Toast as ToastPrimitive } from "@/components/ui/toast"
import * as React from "react"
import { type ToastActionElement } from "@/components/ui/toast"

export type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive>

export type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

export const TOAST_LIMIT = 5
export const TOAST_REMOVE_DELAY = 1000000

export const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

export type ActionType = typeof actionTypes

export type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

export interface State {
  toasts: ToasterToast[]
}
