
import * as React from "react"
import { 
  Toast, 
  ToastClose, 
  ToastDescription, 
  ToastProvider, 
  ToastTitle, 
  ToastViewport 
} from "@/components/ui/toast"
import { 
  Action, 
  actionTypes, 
  State, 
  TOAST_REMOVE_DELAY, 
  ToasterToast 
} from "./toast-types"

// Global toast timeout tracker
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

// Counter for generating unique toast IDs
let count = 0

export function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, 5), // Using TOAST_LIMIT
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // Side effects - could be extracted into a dismissToast() action
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
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
  }
}

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

// Create a dispatch context
export const ToastDispatchContext = React.createContext<React.Dispatch<Action> | undefined>(
  undefined
)

// Global dispatch function for timeouts
let dispatch: React.Dispatch<Action>

// Toast provider component to be used in applications
export function Toaster() {
  const [state, dispatchState] = React.useReducer(reducer, {
    toasts: [],
  });

  // Set the global dispatch to the current dispatch
  dispatch = dispatchState;

  React.useEffect(() => {
    return () => {
      toastTimeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
      toastTimeouts.clear();
    };
  }, []);
  
  return (
    <ToastDispatchContext.Provider value={dispatchState}>
      <ToastProvider>
        {state.toasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          );
        })}
        <ToastViewport />
      </ToastProvider>
    </ToastDispatchContext.Provider>
  );
}
