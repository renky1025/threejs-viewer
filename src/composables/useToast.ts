import { readonly, ref } from 'vue'

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

const toasts = ref<ToastItem[]>([])
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function removeToast(id: string): void {
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
  toasts.value = toasts.value.filter((item) => item.id !== id)
}

function showToast(payload: ToastPayload): string {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const item: ToastItem = {
    id,
    type: payload.type ?? 'info',
    message: payload.message,
    duration: payload.duration ?? 3200
  }

  toasts.value = [...toasts.value, item]

  if (item.duration > 0) {
    const timer = setTimeout(() => {
      removeToast(id)
    }, item.duration)
    timers.set(id, timer)
  }

  return id
}

function clearAllToasts(): void {
  timers.forEach((timer) => clearTimeout(timer))
  timers.clear()
  toasts.value = []
}

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

export function useToast() {
  return {
    toasts: readonly(toasts),
    showToast,
    removeToast,
    clearAllToasts
  }
}
