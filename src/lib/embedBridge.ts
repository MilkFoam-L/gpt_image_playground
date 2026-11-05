/** Same-origin bridge exposed by the ApophisCode console page hosting this iframe. */
export interface HostKeyOption {
  id: number
  name: string
  group: string
  models: string[]
  eligible: boolean
}

export interface HostKeyBridge {
  list: () => Promise<HostKeyOption[]>
  reveal: (id: number) => Promise<string>
}

/** Written by the host (and by the key picker) when a site key is chosen. */
export const HOST_KEY_ID_STORAGE = 'apophiscode:image-key-id'

export function getHostBridge(): HostKeyBridge | null {
  try {
    const host = window.parent as Window & { apophiscodeKeyBridge?: HostKeyBridge }
    return host !== window && host.apophiscodeKeyBridge ? host.apophiscodeKeyBridge : null
  } catch {
    return null
  }
}

export function readHostKeyId(): number | null {
  try {
    const value = Number(localStorage.getItem(HOST_KEY_ID_STORAGE))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

/** Fired in this window after a site key is picked so the model picker re-reads it. */
export const HOST_KEY_CHANGED_EVENT = 'apophiscode:key-changed'
