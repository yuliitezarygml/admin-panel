"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Gamepad2,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Trash2,
    Edit2,
    CheckCircle2,
    XCircle,
    Clock,
    Dna
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function ConsolesPage() {
    const [consoles, setConsoles] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setModalOpen] = useState(false)
    const [editingConsole, setEditingConsole] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        model: 'PS5',
        rental_price: 40,
        sale_price: 0,
        show_photo_in_bot: true,
        games: ''
    })

    const [selectedFile, setSelectedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setSelectedFile(null);
            setPreviewUrl(null);
        }
    }

    useEffect(() => {
        fetchConsoles()
    }, [])

    const fetchConsoles = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/consoles');
            const data = await res.json();
            setConsoles(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch consoles:", err);
            setLoading(false);
        }
    }

    const handleSave = async (e) => {
        e.preventDefault();
        const method = editingConsole ? 'PUT' : 'POST';
        const payload = editingConsole ? { ...formData, id: editingConsole.id } : formData;

        try {
            const res = await fetch('http://localhost:5000/api/consoles', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const savedConsole = await res.json();

                // If there's a file, upload it
                if (selectedFile) {
                    const uploadData = new FormData();
                    uploadData.append('file', selectedFile);
                    uploadData.append('id', savedConsole.id || editingConsole.id);

                    await fetch('http://localhost:5000/api/consoles/upload', {
                        method: 'POST',
                        body: uploadData
                    });
                }

                setModalOpen(false);
                setEditingConsole(null);
                setSelectedFile(null);
                setPreviewUrl(null);
                setFormData({ name: '', model: 'PS5', rental_price: 40, sale_price: 0, show_photo_in_bot: true, games: '' });
                fetchConsoles();
            }
        } catch (err) {
            console.error("Failed to save console:", err);
        }
    }

    const handleDelete = async (id) => {
        if (!confirm("Удалить эту консоль?")) return;
        try {
            await fetch(`http://localhost:5000/api/consoles?id=${id}`, { method: 'DELETE' });
            fetchConsoles();
        } catch (err) {
            console.error("Failed to delete console:", err);
        }
    }

    return (
        <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Управление консолями</h2>
                    <p className="text-gray-400 text-sm">Мониторинг статуса и редактирование оборудования</p>
                </div>
                <button
                    onClick={() => {
                        setEditingConsole(null);
                        setFormData({ name: '', model: 'PS5', rental_price: 40, sale_price: 0, show_photo_in_bot: true, games: '' });
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all active:scale-95 font-medium shadow-lg shadow-blue-600/20"
                >
                    <Plus size={20} />
                    Добавить консоль
                </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Поиск по названию или играм..."
                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="glass px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                        <Filter size={16} />
                        Фильтры
                    </button>
                    <div className="h-full w-[1px] bg-white/5 mx-1" />
                    <button className="glass px-4 py-2.5 rounded-xl text-sm font-medium text-blue-400 hover:bg-blue-500/10 transition-colors">
                        Все модели
                    </button>
                </div>
            </div>

            {/* Grid of Consoles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="glass h-64 rounded-3xl animate-pulse bg-white/[0.02]" />
                        ))
                    ) : consoles.map((console, idx) => (
                        <motion.div
                            key={console.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass p-6 rounded-3xl group relative hover:border-blue-500/30 transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                    console.status === 'available' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                )}>
                                    {console.status === 'available' ? 'Свободна' : 'В аренде'}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setEditingConsole(console);
                                            setFormData({
                                                name: console.name,
                                                model: console.model,
                                                rental_price: console.rental_price,
                                                sale_price: console.sale_price || 0,
                                                show_photo_in_bot: console.show_photo_in_bot !== false,
                                                games: Array.isArray(console.games) ? console.games.join(', ') : (console.games || '')
                                            });
                                            setModalOpen(true);
                                        }}
                                        className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(console.id)}
                                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors uppercase">{console.name}</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-blue-400 font-mono flex items-center gap-1 bg-blue-500/5 px-2 py-0.5 rounded-md border border-blue-500/10">
                                        <Dna size={10} />
                                        {console.model}
                                    </span>
                                    <span className="text-[10px] text-green-400 font-bold bg-green-500/5 px-2 py-0.5 rounded-md border border-green-500/10 flex items-center gap-1">
                                        Доход: {console.total_earnings || 0} MDL
                                    </span>
                                </div>
                            </div>

                            {console.status === 'rented' && console.active_rental && (
                                <div className="mb-6 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 space-y-2">
                                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-orange-400">
                                        <span>Активная сессия</span>
                                        <Clock size={12} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-200">{console.active_rental.user_name}</p>
                                    <div className="text-[10px] text-gray-500 flex flex-col gap-0.5">
                                        <span>С {new Date(console.active_rental.start_time).toLocaleTimeString('ru-RU')}</span>
                                        <span>До {new Date(console.active_rental.expected_end_time).toLocaleTimeString('ru-RU')}</span>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!confirm(`Завершить аренду для ${console.name}?`)) return;
                                            try {
                                                const res = await fetch('http://localhost:5000/api/rentals/terminate', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ console_id: console.id })
                                                });
                                                if (res.ok) fetchConsoles();
                                            } catch (err) { console.error(err); }
                                        }}
                                        className="w-full mt-2 py-2 bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white rounded-xl text-[10px] font-bold uppercase transition-all"
                                    >
                                        Остановить аренду
                                    </button>
                                </div>
                            )}

                            <div className="space-y-2 mb-6">
                                <div className="flex flex-wrap gap-1.5">
                                    {(console.games || []).slice(0, 3).map(game => (
                                        <span key={game} className="text-[10px] bg-white/[0.05] text-gray-400 px-2 py-0.5 rounded-md border border-white/5">
                                            {game}
                                        </span>
                                    ))}
                                    {(console.games || []).length > 3 && (
                                        <span className="text-[10px] text-gray-500">+{console.games.length - 3} еще</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">Тариф</span>
                                    <span className="text-lg font-bold text-white block leading-none">
                                        {console.rental_price} <span className="text-xs font-normal text-gray-400">MDL/ч</span>
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setModalOpen(false)}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="glass-dark w-full max-w-md p-8 rounded-3xl border border-white/10 relative z-10"
                    >
                        <h2 className="text-2xl font-bold mb-6">{editingConsole ? 'Редактировать' : 'Добавить'} консоль</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Название</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                    placeholder="Напр. PS5 Lounge #01"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Модель</label>
                                    <select
                                        value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none text-white cursor-pointer"
                                    >
                                        <option value="PS5" className="bg-[#1a1a1a]">PlayStation 5</option>
                                        <option value="PS5 Pro" className="bg-[#1a1a1a]">PS5 Pro</option>
                                        <option value="PS4 Pro" className="bg-[#1a1a1a]">PS4 Pro</option>
                                        <option value="PS4 Slim" className="bg-[#1a1a1a]">PS4 Slim</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Цена (MDL/ч)</label>
                                    <input
                                        type="number"
                                        value={formData.rental_price}
                                        onChange={e => setFormData({ ...formData, rental_price: e.target.value })}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-center"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Продажа (MDL)</label>
                                    <input
                                        type="number"
                                        value={formData.sale_price}
                                        onChange={e => setFormData({ ...formData, sale_price: e.target.value })}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-center"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 glass rounded-xl border border-white/5">
                                <span className="text-sm text-gray-300">Показывать фото в боте</span>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, show_photo_in_bot: !formData.show_photo_in_bot })}
                                    className={cn(
                                        "w-10 h-5 rounded-full transition-colors relative",
                                        formData.show_photo_in_bot ? "bg-blue-600" : "bg-gray-700"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                                        formData.show_photo_in_bot ? "left-6" : "left-1"
                                    )} />
                                </button>
                            </div>

                            {/* Photo Upload Section */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase block">Фото консоли</label>
                                <div className="flex gap-4 items-center">
                                    <div className="w-20 h-20 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center overflow-hidden relative group">
                                        {previewUrl || (editingConsole?.photo_path ? `http://localhost:5000${editingConsole.photo_path}` : null) ? (
                                            <img
                                                src={previewUrl || `http://localhost:5000${editingConsole.photo_path}`}
                                                className="w-full h-full object-cover"
                                                alt="Preview"
                                            />
                                        ) : (
                                            <Gamepad2 className="text-gray-600" size={30} />
                                        )}
                                    </div>
                                    <label className="flex-grow">
                                        <div className="glass py-3 px-4 rounded-xl text-center text-sm font-medium text-blue-400 hover:bg-blue-500/10 cursor-pointer transition-colors border border-dashed border-blue-500/30">
                                            Выбрать файл
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Игры (через запятую)</label>
                                <textarea
                                    value={formData.games}
                                    onChange={e => setFormData({ ...formData, games: e.target.value })}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all h-24"
                                    placeholder="FIFA 24, Spider-Man 2, UFC 5..."
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-grow glass py-3 rounded-xl font-bold text-gray-400 hover:text-white transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="flex-grow bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-transform active:scale-95"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
