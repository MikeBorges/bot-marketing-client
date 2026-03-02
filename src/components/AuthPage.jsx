import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, RefreshCw, LogIn, UserPlus } from 'lucide-react';

const AuthPage = ({ onLogin }) => {
    const [activeTab, setActiveTab] = useState('login'); // 'login', 'register', 'recovery'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Chamadas reais para o backend
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const endpoint = activeTab === 'login' ? '/auth/login' : activeTab === 'register' ? '/auth/register' : '/auth/recover';
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro na autenticação');
            }

            if (activeTab === 'login') {
                onLogin(data.user);
            } else if (activeTab === 'register') {
                setError('Conta criada com sucesso! Faça login.');
                setActiveTab('login');
            } else {
                setError('Instruções de recuperação enviadas para o seu e-mail.');
            }
        } catch (err) {
            setError(err.message || 'Ocorreu um erro. Tente novamente.');
        } finally {
            if (activeTab !== 'login') setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0F1117] relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/10 blur-[100px] rounded-full -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 mb-4 shadow-xl shadow-purple-600/20">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">BotManager</h1>
                    <p className="text-slate-400">Gerenciamento inteligente de automação</p>
                </div>

                <div className="glass-card p-8 border-white/10 shadow-2xl">
                    <div className="flex bg-white/5 p-1 rounded-xl mb-8">
                        <button
                            className="flex-1 py-2 px-4 rounded-lg text-sm font-bold bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                        >
                            Login
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {activeTab === 'register' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Nome Completo</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-all"
                                                placeholder="Seu nome"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">E-mail</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-all"
                                            placeholder="seu@email.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Senha</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-4 rounded-xl text-xs font-bold ${error.includes('enviadas') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    }`}
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <RefreshCw className="animate-spin" size={20} />
                            ) : (
                                <>
                                    {activeTab === 'login' ? <LogIn size={20} /> : activeTab === 'register' ? <UserPlus size={20} /> : <RefreshCw size={20} />}
                                    {activeTab === 'login' ? 'Entrar no Sistema' : activeTab === 'register' ? 'Registrar Agora' : 'Resetar Senha'}
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                        &copy; 2024 BotManager. Todos os direitos reservados.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthPage;
