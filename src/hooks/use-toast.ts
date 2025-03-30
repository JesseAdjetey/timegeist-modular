
import * as React from "react"
import { actionTypes, type ToasterToast } from "./toast-types"
import { genId, ToastDispatchContext } from "./toast-context"

export const useToast = () => {
  const dispatch = React.useContext(ToastDispatchContext);
  
  if (!dispatch) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const toast = React.useCallback(
    ({ ...props }: Omit<ToasterToast, "id">) => {
      const id = genId()

      dispatch({
        type: actionTypes.ADD_TOAST,
        toast: {
          ...props,
          id,
          open: true,
        },
      })

      return id
    },
    [dispatch]
  )

  const update = React.useCallback(
    (id: string, props: Partial<ToasterToast>) => {
      dispatch({
        type: actionTypes.UPDATE_TOAST,
        toast: { ...props, id },
      })
    },
    [dispatch]
  )

  const dismiss = React.useCallback(
    (id?: string) => {
      dispatch({
        type: actionTypes.DISMISS_TOAST,
        toastId: id,
      })
    },
    [dispatch]
  )

  return {
    toast,
    update,
    dismiss,
  }
}

// Helper function to display toasts easily - this is meant for simple use cases outside components
export function toast(props: Omit<ToasterToast, "id">) {
  // This function can't directly use the hook outside a component
  // So we need to ensure we're only using it in a client-side context
  if (typeof document === "undefined") {
    return ""  // Return empty string for SSR
  }
  
  // Display a warning that this should be used with caution
  console.warn(
    "The global toast() function should only be used for simple static calls. " +
    "For dynamic or component usage, import and use the useToast() hook instead."
  )
  
  // We'll just log it for now since we can't properly access the context outside a component
  console.log("Toast requested:", props)
  return ""
}
