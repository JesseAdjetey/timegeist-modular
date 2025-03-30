
import * as React from "react"
import { actionTypes, type ToasterToast } from "./toast-types"
import { genId, ToastDispatchContext } from "./toast-context"

export const useToast = () => {
  const [state, innerDispatch] = React.useReducer(
    (state: { toasts: ToasterToast[] }, action: any) => {
      switch (action.type) {
        case actionTypes.ADD_TOAST:
          return {
            ...state,
            toasts: [action.toast, ...state.toasts].slice(0, 5),
          }
        case actionTypes.UPDATE_TOAST:
          return {
            ...state,
            toasts: state.toasts.map((t) =>
              t.id === action.toast.id ? { ...t, ...action.toast } : t
            ),
          }
        case actionTypes.DISMISS_TOAST:
          return {
            ...state,
            toasts: state.toasts.map((t) =>
              t.id === action.toastId || action.toastId === undefined
                ? {
                    ...t,
                    open: false,
                  }
                : t
            ),
          }
        case actionTypes.REMOVE_TOAST:
          if (action.toastId === undefined) {
            return {
              ...state,
              toasts: [],
            }
          }
          return {
            ...state,
            toasts: state.toasts.filter((t) => t.id !== action.toastId),
          }
        default:
          return state
      }
    },
    {
      toasts: [],
    }
  )

  const toast = React.useCallback(
    ({ ...props }: Omit<ToasterToast, "id">) => {
      const id = genId()

      innerDispatch({
        type: actionTypes.ADD_TOAST,
        toast: {
          ...props,
          id,
          open: true,
        },
      })

      return id
    },
    [innerDispatch]
  )

  const update = React.useCallback(
    (id: string, props: Partial<ToasterToast>) => {
      innerDispatch({
        type: actionTypes.UPDATE_TOAST,
        toast: { ...props, id },
      })
    },
    [innerDispatch]
  )

  const dismiss = React.useCallback(
    (id?: string) => {
      innerDispatch({
        type: actionTypes.DISMISS_TOAST,
        toastId: id,
      })
    },
    [innerDispatch]
  )

  return {
    toast,
    update,
    dismiss,
    toasts: state.toasts,
  }
}

// Helper function to display toasts easily
export function toast(props: Omit<ToasterToast, "id">) {
  const { toast: showToast } = useToast()
  return showToast(props)
}
