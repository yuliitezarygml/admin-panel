"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Wallet,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
    History,
    DollarSign,
    TrendingDown
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function FinancePage() {
    const [stats, setStats] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch('http://localhost:5000/api/stats').then(res => res.json()),
            fetch('http://localhost:5000/api/history').then(res => res.json())
        ]).then(([statsData, historyData]) => {
            setStats(statsData)
            setHistory(historyData)
            setLoading(false)
        }).catch(err => {
            console.error("Failed to fetch finance data:", err)
            setLoading(false)
        })
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="glass p-8 rounded-3xl animate-pulse">Загрузка финансов...</div>
        </div>
    )

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Wallet className="text-green-500" />
                    Финансовый отчет
                </h2>
                <p className="text-gray-400 text-sm">Аналитика доходов и история транзакций</p>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Общий доход</h3>
                    <p className="text-3xl font-bold text-white">{stats?.total_revenue || 0} MDL</p>
                    <p className="text-xs text-green-500 mt-2 flex items-center gap-1 font-bold">
                        <ArrowUpRight size={14} /> +0% <span className="text-gray-500 font-normal">к прошлому месяцу</span>
                    </p>
                </div>

                <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                            <CreditCard size={24} />
                        </div>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Средний чек</h3>
                    <p className="text-3xl font-bold text-white">
                        {history.length > 0 ? Math.round(stats?.total_revenue / history.length) : 0} MDL
                    </p>
                    <p className="text-xs text-blue-400 mt-2 flex items-center gap-1 font-bold">
                        <TrendingUp size={14} /> Стабильно
                    </p>
                </div>

                <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                            <History size={24} />
                        </div>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Всего транзакций</h3>
                    <p className="text-3xl font-bold text-white">{history.length}</p>
                    <p className="text-xs text-purple-400 mt-2 flex items-center gap-1 font-bold">
                        <ArrowUpRight size={14} /> {history.filter(h => h.status === 'active').length} активно
                    </p>
                </div>
            </div>

            {/* Transaction History */}
            <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <h3 className="font-bold text-white">Последние начисления</h3>
                </div>
                <div className="divide-y divide-white/5">
                    {history.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 italic">Транзакций пока нет</div>
                    ) : (
                        history.map((item, idx) => (
                            <div key={item.id} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-green-500/10 group-hover:text-green-400 transition-colors">
                                        <DollarSign size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-200">Оплата аренды: {item.console_name}</p>
                                        <p className="text-xs text-gray-500">{new Date(item.start_time).toLocaleString('ru-RU')}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-500">+{item.total_cost || 0} MDL</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{item.status}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
