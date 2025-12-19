"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    History,
    Search,
    Clock,
    Gamepad2,
    Calendar,
    Wallet,
    CheckCircle2,
    Timer,
    ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function HistoryPage() {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/history')
            const data = await res.json()
            setHistory(data)
        } catch (err) {
            console.error("Failed to fetch history:", err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="glass p-8 rounded-3xl animate-pulse">Загрузка истории...</div>
        </div>
    )

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <History className="text-orange-500" />
                        История аренд
                    </h2>
                    <p className="text-gray-400 text-sm">Полный список всех завершенных и активных сессий</p>
                </div>
            </div>

            <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                    {history.length === 0 ? (
                        <div className="glass p-12 rounded-3xl text-center text-gray-500 italic">Истории пока нет</div>
                    ) : (
                        history.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="glass p-6 rounded-3xl border border-white/5 hover:bg-white/[0.02] transition-all group"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-6">
                                    {/* Client & Console */}
                                    <div className="md:col-span-1 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
                                            <Gamepad2 size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white group-hover:text-orange-400 transition-colors">{item.console_name}</h4>
                                            <p className="text-sm text-gray-500">Клиент: {item.user_name}</p>
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div className="md:col-span-2 flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-gray-500 font-bold mb-1">Начало</span>
                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                <Calendar size={14} className="text-gray-600" />
                                                {new Date(item.start_time).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        <ArrowRight className="text-gray-700 shrink-0" size={20} />

                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-gray-500 font-bold mb-1">Окончание</span>
                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                <Calendar size={14} className="text-gray-600" />
                                                {new Date(item.end_time).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status & Price */}
                                    <div className="md:col-span-1 flex items-center justify-end gap-6 text-right">
                                        <div>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest block mb-2",
                                                item.status === 'active' ? "bg-green-500/10 text-green-400" : "bg-gray-800 text-gray-500"
                                            )}>
                                                {item.status === 'active' ? "Active" : "Completed"}
                                            </span>
                                            <p className="text-lg font-bold text-white whitespace-nowrap">
                                                {item.total_cost || 0} MDL
                                            </p>
                                        </div>
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
