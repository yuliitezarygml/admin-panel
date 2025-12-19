"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ClipboardList,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Gamepad2,
    Calendar,
    AlertCircle
} from "lucide-react"

export default function RequestsPage() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState(null)

    useEffect(() => {
        fetchRequests()
    }, [])

    const fetchRequests = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/requests')
            const data = await res.json()
            // Sort: pending first, then by date
            const sorted = data.sort((a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1
                if (a.status !== 'pending' && b.status === 'pending') return 1
                return new Date(b.created_at) - new Date(a.created_at)
            })
            setRequests(sorted)
        } catch (err) {
            console.error("Failed to fetch requests:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (id, action) => {
        setProcessingId(id)
        try {
            const adminId = localStorage.getItem('admin_id')
            const res = await fetch('http://localhost:5000/api/requests/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action, admin_id: adminId })
            })
            if (res.ok) {
                await fetchRequests()
            } else {
                const error = await res.json()
                alert(error.error || "Ошибка при выполнении действия")
            }
        } catch (err) {
            alert("Ошибка соединения с сервером")
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="glass p-8 rounded-3xl animate-pulse">Загрузка заявок...</div>
        </div>
    )

    const pendingCount = requests.filter(r => r.status === 'pending').length

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <ClipboardList className="text-blue-500" />
                        Заявки на аренду
                        {pendingCount > 0 && (
                            <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce">
                                {pendingCount} новых
                            </span>
                        )}
                    </h2>
                    <p className="text-gray-400 text-sm">Управление входящими запросами от пользователей</p>
                </div>
            </div>

            <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                    {requests.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass p-12 rounded-3xl text-center space-y-4"
                        >
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-500">
                                <AlertCircle size={32} />
                            </div>
                            <p className="text-gray-400">Заявок пока нет</p>
                        </motion.div>
                    ) : (
                        requests.map((request, idx) => (
                            <motion.div
                                key={request.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`glass p-6 rounded-3xl border transition-all ${request.status === 'pending'
                                    ? 'border-blue-500/20 bg-blue-500/[0.02]'
                                    : 'border-white/5 opacity-80'
                                    }`}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex items-start gap-5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${request.status === 'pending' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800 text-gray-500'
                                            }`}>
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg leading-tight mb-1">{request.user_name}</h4>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 font-medium">
                                                <span className="flex items-center gap-1.5 ring-1 ring-white/5 px-2 py-0.5 rounded-md bg-white/5">
                                                    <Gamepad2 size={14} className="text-blue-400" />
                                                    {request.console_name}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={14} />
                                                    {request.selected_hours}ч
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={14} />
                                                    {new Date(request.created_at).toLocaleString('ru-RU', {
                                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 lg:ml-auto">
                                        {request.status === 'pending' ? (
                                            <>
                                                <button
                                                    disabled={processingId === request.id}
                                                    onClick={() => handleAction(request.id, 'reject')}
                                                    className="px-6 py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
                                                >
                                                    <XCircle size={18} />
                                                    Отклонить
                                                </button>
                                                <button
                                                    disabled={processingId === request.id}
                                                    onClick={() => handleAction(request.id, 'approve')}
                                                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                                                >
                                                    <CheckCircle2 size={18} />
                                                    Одобрить
                                                </button>
                                            </>
                                        ) : (
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${request.status === 'approved'
                                                ? 'bg-green-500/10 text-green-400'
                                                : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                {request.status === 'approved' ? 'Одобрена' : 'Отклонена'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
