"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Gamepad2,
  Users,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isManualModalOpen, setManualModalOpen] = useState(false)
  const [availableConsoles, setAvailableConsoles] = useState([])
  const [selectedConsole, setSelectedConsole] = useState(null)
  const [selectedHours, setSelectedHours] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = () => {
      Promise.all([
        fetch('http://localhost:5000/api/stats').then(res => res.json()),
        fetch('http://localhost:5000/api/health').then(res => res.json())
      ]).then(([stats, healthData]) => {
        setData(stats)
        setHealth(healthData)
        setLoading(false)
      }).catch(err => {
        console.error("Failed to fetch dashboard data:", err)
        setLoading(false)
      })
    }

    fetchData()
    const interval = setInterval(fetchData, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

  const openManualModal = async () => {
    setManualModalOpen(true)
    try {
      const res = await fetch('http://localhost:5000/api/consoles')
      const data = await res.json()
      setAvailableConsoles(data.filter(c => c.status === 'available'))
    } catch (err) {
      console.error("Failed to fetch consoles:", err)
    }
  }

  const startManualRental = async () => {
    if (!selectedConsole) return
    setIsSubmitting(true)
    try {
      const res = await fetch('http://localhost:5000/api/rentals/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          console_id: selectedConsole.id,
          hours: selectedHours
        })
      })
      if (res.ok) {
        setManualModalOpen(false)
        setSelectedConsole(null)
        // Refresh data
        const statsRes = await fetch('http://localhost:5000/api/stats')
        const stats = await statsRes.json()
        setData(stats)
      } else {
        alert("Ошибка при создании аренды")
      }
    } catch (err) {
      alert("Ошибка соединения")
    } finally {
      setIsSubmitting(false)
    }
  }

  const stats = [
    {
      label: "Общий доход",
      value: data ? `${data.total_revenue} MDL` : "---",
      subValue: data?.revenue_per_minute ? `+${data.revenue_per_minute} MDL/min` : null,
      change: "+0%",
      trend: "up",
      icon: Wallet,
      color: "blue"
    },
    {
      label: "Активные аренды",
      value: data ? data.active_rentals : "---",
      change: "0",
      trend: "up",
      icon: Zap,
      color: "orange"
    },
    {
      label: "Всего клиентов",
      value: data ? data.total_users : "---",
      change: "0",
      trend: "up",
      icon: Users,
      color: "purple"
    },
    {
      label: "Свободные консоли",
      value: data ? `${data.available_consoles} / ${data.total_consoles}` : "---",
      change: "0",
      trend: "neutral",
      icon: Gamepad2,
      color: "green"
    },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass p-6 rounded-2xl relative overflow-hidden group hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn(
                "p-3 rounded-xl transition-transform group-hover:scale-110 duration-300",
                stat.color === 'blue' && "bg-blue-500/10 text-blue-400",
                stat.color === 'orange' && "bg-orange-500/10 text-orange-400",
                stat.color === 'purple' && "bg-purple-500/10 text-purple-400",
                stat.color === 'green' && "bg-green-500/10 text-green-400",
              )}>
                <stat.icon size={24} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                stat.trend === 'up' ? "bg-green-500/10 text-green-400" : (stat.trend === 'neutral' ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400")
              )}>
                {stat.change}
                {stat.trend === 'up' ? <ArrowUpRight size={14} /> : (stat.trend === 'neutral' ? null : <ArrowDownRight size={14} />)}
              </div>
            </div>

            <h3 className="text-gray-400 text-sm font-medium mb-1">{stat.label}</h3>
            <p className="text-2xl font-bold tracking-tight text-white">
              {loading ? <span className="opacity-50 animate-pulse">Загрузка...</span> : stat.value}
            </p>
            {stat.subValue && (
              <p className="text-[10px] font-bold text-blue-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                {stat.subValue}
              </p>
            )}

            {/* Glow Effect on Hover */}
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <TrendingUp className="text-blue-500" />
              Поток активности
            </h2>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Весь лог</button>
          </div>

          <div className="space-y-6">
            {!data?.activity || data.activity.length === 0 ? (
              <div className="p-12 text-center text-gray-500 italic">Активности пока нет</div>
            ) : (
              data.activity.map((act, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    act.type === 'rental' ? "bg-blue-500/10 text-blue-400" : "bg-gray-800 text-gray-400"
                  )}>
                    <Gamepad2 size={20} />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-semibold text-gray-200">{act.title}</h4>
                    <p className="text-sm text-gray-400">{act.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">
                      {new Date(act.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {act.amount && <span className="text-xs font-bold text-green-500">+{act.amount} MDL</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions / System Health */}
        <div className="space-y-6">
          <div className="glass rounded-3xl p-8 bg-gradient-to-br from-blue-600/10 to-transparent">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-blue-400">
              <ShieldCheck />
              Статус системы
            </h2>
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5 group/item">
                <span className="text-sm text-gray-300">Telegram Bot</span>
                <span className={cn(
                  "px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest transition-all",
                  health?.bot_status === 'Active' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                )}>
                  {health?.bot_status || 'Checking...'}
                </span>
              </div>
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                <span className="text-sm text-gray-300">Database</span>
                <span className={cn(
                  "px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest",
                  health?.db_status === 'Healthy' ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"
                )}>
                  {health?.db_status || 'Checking...'}
                </span>
              </div>
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                <span className="text-sm text-gray-300">Disk Storage</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-1000",
                        health?.storage_status === 'Safe' ? "bg-green-500" : "bg-orange-500"
                      )}
                      style={{ width: `${health?.storage_percent || 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">{Math.round(health?.storage_percent || 0)}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                <span className="text-sm text-gray-300">Memory Usage</span>
                <span className="text-xs text-blue-400 font-mono">{health?.memory_usage || '---'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={openManualModal}
            className="w-full glass p-8 rounded-3xl group relative overflow-hidden transition-transform active:scale-95"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-colors" />
            <div className="relative z-10 flex flex-col items-center gap-3 text-blue-400">
              <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap size={30} fill="currentColor" />
              </div>
              <span className="font-bold text-lg">Быстрый запуск</span>
              <p className="text-xs text-blue-400/60 text-center">Создать новую аренду вручную без бота</p>
            </div>
          </button>
        </div>
      </div>

      {/* Manual Rental Modal */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManualModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass p-8 rounded-[32px] border border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Zap className="text-blue-500" />
                  Ручной запуск
                </h2>
                <button
                  onClick={() => setManualModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-3 block">Выберите консоль</label>
                  <div className="grid grid-cols-2 gap-3">
                    {availableConsoles.length === 0 ? (
                      <p className="col-span-2 text-center py-4 bg-red-500/5 text-red-400 rounded-xl text-sm italic">
                        Нет свободных консолей
                      </p>
                    ) : (
                      availableConsoles.map(console => (
                        <button
                          key={console.id}
                          onClick={() => setSelectedConsole(console)}
                          className={cn(
                            "p-4 rounded-2xl border transition-all text-left",
                            selectedConsole?.id === console.id
                              ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20 scale-[1.02]"
                              : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10"
                          )}
                        >
                          <p className="font-bold leading-tight">{console.name}</p>
                          <p className="text-[10px] opacity-60 mt-1 uppercase tracking-wider">{console.type}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-3 block">Длительность (часы)</label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 4, 12, 24].map(h => (
                      <button
                        key={h}
                        onClick={() => setSelectedHours(h)}
                        className={cn(
                          "px-4 py-2 rounded-xl border transition-all font-bold",
                          selectedHours === h
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                        )}
                      >
                        {h}ч
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    disabled={!selectedConsole || isSubmitting}
                    onClick={startManualRental}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:grayscale text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? "Запуск..." : (
                      <>
                        <Zap size={20} fill="white" />
                        Арендовать сейчас
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
