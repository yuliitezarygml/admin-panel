"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Settings as SettingsIcon,
    Bot,
    Shield,
    Bell,
    Save,
    RotateCcw,
    Key,
    MessageSquare
} from "lucide-react"

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        bot_token: '',
        admin_chat_id: '',
        require_approval: true,
        notifications_enabled: true
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState(null)

    useEffect(() => {
        fetch('http://localhost:5000/api/settings')
            .then(res => res.json())
            .then(data => {
                setSettings(prev => ({ ...prev, ...data }))
                setLoading(false)
            })
            .catch(err => {
                console.error("Failed to fetch settings:", err)
                setLoading(false)
            })
    }, [])

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)
        try {
            const res = await fetch('http://localhost:5000/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            if (res.ok) {
                setMessage({ type: 'success', text: 'Настройки успешно сохранены' })
            } else {
                setMessage({ type: 'error', text: 'Ошибка при сохранении' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Ошибка соединения с сервером' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="glass p-8 rounded-3xl animate-pulse">Загрузка настроек...</div>
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Настройки системы</h2>
                    <p className="text-gray-400 text-sm">Управление Telegram ботом и параметрами аренды</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6 pb-20">
                {/* Telegram Section */}
                <section className="glass p-8 rounded-3xl border border-white/5 space-y-6">
                    <div className="flex items-center gap-3 text-blue-400 mb-2">
                        <Bot size={24} />
                        <h3 className="text-lg font-bold">Интеграция с Telegram</h3>
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                <Key size={14} />
                                Токен бота
                            </label>
                            <input
                                type="password"
                                value={settings.bot_token}
                                onChange={e => setSettings({ ...settings, bot_token: e.target.value })}
                                placeholder="8265021298:AAH..."
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                <MessageSquare size={14} />
                                ID администратора
                            </label>
                            <input
                                type="text"
                                value={settings.admin_chat_id}
                                onChange={e => setSettings({ ...settings, admin_chat_id: e.target.value })}
                                placeholder="762139684"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>
                </section>

                {/* Bot Content Section */}
                <section className="glass p-8 rounded-3xl border border-white/5 space-y-6">
                    <div className="flex items-center gap-3 text-purple-400 mb-2">
                        <MessageSquare size={24} />
                        <h3 className="text-lg font-bold">Контент бота</h3>
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                Текст кнопки "Помощь"
                            </label>
                            <input
                                type="text"
                                value={settings.help_button_text || 'ℹ️ Помощь'}
                                onChange={e => setSettings({ ...settings, help_button_text: e.target.value })}
                                placeholder="ℹ️ Помощь"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                Текст сообщения помощи
                            </label>
                            <textarea
                                value={settings.help_text || ''}
                                onChange={e => setSettings({ ...settings, help_text: e.target.value })}
                                placeholder="Введите текст сообщения, которое получит пользователь при нажатии на кнопку помощи..."
                                rows={6}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all resize-none"
                            />
                            <p className="text-[10px] text-gray-500 italic">Поддерживается Markdown разметка</p>
                        </div>
                    </div>
                </section>

                {/* System Rules */}
                <section className="glass p-8 rounded-3xl border border-white/5 space-y-6">
                    <div className="flex items-center gap-3 text-orange-400 mb-2">
                        <Shield size={24} />
                        <h3 className="text-lg font-bold">Правила системы</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                            <div>
                                <span className="text-gray-200 font-medium block">Одобрение заявок</span>
                                <span className="text-xs text-gray-500">Требовать ручного подтверждения каждой аренды</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, require_approval: !settings.require_approval })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.require_approval ? 'bg-blue-600' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.require_approval ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                            <div>
                                <span className="text-gray-200 font-medium block">Уведомления</span>
                                <span className="text-xs text-gray-500">Отправлять операционные уведомления в бот</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, notifications_enabled: !settings.notifications_enabled })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.notifications_enabled ? 'bg-orange-600' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.notifications_enabled ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-4 pt-4">
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`text-sm font-medium ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
                        >
                            {message.text}
                        </motion.div>
                    )}
                    <div className="flex gap-4 ml-auto">
                        <button
                            type="button"
                            className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 font-bold"
                        >
                            <RotateCcw size={18} />
                            Сбросить
                        </button>
                        <button
                            disabled={saving}
                            type="submit"
                            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-2 font-bold shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                        >
                            {saving ? 'Сохранение...' : (
                                <>
                                    <Save size={18} />
                                    Сохранить
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
