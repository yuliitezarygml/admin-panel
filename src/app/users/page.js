"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Users,
    Search,
    MoreVertical,
    Calendar,
    Filter,
    XCircle,
    History,
    Gamepad2,
    Clock,
    DollarSign
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function UsersPage() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedUser, setSelectedUser] = useState(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/users')
            const data = await res.json()
            setUsers(data)
        } catch (err) {
            console.error("Failed to fetch users:", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(u =>
        (u.first_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (u.username?.toLowerCase() || "").includes(search.toLowerCase())
    )

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="glass p-8 rounded-3xl animate-pulse">Загрузка пользователей...</div>
        </div>
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Users className="text-purple-500" />
                        Пользователи
                        <span className="text-sm font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                            {users.length}
                        </span>
                    </h2>
                    <p className="text-gray-400 text-sm">База данных клиентов и их активность</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Поиск по имени или username..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all w-64 text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="glass rounded-3xl overflow-hidden border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">
                            <th className="px-8 py-5">Клиент</th>
                            <th className="px-8 py-5 text-center">Статус</th>
                            <th className="px-8 py-5">Регистрация</th>
                            <th className="px-8 py-5">Аренды</th>
                            <th className="px-8 py-5 text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-12 text-center text-gray-500 italic">Пользователи не найдены</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, idx) => (
                                    <motion.tr
                                        key={user.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="group hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center font-bold text-purple-400 border border-white/5 group-hover:scale-110 transition-transform">
                                                    {user.first_name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-200">{user.first_name}</p>
                                                    <p className="text-xs text-gray-500">@{user.username || user.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                user.is_banned ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                                            )}>
                                                {user.is_banned ? "Banned" : "Active"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Calendar size={14} className="text-gray-600" />
                                                {new Date(user.joined_at).toLocaleDateString('ru-RU')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="flex items-center gap-2 group/btn hover:bg-white/5 px-3 py-2 rounded-xl transition-all"
                                            >
                                                <span className="w-2 h-2 rounded-full bg-purple-500/50 group-hover/btn:scale-150 transition-transform" />
                                                <span className="text-sm font-bold text-gray-200 border-b border-white/10">{user.rentals?.length || 0}</span>
                                            </button>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Individual User Rentals Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedUser(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl glass p-8 rounded-[32px] border border-white/10 shadow-2xl max-h-[80vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                        <History size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Сессии: {selectedUser.first_name}</h2>
                                        <p className="text-sm text-gray-500">История аренд пользователя</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                {selectedUser.rentals?.length === 0 ? (
                                    <div className="py-12 text-center text-gray-500 italic">Аренд пока нет</div>
                                ) : (
                                    selectedUser.rentals.sort((a, b) => new Date(b.start_time) - new Date(a.start_time)).map((rental, i) => (
                                        <div key={rental.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-colors group">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 rounded-xl bg-white/5 text-purple-400 group-hover:scale-110 transition-transform">
                                                        <Gamepad2 size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-200">{rental.console_name}</p>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(rental.start_time).toLocaleString('ru-RU')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 text-green-500 font-bold">
                                                        <DollarSign size={14} />
                                                        {rental.total_cost || 0} MDL
                                                    </div>
                                                    <span className={cn(
                                                        "text-[10px] uppercase font-bold tracking-widest mt-1 block",
                                                        rental.status === 'active' ? "text-blue-400 animate-pulse" : "text-gray-600"
                                                    )}>
                                                        {rental.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
