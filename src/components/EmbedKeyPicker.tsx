import { useEffect, useState } from 'react'
import { HOST_KEY_CHANGED_EVENT, getHostBridge, type HostKeyOption } from '../lib/embedBridge'

/** Lets the user fill the API Key from keys they already created on the host site. */
export default function EmbedKeyPicker({ onPick }: { onPick: (apiKey: string, models: string[]) => void }) {
  const [keys, setKeys] = useState<HostKeyOption[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const bridge = getHostBridge()

  useEffect(() => {
    if (!bridge) return
    bridge.list().then(
      (list) => setKeys([...list].sort((a, b) => Number(b.eligible) - Number(a.eligible))),
      () => setError('读取站内 API 密钥失败'),
    )
    // The bridge object is stable for the lifetime of the host page.
  }, [])

  if (!bridge) return null

  const handleChange = async (value: string) => {
    if (!value) return
    setLoading(true)
    setError('')
    try {
      const id = Number(value)
      const apiKey = await bridge.reveal(id)
      onPick(apiKey, keys?.find((key) => key.id === id)?.models ?? [])
      window.dispatchEvent(new Event(HOST_KEY_CHANGED_EVENT))
    } catch {
      setError('获取密钥失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2">
      <select
        defaultValue=""
        disabled={loading || !keys}
        onChange={(e) => void handleChange(e.target.value)}
        className="w-full rounded-xl border border-transparent bg-black/[0.04] px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-300 disabled:opacity-60 dark:bg-white/[0.06] dark:text-gray-200"
        aria-label="选择站内 API 密钥"
      >
        <option value="">
          {!keys ? '正在读取站内 API 密钥…' : keys.length ? '选择站内已创建的 API 密钥' : '站内还没有可用的 API 密钥'}
        </option>
        {keys?.map((key) => (
          <option key={key.id} value={key.id} disabled={!key.eligible}>
            {key.name}（{key.group}）{key.eligible ? '' : ' · 该分组不支持生图'}
          </option>
        ))}
      </select>
      <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-500">
        {error || (
          <>
            只能选择所属分组支持生图的密钥；
            <a href="/keys" target="_top" className="underline underline-offset-2">前往 API 密钥创建</a>
          </>
        )}
      </div>
    </div>
  )
}
