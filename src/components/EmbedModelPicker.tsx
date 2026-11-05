import { useEffect, useState } from 'react'
import { HOST_KEY_CHANGED_EVENT, getHostBridge, readHostKeyId, type HostKeyOption } from '../lib/embedBridge'

function splitModels(value: string) {
  return value.split(',').map((m) => m.trim()).filter(Boolean)
}

/** Image models the current host-site key can call; checked ones form the model list. */
export default function EmbedModelPicker({ value, onChange }: { value: string; onChange: (model: string) => void }) {
  const [keys, setKeys] = useState<HostKeyOption[] | null>(null)
  const [keyId, setKeyId] = useState(readHostKeyId)
  const bridge = getHostBridge()
  const selected = splitModels(value)

  useEffect(() => {
    if (!bridge) return
    bridge.list().then(setKeys, () => setKeys([]))
  }, [bridge])

  useEffect(() => {
    const refresh = () => setKeyId(readHostKeyId())
    window.addEventListener(HOST_KEY_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(HOST_KEY_CHANGED_EVENT, refresh)
  }, [])

  const current = keys?.find((key) => key.id === keyId && key.eligible)
  // A key typed in by hand is unknown to the host: offer every model the user's keys can call.
  const available = current
    ? current.models
    : [...new Set((keys ?? []).flatMap((key) => key.models))]

  const toggle = (model: string) => {
    const next = selected.includes(model) ? selected.filter((m) => m !== model) : [...selected, model]
    if (next.length) onChange(next.join(','))
  }

  return (
    <div className="block">
      <span className="mb-1.5 block text-sm text-gray-600 dark:text-gray-300">模型 ID</span>
      {!keys ? (
        <div className="text-xs text-gray-500">正在读取可用模型…</div>
      ) : available.length === 0 ? (
        <div className="text-xs text-gray-500">当前密钥没有可用的生图模型，请先在上方选择支持生图的站内密钥。</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {available.map((model) => {
            const active = selected.includes(model)
            return (
              <button
                key={model}
                type="button"
                onClick={() => toggle(model)}
                aria-pressed={active}
                className={`rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
                  active
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'bg-black/[0.04] text-gray-600 hover:bg-black/[0.07] dark:bg-white/[0.06] dark:text-gray-300'
                }`}
              >
                {model}
              </button>
            )
          })}
        </div>
      )}
      <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-500">
        {current ? `密钥「${current.name}」可用的生图模型。` : '站内密钥可用的生图模型。'}可多选，首页的模型参数中切换。
      </div>
    </div>
  )
}
