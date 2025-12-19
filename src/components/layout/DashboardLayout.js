"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    LayoutDashboard,
    Gamepad2,
    Users,
    History,
    Settings,
    Bell,
    LogOut,
    Menu,
    X,
    Lock,
    TrendingUp,
    Clock,
    Wallet,
    FileCheck,
    CalendarDays,
    User,
    UserPlus,
    ShieldCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const navItems = [
    { icon: LayoutDashboard, label: "Дашборд", id: "dashboard", href: "/" },
    { icon: Gamepad2, label: "Консоли", id: "consoles", href: "/consoles" },
    { icon: Bell, label: "Заявки", id: "requests", href: "/requests", badge: true },
    { icon: FileCheck, label: "Верификация", id: "kyc", href: "/kyc", badge: true },
    { icon: CalendarDays, label: "Бронирование", id: "calendar", href: "/calendar" },
    { icon: UserPlus, label: "Пользователи", id: "users", href: "/users" },
    { icon: History, label: "История", id: "history", href: "/history" },
    { icon: Wallet, label: "Финансы", id: "finance", href: "/finance" },
    { icon: ShieldCheck, label: "Сотрудники", id: "admins", href: "/admins" },
    { icon: User, label: "Мой профиль", id: "profile", href: "/profile" },
    { icon: Settings, label: "Настройки", id: "settings", href: "/settings" },
]

export default function DashboardLayout({ children }) {
    const pathname = usePathname()
    const router = useRouter()
    const [isSidebarOpen, setSidebarOpen] = useState(true)
    const [pendingCounts, setPendingCounts] = useState({ requests: 0, kyc: 0 })
    const [currentAdmin, setCurrentAdmin] = useState(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const prevTotalRef = useRef(0)
    const audioRef = useRef(null)

    const isLoginPage = pathname === '/login'

    useEffect(() => {
        const storedUser = localStorage.getItem('admin_user')
        if (storedUser) {
            const user = JSON.parse(storedUser)
            setCurrentAdmin(user)
            setIsLoggedIn(true)
        } else if (!isLoginPage) {
            router.push('/login')
        }

        // Fetch latest profile data to get avatar/etc
        if (storedUser) {
            const user = JSON.parse(storedUser)
            fetch(`http://localhost:5000/api/admins/current?id=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.error) {
                        setCurrentAdmin(data)
                        localStorage.setItem('admin_user', JSON.stringify(data))
                        localStorage.setItem('admin_id', data.id)
                    }
                })
                .catch(err => console.error(err))
        }

        audioRef.current = new Audio("/sound/z_uk-budte-vkontakte-s-no_ostyami.mp3")

        if (!isLoginPage) {
            const fetchCounts = async () => {
                try {
                    // Fetch Rental Requests
                    const resReq = await fetch('http://localhost:5000/api/requests')
                    const dataReq = await resReq.json()
                    const countReq = dataReq.filter(r => r.status === 'pending').length

                    // Fetch KYC Requests
                    const resKyc = await fetch('http://localhost:5000/api/kyc')
                    const dataKyc = await resKyc.json()
                    const countKyc = dataKyc.filter(r => r.status === 'pending').length

                    const total = countReq + countKyc
                    if (total > prevTotalRef.current) {
                        audioRef.current.play().catch(e => console.log("Audio play blocked"))
                    }

                    setPendingCounts({ requests: countReq, kyc: countKyc })
                    prevTotalRef.current = total
                } catch (err) {
                    console.error("Failed to fetch counts:", err)
                }
            }

            fetchCounts()
            const interval = setInterval(fetchCounts, 30000)
            return () => clearInterval(interval)
        }
    }, [pathname])

    const handleLogout = () => {
        localStorage.removeItem('admin_user')
        router.push('/login')
    }

    const activeItem = navItems.find(item => item.href === pathname) || navItems[0]

    return (
        <div className="min-h-screen bg-[#020205] text-white selection:bg-blue-500/30">
            {/* Background Glow */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="flex">
                {/* Sidebar - Hide on Login Page */}
                {!isLoginPage && (
                    <aside className={cn(
                        "fixed top-0 left-0 h-screen transition-all duration-300 z-50",
                        "glass-dark border-r border-white/5",
                        isSidebarOpen ? "w-64" : "w-20"
                    )}>
                        <div className="flex flex-col h-full p-4">
                            <div className="flex items-center gap-3 mb-10 px-2">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Gamepad2 size={24} />
                                </div>
                                {isSidebarOpen && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="font-bold text-xl tracking-tight"
                                    >
                                        PS Rental
                                    </motion.span>
                                )}
                            </div>

                            <nav className="flex-grow space-y-2">
                                {navItems.filter(item => {
                                    if (!currentAdmin) return true;
                                    if (currentAdmin.permissions.includes('all')) return true;
                                    if (item.id === 'dashboard') return true; // Always allow dashboard
                                    return currentAdmin.permissions.includes(item.id);
                                }).map((item) => (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group",
                                            pathname === item.href
                                                ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <div className="relative">
                                            <item.icon size={22} className={cn(
                                                "transition-transform duration-200 group-hover:scale-110",
                                                pathname === item.href ? "text-blue-400" : ""
                                            )} />
                                            {item.badge && pendingCounts[item.id] > 0 && !isSidebarOpen && (
                                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#020205] animate-pulse" />
                                            )}
                                        </div>

                                        {isSidebarOpen && (
                                            <span className="font-medium flex-grow">{item.label}</span>
                                        )}

                                        {isSidebarOpen && item.badge && pendingCounts[item.id] > 0 && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg shadow-blue-500/20"
                                            >
                                                {pendingCounts[item.id]}
                                            </motion.span>
                                        )}

                                        {pathname === item.href && !item.badge && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"
                                            />
                                        )}
                                    </Link>
                                ))}
                            </nav>

                            <div className="mt-auto pt-4 border-t border-white/5">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <LogOut size={22} />
                                    {isSidebarOpen && <span className="font-medium">Выйти</span>}
                                </button>
                            </div>
                        </div>
                    </aside>
                )}

                {/* Main Content */}
                <main className={cn(
                    "flex-grow transition-all duration-300 min-h-screen",
                    !isLoginPage && (isSidebarOpen ? "ml-64" : "ml-20")
                )}>
                    {/* Top Bar - Hide on Login Page */}
                    {!isLoginPage && (
                        <header className="h-20 glass-dark border-b border-white/5 sticky top-0 z-40 px-8 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                                    title={isSidebarOpen ? "Свернуть" : "Развернуть"}
                                >
                                    {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                                </button>
                                <h1 className="text-lg font-semibold capitalize text-gray-200">
                                    {activeItem?.label}
                                    {activeItem?.badge && pendingCounts[activeItem.id] > 0 && (
                                        <span className="ml-3 text-sm font-normal text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 capitalize-none">
                                            {pendingCounts[activeItem.id]} новых
                                        </span>
                                    )}
                                </h1>
                            </div>

                            <Link href="/profile" className="flex items-center gap-6 group">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-medium text-gray-200 group-hover:text-blue-400 transition-colors">
                                        {currentAdmin?.full_name || 'Загрузка...'}
                                    </span>
                                    <span className="text-xs text-green-500 flex items-center gap-1.5 uppercase tracking-wider font-bold opacity-80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        {currentAdmin?.role || 'Online'}
                                    </span>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-white/10 flex items-center justify-center font-bold text-blue-400 overflow-hidden shadow-lg group-hover:border-blue-500/50 transition-all active:scale-95">
                                    {currentAdmin?.avatar_url ? (
                                        <img src={`http://localhost:5000${currentAdmin.avatar_url}`} className="w-full h-full object-cover" alt="Avatar" />
                                    ) : (
                                        currentAdmin?.full_name?.[0] || 'A'
                                    )}
                                </div>
                            </Link>
                        </header>
                    )}

                    <div className={cn("p-8", isLoginPage && "p-0")}>
                        {(!currentAdmin ||
                            currentAdmin.permissions.includes('all') ||
                            activeItem?.id === 'dashboard' ||
                            currentAdmin.permissions.includes(activeItem?.id))
                            ? children
                            : (
                                <div className="flex flex-col items-center justify-center min-h-[400px] text-center py-20">
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6 border border-red-500/20"
                                    >
                                        <Lock size={40} />
                                    </motion.div>
                                    <h2 className="text-2xl font-bold mb-3 text-white">Доступ ограничен</h2>
                                    <p className="text-gray-400 max-w-sm px-6">
                                        У вашего аккаунта ({currentAdmin?.full_name}) недостаточно прав для доступа к разделу <span className="text-gray-200 font-bold">"{activeItem?.label}"</span>.
                                        Пожалуйста, обратитесь к владельцу системы.
                                    </p>
                                    <Link
                                        href="/"
                                        className="mt-8 px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-all border border-white/5"
                                    >
                                        Вернуться на главную
                                    </Link>
                                </div>
                            )}
                    </div>
                </main>
            </div>
        </div>
    )
}
