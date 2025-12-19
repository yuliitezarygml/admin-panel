"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Users,
    Search,
    Shield,
    Plus,
    XCircle,
    UserCircle,
    Key,
    Lock,
    Trash2,
    Edit2,
    CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"

const AVAILABLE_PERMISSIONS = [
    { id: 'all', label: 'Полный доступ', description: 'Разрешить всё без ограничений' },
    { id: 'consoles', label: 'Консоли', description: 'Управление оборудованием' },
    { id: 'rentals', label: 'Аренда', description: 'Одобрение заявок и запуск сессий' },
    { id: 'finance', label: 'Финансы', description: 'Просмотр отчетов и доходов' },
    { id: 'users', label: 'Клиенты', description: 'База данных пользователей' },
    { id: 'settings', label: 'Настройки', description: 'Системные настройки и бот' },
]

export default function AdminsPage() {
    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setModalOpen] = useState(false)
    const [editingAdmin, setEditingAdmin] = useState(null)
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        role: 'staff',
        permissions: []
    })
    const [report, setReport] = useState([])
    const [currentAdmin, setCurrentAdmin] = useState(null)

    useEffect(() => {
        fetchAdmins()
    }, [])

    const fetchAdmins = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admins')
            const data = await res.json()
            setAdmins(data)

            // Fetch current user from local storage
            const stored = localStorage.getItem('admin_user')
            if (stored) {
                const user = JSON.parse(stored)
                setCurrentAdmin(user)
                if (user.role === 'owner') {
                    fetchReport()
                }
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchReport = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admins/reports/daily')
            const data = await res.json()
            setReport(data)
        } catch (err) {
            console.error(err)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        const method = editingAdmin ? 'PUT' : 'POST'
        const payload = editingAdmin ? { ...formData, id: editingAdmin.id } : formData

        try {
            const res = await fetch('http://localhost:5000/api/admins', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (res.ok) {
                setModalOpen(false)
                fetchAdmins()
            } else {
                const data = await res.json()
                alert(data.error || 'Ошибка сохранения')
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Вы уверены?')) return
        try {
            const res = await fetch(`http://localhost:5000/api/admins?id=${id}`, { method: 'DELETE' })
            if (res.ok) fetchAdmins()
            else {
                const data = await res.json()
                alert(data.error)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const togglePermission = (permId) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permId)
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId]
        }))
    }

    if (loading) return null

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
                        <Shield className="text-blue-500" />
                        Команда администраторов
                    </h2>
                    <p className="text-gray-400 text-sm">Управление доступом и ролями сотрудников</p>
                </div>

                <button
                    onClick={() => {
                        setEditingAdmin(null)
                        setFormData({ username: '', password: '', full_name: '', role: 'staff', permissions: [] })
                        setModalOpen(true)
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all font-medium"
                >
                    <Plus size={20} />
                    Добавить аккаунт
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {admins.map((admin) => (
                        <motion.div
                            key={admin.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass p-6 rounded-3xl border border-white/5 relative group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 flex items-center justify-center font-bold text-blue-400 border border-white/5 overflow-hidden">
                                        {admin.avatar_url ? (
                                            <img src={`http://localhost:5000${admin.avatar_url}`} className="w-full h-full object-cover" alt="Avatar" />
                                        ) : (
                                            admin.full_name?.[0]
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-200">{admin.full_name}</h3>
                                        <p className="text-xs text-gray-500">@{admin.username}</p>
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider border",
                                    admin.role === 'owner' ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                )}>
                                    {admin.role}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="bg-white/5 p-2 rounded-xl text-center">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Заявки</p>
                                    <p className="text-sm font-bold text-blue-400">{admin.stats?.total_processed_requests || 0}</p>
                                </div>
                                <div className="bg-white/5 p-2 rounded-xl text-center">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">KYC</p>
                                    <p className="text-sm font-bold text-indigo-400">{admin.stats?.total_processed_kyc || 0}</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex flex-wrap gap-1.5">
                                    {admin.permissions.includes('all') ? (
                                        <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-md border border-green-500/10">Все права</span>
                                    ) : (
                                        admin.permissions.map(p => (
                                            <span key={p} className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-md border border-white/5 uppercase">
                                                {p}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => {
                                        setEditingAdmin(admin)
                                        setFormData({
                                            username: admin.username,
                                            password: '',
                                            full_name: admin.full_name,
                                            role: admin.role,
                                            permissions: admin.permissions
                                        })
                                        setModalOpen(true)
                                    }}
                                    className="flex-grow glass py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit2 size={14} /> Изменить
                                </button>
                                <button
                                    onClick={() => handleDelete(admin.id)}
                                    className="p-2 glass rounded-xl text-gray-500 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Admin Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-xl glass p-8 rounded-[32px] border border-white/10"
                        >
                            <h2 className="text-2xl font-bold mb-6">{editingAdmin ? 'Редактировать сотрудника' : 'Новый аккаунт'}</h2>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block px-1">Полное имя</label>
                                        <input
                                            required
                                            value={formData.full_name}
                                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full glass-dark bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                            placeholder="Иван Иванов"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block px-1">Роль</label>
                                        <select
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full glass-dark bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                        >
                                            <option value="staff" className="bg-[#0a0a1a]">Оператор</option>
                                            <option value="manager" className="bg-[#0a0a1a]">Менеджер</option>
                                            <option value="owner" className="bg-[#0a0a1a]">Владелец</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block px-1">Username</label>
                                        <input
                                            required
                                            disabled={!!editingAdmin}
                                            value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                                            className="w-full glass-dark bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all disabled:opacity-50"
                                            placeholder="admin_new"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block px-1">
                                            {editingAdmin ? 'Новый пароль (опционально)' : 'Пароль'}
                                        </label>
                                        <input
                                            type="password"
                                            required={!editingAdmin}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full glass-dark bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                            placeholder="••••••"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-3 block px-1">Разрешения (Доступ)</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {AVAILABLE_PERMISSIONS.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => togglePermission(p.id)}
                                                className={cn(
                                                    "flex items-start gap-3 p-3 rounded-2xl border transition-all text-left",
                                                    formData.permissions.includes(p.id)
                                                        ? "bg-blue-600/20 border-blue-500 text-blue-400"
                                                        : "bg-white/5 border-white/5 text-gray-500 hover:border-white/10"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                                                    formData.permissions.includes(p.id) ? "bg-blue-500 border-blue-400" : "border-gray-700"
                                                )}>
                                                    {formData.permissions.includes(p.id) && <CheckCircle2 size={14} className="text-white" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold">{p.label}</p>
                                                    <p className="text-[9px] opacity-60 mt-0.5 line-clamp-1">{p.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="flex-grow glass py-3 rounded-2xl font-bold text-gray-400 hover:text-white"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-grow bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20"
                                    >
                                        {editingAdmin ? 'Обновить' : 'Создать аккаунт'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Performance Report for Owner */}
            {currentAdmin?.role === 'owner' && report.length > 0 && (
                <div className="mt-12 space-y-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="text-blue-500" />
                        <h2 className="text-2xl font-bold text-white tracking-tight">Отчет по активности за сегодня</h2>
                    </div>

                    <div className="glass p-8 rounded-[32px] border border-white/5">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                                    <th className="px-6 py-4">Сотрудник</th>
                                    <th className="px-6 py-4">Активность сегодня</th>
                                    <th className="px-6 py-4">Всего аренд</th>
                                    <th className="px-6 py-4">Всего KYC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {report.map(row => (
                                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold overflow-hidden border border-white/5">
                                                    {row.avatar_url ? (
                                                        <img src={`http://localhost:5000${row.avatar_url}`} className="w-full h-full object-cover" />
                                                    ) : (
                                                        row.full_name[0]
                                                    )}
                                                </div>
                                                <span className="font-medium">{row.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded-md text-xs font-bold",
                                                row.today_actions > 0 ? "bg-blue-500/10 text-blue-400" : "bg-gray-800 text-gray-500"
                                            )}>
                                                {row.today_actions} действий
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">{row.total_requests}</td>
                                        <td className="px-6 py-4 text-sm text-gray-400">{row.total_kyc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

function TrendingUp(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    )
}
