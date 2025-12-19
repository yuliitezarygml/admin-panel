"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
    User,
    Camera,
    Save,
    Key,
    FileText,
    TrendingUp,
    CheckCircle2,
    Calendar,
    Briefcase,
    Shield
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
    const [admin, setAdmin] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)
    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        password: ''
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            // Get current admin ID from localStorage if available, or simulate for demo
            const currentId = localStorage.getItem('admin_id') || '31a58d38-ec27-4946-9fd0-371b6fa98ae3'
            const res = await fetch(`http://localhost:5000/api/admins/current?id=${currentId}`)
            const data = await res.json()
            setAdmin(data)
            setFormData({
                full_name: data.full_name || '',
                bio: data.bio || '',
                password: ''
            })
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('http://localhost:5000/api/admins/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, id: admin.id })
            })
            if (res.ok) {
                alert('Профиль успешно обновлен!')
                fetchProfile()
            }
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setUploading(true)
        const uploadData = new FormData()
        uploadData.append('avatar', file)
        uploadData.append('id', admin.id)

        try {
            const res = await fetch('http://localhost:5000/api/admins/avatar', {
                method: 'POST',
                body: uploadData
            })
            if (res.ok) {
                fetchProfile()
            }
        } catch (err) {
            console.error(err)
        } finally {
            setUploading(false)
        }
    }

    if (loading) return null

    const today = new Date().toISOString().split('T')[0]
    const todayActions = admin.stats?.daily_actions?.[today] || 0

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header / Hero Section */}
            <div className="relative h-48 rounded-[32px] bg-gradient-to-r from-blue-600 to-indigo-700 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute -bottom-16 left-8 flex items-end gap-6">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-3xl bg-[#0a0a1a] border-4 border-[#0a0a1a] shadow-2xl overflow-hidden">
                            {admin.avatar_url ? (
                                <img src={`http://localhost:5000${admin.avatar_url}`} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-blue-500 bg-blue-500/10">
                                    {admin.full_name?.[0]}
                                </div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-2 right-2 p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-all shadow-lg active:scale-95"
                        >
                            <Camera size={16} />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </div>
                    <div className="pb-4">
                        <h1 className="text-3xl font-bold text-white tracking-tight">{admin.full_name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-md text-[10px] uppercase font-bold text-white/80 border border-white/10 tracking-wider">
                                {admin.role}
                            </span>
                            <span className="text-white/60 text-xs flex items-center gap-1">
                                <Shield size={12} /> @{admin.username}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
                {/* Left Column: Stats & Info */}
                <div className="space-y-6">
                    <div className="glass p-6 rounded-[24px] border border-white/5 space-y-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={16} className="text-blue-500" />
                            Ваша активность
                        </h3>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-xs text-gray-500 font-medium">Заявок сегодня</p>
                                <p className="text-2xl font-bold text-white mt-1">{todayActions}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-xs text-gray-500 font-medium">Всего аренд одобрено</p>
                                <p className="text-2xl font-bold text-blue-400 mt-1">{admin.stats?.total_processed_requests || 0}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-xs text-gray-500 font-medium">Верификаций пройдено</p>
                                <p className="text-2xl font-bold text-indigo-400 mt-1">{admin.stats?.total_processed_kyc || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-[24px] border border-white/5">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                            <Briefcase size={16} className="text-blue-500" />
                            О себе
                        </h3>
                        <p className="text-gray-300 text-sm italic leading-relaxed">
                            {admin.bio || "Напишите что-нибудь о себе в настройках профиля..."}
                        </p>
                    </div>
                </div>

                {/* Right Column: Settings Form */}
                <div className="lg:col-span-2">
                    <div className="glass p-8 rounded-[32px] border border-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <User className="text-blue-500" />
                                Настройки аккаунта
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar size={14} />
                                Зарегистрирован: {new Date(admin.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Полное имя</label>
                                        <div className="relative">
                                            <input
                                                value={formData.full_name}
                                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                                className="w-full bg-[#0a0a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                                placeholder="Имя Фамилия"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Новый пароль</label>
                                        <div className="relative">
                                            <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full bg-[#0a0a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Краткая биография</label>
                                    <div className="relative">
                                        <FileText className="absolute right-4 top-4 text-gray-600" size={18} />
                                        <textarea
                                            rows={4}
                                            value={formData.bio}
                                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                            className="w-full bg-[#0a0a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none"
                                            placeholder="Ваш профессиональный опыт или девиз..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between border-t border-white/5">
                                <p className="text-[11px] text-gray-500 max-w-xs">
                                    Ваши изменения будут сохранены немедленно и вступят в силу после обновления страницы.
                                </p>
                                <button
                                    disabled={saving}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
                                    Сохранить профиль
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
