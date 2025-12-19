"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Gamepad2, User, Lock, ArrowRight, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({ username: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Redirect if already logged in
    useEffect(() => {
        if (localStorage.getItem('admin_user')) {
            router.push('/')
        }
    }, [])

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('http://localhost:5000/api/admins/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (res.ok) {
                localStorage.setItem('admin_user', JSON.stringify(data))
                router.push('/')
            } else {
                setError(data.error || 'Ошибка входа')
            }
        } catch (err) {
            setError('Сервер не отвечает')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#020205] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 rounded-[30%] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.3)] mb-6">
                        <Gamepad2 size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-widest uppercase mb-2">PS Rental</h1>
                    <div className="h-1 w-12 bg-blue-500 rounded-full" />
                    <p className="mt-4 text-gray-500 text-sm font-medium uppercase tracking-[0.2em]">Management System</p>
                </div>

                {/* Login Form */}
                <div className="glass-dark border border-white/10 p-10 rounded-[40px] shadow-2xl backdrop-blur-3xl">
                    <h2 className="text-2xl font-bold text-white mb-2">Авторизация</h2>
                    <p className="text-gray-500 text-sm mb-8">Введите данные для доступа в панель</p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase px-1 tracking-widest">Логин</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    required
                                    type="text"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-gray-700"
                                    placeholder="Ваш логин"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase px-1 tracking-widest">Пароль</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    required
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-gray-700"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs flex items-center gap-3"
                            >
                                <ShieldCheck size={16} />
                                {error}
                            </motion.div>
                        )}

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:active:scale-100"
                        >
                            {loading ? 'Вход...' : (
                                <>
                                    Войти в систему
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-gray-600 text-[10px] uppercase tracking-widest font-bold">
                    Tekwill PlayStation Rental Center © 2025
                </p>
            </motion.div>
        </div>
    )
}
