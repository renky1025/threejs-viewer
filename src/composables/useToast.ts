import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration: number
}

interface ToastPayload {
  type?: ToastType
  message: string
  duration?: number
}

interface ToastState {
  toasts: ToastItem[]
  timers: Map<string, ReturnType<typeof setTimeout>>
  showToast: (payload: ToastPayload) => string
  removeToast: (id: string) => void
  clearAllToasts: () => void
}

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  timers: new Map(),

  showToast: (payload: ToastPayload) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const item: ToastItem = {
      id,
      type: payload.type ?? 'info',
      message: payload.message,
      duration: payload.duration ?? 3200
    }

    set((state) => {
      const newToasts = [...state.toasts, item]
      
      if (item.duration > 0) {
        const timer = setTimeout(() => {
          get().removeToast(id)
        }, item.duration)
        state.timers.set(id, timer)
      }
      
      return { toasts: newToasts }
    })

    return id
  },

  removeToast: (id: string) => {
    set((state) => {
      const timer = state.timers.get(id)
      if (timer) {
        clearTimeout(timer)
        state.timers.delete(id)
      }
      return { toasts: state.toasts.filter((item) => item.id !== id) }
    })
  },

  clearAllToasts: () => {
    set((state) => {
      state.timers.forEach((timer) => clearTimeout(timer))
      state.timers.clear()
      return { toasts: [] }
    })
  }
}))

export const showToast = (payload: ToastPayload) => useToast.getState().showToast(payload)

export function getErrorMessage(error: unknown, fallback = '操作失败，请稍后重试'): string {
  if (typeof error === 'string' && error.trim()) return error.trim()
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage.trim()
    }
  }
  return fallback
}
