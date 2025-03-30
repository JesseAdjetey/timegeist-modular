
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

// Helper function to display toasts easily
export function toast(props: Omit<ToasterToast, "id">) {
  if (typeof document !== "undefined") {
    const { toast } = useToast()
    return toast(props)
  }
  
  // Return empty function for SSR
  return () => {}
}
