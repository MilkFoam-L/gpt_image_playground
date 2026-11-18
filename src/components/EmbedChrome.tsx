import { useState } from 'react'
import { useStore } from '../store'
import { UPSTREAM_REPO_URL } from '../lib/embed'
import { getActiveApiProfile } from '../lib/apiProfiles'
import { HOST_KEY_CHANGED_EVENT, getHostBridge } from '../lib/embedBridge'
import { prepareSettingsForCommit } from '../lib/settingsActions'
import HelpModal from './HelpModal'
import { HelpCircleIcon, SettingsIcon } from './icons'

/**
 * Help and settings, shown inline in the search row instead of a top bar.
 * Agent mode needs the Responses API, which the locked Images preset lacks,
 * so the embed only offers the gallery.
 */
export function EmbedToolbar() {
  const appMode = useStore((s) => s.appMode)
  const setShowSettings = useStore((s) => s.setShowSettings)
  const filterFavorite = useStore((s) => s.filterFavorite)
  const activeFavoriteCollectionId = useStore((s) => s.activeFavoriteCollectionId)
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div data-no-drag-select className="flex flex-shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => setShowHelp(true)}
        className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06]"
        aria-label="操作指南"
        title="操作指南"
      >
        <HelpCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      </button>
      <button
        type="button"
        onClick={() => setShowSettings(true)}
        className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06]"
        aria-label="设置"
        title="设置"
      >
        <SettingsIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      </button>
      {showHelp && (
        <HelpModal
          appMode={appMode}
          isFavoriteCollectionOverview={appMode === 'gallery' && filterFavorite && !activeFavoriteCollectionId}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  )
}

/** Key hint and open-source notice under the prompt box. */
/** Puts a host key into the active (locked) profile, like the settings key picker. */
function applyHostKey(apiKey: string, models: string[]) {
  const { settings, setSettings } = useStore.getState()
  const active = getActiveApiProfile(settings)
  const patch = models.length ? { apiKey, model: models.join(',') } : { apiKey }
  setSettings(prepareSettingsForCommit({
    ...settings,
    profiles: settings.profiles.map((profile) => profile.id === active.id ? { ...profile, ...patch } : profile),
  }))
  window.dispatchEvent(new Event(HOST_KEY_CHANGED_EVENT))
}

export function EmbedInputFooter({ missingKey }: { missingKey: boolean }) {
  const setShowSettings = useStore((s) => s.setShowSettings)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const bridge = getHostBridge()

  const createKey = async () => {
    if (!bridge?.create) return
    setCreating(true)
    setError('')
    try {
      const { apiKey, models } = await bridge.create()
      applyHostKey(apiKey, models)
    } catch (e) {
      const message = e instanceof Error ? e.message : ''
      // The host reports a declined usage notice with this exact message.
      if (message !== 'Key creation cancelled') setError(message || '创建密钥失败，请稍后重试')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mt-2 space-y-1 px-1 text-center text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
      {missingKey && bridge?.create && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={creating}
            onClick={() => void createKey()}
            className="rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
          >
            {creating ? '正在创建…' : '一键创建生图密钥'}
          </button>
          <span>系统自动创建并选中，创建后可直接生图</span>
        </div>
      )}
      {error && <p className="text-red-500">{error}</p>}
      {missingKey && (
        <p>
          未找到属于支持该模型分组的 API 密钥，请在
          <button type="button" onClick={() => setShowSettings(true)} className="mx-0.5 font-medium text-gray-900 underline underline-offset-2 dark:text-gray-100">
            设置
          </button>
          中填写，或
          <a href="/keys" target="_top" className="ml-0.5 font-medium text-gray-900 underline underline-offset-2 dark:text-gray-100">
            前往 API 密钥创建
          </a>
          。
        </p>
      )}
      <p>
        在线生图基于开源项目{' '}
        <a href={UPSTREAM_REPO_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-700 hover:underline dark:text-gray-300">
          gpt_image_playground
        </a>
        （MIT License）
      </p>
    </div>
  )
}
