"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Tag,
    XCircle,
    Info,
    Save,
    Trash2,
    CalendarDays
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [discounts, setDiscounts] = useState({})
    const [loading, setLoading] = useState(true)
    const [selectedDay, setSelectedDay] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)

    // Form state
    const [formType, setFormType] = useState('discount') // 'discount', 'blackout'
    const [formValue, setFormValue] = useState(20)
    const [formDesc, setFormDesc] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchDiscounts()
    }, [])

    const fetchDiscounts = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/discounts')
            const data = await res.json()
            setDiscounts(data)
        } catch (err) {
            console.error("Failed to fetch discounts:", err)
        } finally {
            setLoading(false)
        }
    }

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    const formatDate = (day) => {
        const y = currentDate.getFullYear()
        const m = String(currentDate.getMonth() + 1).padStart(2, '0')
        const d = String(day).padStart(2, '0')
        return `${y}-${m}-${d}`
    }

    const openDayModal = (day) => {
        const dateStr = formatDate(day)
        const existing = discounts[dateStr] || {}

        setSelectedDay(day)
        setFormType(existing.type || 'discount')
        setFormValue(existing.value || 20)
        setFormDesc(existing.description || '')
        setModalOpen(true)
    }

    const handleSave = async (isDelete = false) => {
        setSaving(true)
        const dateStr = formatDate(selectedDay)

        try {
            const res = await fetch('http://localhost:5000/api/discounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateStr,
                    type: formType,
                    value: formValue,
                    description: formDesc,
                    delete: isDelete
                })
            })

            if (res.ok) {
                await fetchDiscounts()
                setModalOpen(false)
            }
        } catch (err) {
            console.error("Save failed:", err)
        } finally {
            setSaving(false)
        }
    }

    const renderCalendar = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const totalDays = daysInMonth(year, month)
        const firstDay = firstDayOfMonth(year, month)

        // Days from prev month to fill the first week
        const prevMonthDays = []
        for (let i = 0; i < firstDay; i++) {
            prevMonthDays.push(<div key={`prev-${i}`} className="h-32 bg-white/[0.01] border border-white/5 rounded-2xl opacity-20" />)
        }

        const currentMonthDays = []
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = formatDate(d)
            const event = discounts[dateStr]
            const isToday = new Date().toDateString() === new Date(year, month, d).toDateString()

            currentMonthDays.push(
                <motion.div
                    key={d}
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.03)" }}
                    onClick={() => openDayModal(d)}
                    className={cn(
                        "h-32 p-4 border border-white/5 rounded-2xl cursor-pointer transition-all relative group",
                        isToday ? "border-purple-500/50 bg-purple-500/5" : "bg-white/[0.02]"
                    )}
                >
                    <span className={cn(
                        "text-sm font-bold",
                        isToday ? "text-purple-400" : "text-gray-500"
                    )}>{d}</span>

                    {event && (
                        <div className={cn(
                            "mt-2 p-2 rounded-xl text-[10px] font-bold uppercase tracking-wider space-y-1",
                            event.type === 'discount' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        )}>
                            <div className="flex items-center justify-between">
                                <span>{event.type === 'discount' ? "Скидка" : "Блокировка"}</span>
                                {event.type === 'discount' && <span>{event.value}%</span>}
                            </div>
                            {event.description && <div className="truncate opacity-60 normal-case font-medium">{event.description}</div>}
                        </div>
                    )}
                </motion.div>
            )
        }

        return [...prevMonthDays, ...currentMonthDays]
    }

    const monthNames = [
        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ]

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <CalendarDays className="text-purple-500" />
                        Календарь Бронирования
                    </h2>
                    <p className="text-gray-400 text-sm">Управление скидками и техническими перерывами</p>
                </div>

                <div className="flex items-center gap-4 glass p-1.5 rounded-2xl border border-white/10">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-white font-bold min-w-[140px] text-center">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </div>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Stats/Legend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-[2rem] border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                        <Tag size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Скидки</p>
                        <p className="text-xl font-bold text-white">Дни лояльности</p>
                    </div>
                </div>
                <div className="glass p-6 rounded-[2rem] border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                        <XCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Блокировка</p>
                        <p className="text-xl font-bold text-white">Тех. перерывы</p>
                    </div>
                </div>
                <div className="glass p-6 rounded-[2rem] border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Info size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Инфо</p>
                        <p className="text-xl font-bold text-white">Нажмите на день</p>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="glass rounded-[2.5rem] p-8 border border-white/5">
                <div className="grid grid-cols-7 gap-4 mb-6 text-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <div>Вс</div><div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div>
                </div>
                <div className="grid grid-cols-7 gap-4">
                    {renderCalendar()}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md glass p-8 rounded-[32px] border border-white/10 shadow-2xl"
                        >
                            <h3 className="text-2xl font-bold text-white mb-2">
                                {selectedDay} {monthNames[currentDate.getMonth()]}
                            </h3>
                            <p className="text-gray-500 text-sm mb-8">Настройка правил для выбранного дня</p>

                            <div className="space-y-6">
                                {/* Type Selector */}
                                <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
                                    <button
                                        onClick={() => setFormType('discount')}
                                        className={cn(
                                            "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                                            formType === 'discount' ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "text-gray-400 hover:text-white"
                                        )}
                                    >
                                        <Tag size={16} /> Скидка
                                    </button>
                                    <button
                                        onClick={() => setFormType('blackout')}
                                        className={cn(
                                            "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                                            formType === 'blackout' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-gray-400 hover:text-white"
                                        )}
                                    >
                                        <XCircle size={16} /> Блок
                                    </button>
                                </div>

                                {formType === 'discount' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Размер скидки (%)</label>
                                        <input
                                            type="number"
                                            value={formValue}
                                            onChange={e => setFormValue(Number(e.target.value))}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white font-bold"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Описание (для клиентов)</label>
                                    <textarea
                                        value={formDesc}
                                        onChange={e => setFormDesc(e.target.value)}
                                        placeholder="Например: Праздничная акция"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white min-h-[100px] resize-none"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    {discounts[formatDate(selectedDay)] && (
                                        <button
                                            onClick={() => handleSave(true)}
                                            disabled={saving}
                                            className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20 transition-all border border-red-500/20"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleSave(false)}
                                        disabled={saving}
                                        className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20"
                                    >
                                        <Save size={20} /> {saving ? "Сохранение..." : "Сохранить"}
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
