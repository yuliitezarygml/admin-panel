"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ShieldCheck,
    Clock,
    XCircle,
    CheckCircle2,
    Search,
    Eye,
    ChevronRight,
    MessageSquare,
    AlertCircle,
    User
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function KYCPage() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedRequest, setSelectedRequest] = useState(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [note, setNote] = useState('')

    const fetchRequests = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/kyc')
            const data = await res.json()
            setRequests(data)
        } catch (err) {
            console.error("Failed to fetch KYC requests:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleSelectRequest = (req) => {
        setSelectedRequest(req)
        setNote(req.admin_note || '')
    }

    const handleAction = async (requestId, action) => {
        setActionLoading(true)
        try {
            const adminId = localStorage.getItem('admin_id')
            const res = await fetch('http://localhost:5000/api/kyc/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: requestId,
                    action,
                    note,
                    admin_id: adminId
                })
            })
            if (res.ok) {
                fetchRequests()
                setSelectedRequest(null)
                setNote('')
            }
        } catch (err) {
            console.error("Action failed:", err)
        } finally {
            setActionLoading(false)
        }
    }

    const filteredRequests = requests.filter(req =>
        req.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.username.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const pendingCount = requests.filter(r => r.status === 'pending').length

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Верификация (KYC)</h1>
                    <p className="text-gray-500 font-medium">Управление проверкой документов пользователей</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-2xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-blue-400 font-bold text-sm">{pendingCount} ожидают проверки</span>
                    </div>
                </div>
            </div>

            {/* Main Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-dark border border-white/5 p-6 rounded-[32px]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Очередь</p>
                            <h3 className="text-2xl font-black text-white">{pendingCount}</h3>
                        </div>
                    </div>
                </div>
                <div className="glass-dark border border-white/5 p-6 rounded-[32px]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Одобрено</p>
                            <h3 className="text-2xl font-black text-white">
                                {requests.filter(r => r.status === 'approved').length}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="glass-dark border border-white/5 p-6 rounded-[32px]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                            <XCircle size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Отклонено</p>
                            <h3 className="text-2xl font-black text-white">
                                {requests.filter(r => r.status === 'rejected').length}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* List and Details View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* List View */}
                <div className={cn(
                    "glass-dark border border-white/5 rounded-[40px] overflow-hidden",
                    selectedRequest ? "lg:col-span-4" : "lg:col-span-12"
                )}>
                    <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4">
                        <div className="relative flex-grow max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder="Поиск по имени или username..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                                    <th className="px-8 py-4">Клиент</th>
                                    {!selectedRequest && <th className="px-8 py-4">Дата запроса</th>}
                                    <th className="px-8 py-4">Статус</th>
                                    <th className="px-8 py-4 text-right">Действие</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <AnimatePresence mode="popLayout">
                                    {filteredRequests.map((req) => (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={req.id}
                                            onClick={() => handleSelectRequest(req)}
                                            className={cn(
                                                "hover:bg-white/[0.02] transition-colors cursor-pointer group",
                                                selectedRequest?.id === req.id ? "bg-blue-600/5" : ""
                                            )}
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/10">
                                                        {req.user_name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold">{req.user_name}</p>
                                                        <p className="text-gray-500 text-xs">@{req.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {!selectedRequest && (
                                                <td className="px-8 py-6">
                                                    <p className="text-gray-300 text-sm font-medium">
                                                        {new Date(req.timestamp).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-gray-500 text-xs">
                                                        {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </td>
                                            )}
                                            <td className="px-8 py-6">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border",
                                                    req.status === 'pending' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                        req.status === 'approved' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                            "bg-red-500/10 text-red-500 border-red-500/20"
                                                )}>
                                                    {req.status === 'pending' ? 'Ожидает' :
                                                        req.status === 'approved' ? 'Принято' : 'Отклонено'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronRight className="text-gray-600" size={20} />
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail View */}
                {selectedRequest && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-8 space-y-6"
                    >
                        <div className="glass-dark border border-white/5 rounded-[40px] p-8 relative overflow-hidden">
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[24px] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                                        <User size={32} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white">{selectedRequest.user_name}</h2>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-gray-500 font-medium">@{selectedRequest.username}</span>
                                            <div className="w-1 h-1 rounded-full bg-gray-700" />
                                            <span className="text-gray-500 text-sm">ID: {selectedRequest.user_id}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="p-3 rounded-2xl hover:bg-white/5 transition-colors text-gray-400"
                                >
                                    Закрыть
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Document Photo */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Документ</h3>
                                        <a
                                            href={`http://localhost:5000${selectedRequest.photo_url}`}
                                            target="_blank"
                                            className="text-blue-500 text-xs font-bold hover:underline flex items-center gap-1"
                                        >
                                            <Eye size={14} /> Открыть оригинал
                                        </a>
                                    </div>
                                    <div className="aspect-[4/3] rounded-[32px] overflow-hidden border border-white/10 relative group">
                                        <img
                                            src={`http://localhost:5000${selectedRequest.photo_url}`}
                                            alt="KYC Document"
                                            className="w-full h-full object-contain bg-black/40"
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <MessageSquare size={14} /> Примечание (для пользователя)
                                        </h3>
                                        <textarea
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            placeholder="Напишите причину отказа или дополнительную информацию..."
                                            className="w-full h-32 bg-white/[0.03] border border-white/5 rounded-3xl p-6 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                                        />
                                    </div>

                                    {selectedRequest.status === 'pending' ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                disabled={actionLoading}
                                                onClick={() => handleAction(selectedRequest.id, 'reject')}
                                                className="py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all text-sm"
                                            >
                                                {actionLoading ? '...' : 'Отклонить'}
                                            </button>
                                            <button
                                                disabled={actionLoading}
                                                onClick={() => handleAction(selectedRequest.id, 'approve')}
                                                className="py-4 rounded-2xl bg-green-500 text-white font-bold shadow-lg shadow-green-500/20 hover:bg-green-400 active:scale-95 transition-all text-sm"
                                            >
                                                {actionLoading ? '...' : 'Одобрить'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            "p-6 rounded-3xl border flex items-center gap-4",
                                            selectedRequest.status === 'approved' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                                                "bg-red-500/10 border-red-500/20 text-red-500"
                                        )}>
                                            {selectedRequest.status === 'approved' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                            <div>
                                                <p className="font-bold">Статус: {selectedRequest.status === 'approved' ? 'Одобрено' : 'Отклонено'}</p>
                                                {selectedRequest.admin_note && (
                                                    <p className="text-xs opacity-70 mt-1">Причина: {selectedRequest.admin_note}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {loading && (
                <div className="fixed inset-0 bg-[#020205]/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    )
}
