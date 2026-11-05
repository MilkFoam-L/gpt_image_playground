import { useLayoutEffect, useState, useSyncExternalStore } from 'react'
import { COLOR_MODE_KEY, resolveDarkMode } from '../lib/colorMode'
import { useStore } from '../store'
import type { ColorMode } from '../types'

// When embedded in the ApophisCode (new-api) console, follow the host theme.
const HOST_THEME_KEY = 'newapi:theme:v1:mode'

function readHostMode(): ColorMode | null {
  try {
    const value = localStorage.getItem(HOST_THEME_KEY)
    return value === 'light' || value === 'dark' || value === 'system' ? value : null
  } catch {
    return null
  }
}

export function useColorMode() {
  const ownMode = useStore((s) => s.settings.colorMode)
  const [hostMode, setHostMode] = useState<ColorMode | null>(readHostMode)
  const colorMode = hostMode ?? ownMode

  useLayoutEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === HOST_THEME_KEY) setHostMode(readHostMode())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(COLOR_MODE_KEY) !== colorMode) localStorage.setItem(COLOR_MODE_KEY, colorMode)
    } catch (err) {
      console.warn('缓存颜色模式失败：', err)
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      document.documentElement.classList.toggle('dark', resolveDarkMode(colorMode, media.matches))
    }
    apply()
    if (colorMode !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [colorMode])
}

function subscribeDarkClass(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

/** 当前是否为深色，随颜色模式设置和系统切换更新 */
export function useIsDarkMode() {
  return useSyncExternalStore(subscribeDarkClass, () => document.documentElement.classList.contains('dark'))
}
