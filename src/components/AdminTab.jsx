import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield, User, Crown, Star, Clock, Save, AlertCircle, MessageCircle, Eye, Trash2, CheckCircle } from 'lucide-react';

const AdminTab = ({ userEmail, userRole, addNotification, socket }) => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', plan: 'teste' });
    const [creating, setCreating] = useState(false);

    const [tickets, setTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [viewingTicket, setViewingTicket] = useState(null);

    const fetchUsers = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/admin/users?email=${userEmail}`);
            const data = await response.json();
            if (response.ok) {
                setUsers(data);
            } else {
                addNotification(data.error || t('admin.errorLoad'), 'error');
            }
        } catch (err) {
            addNotification(t('admin.errorConn'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchTickets = () => {
        if (!socket) return;
        socket.emit('get_support_tickets');
    };

    useEffect(() => {
        fetchUsers();
        fetchTickets();

        if (socket) {
            socket.on('support_tickets_list', (data) => {
                setTickets(data);
                setLoadingTickets(false);
            });
            socket.on('refresh_support_tickets', () => {
                socket.emit('get_support_tickets');
            });
            socket.on('new_support_ticket', () => {
                socket.emit('get_support_tickets');
            });
        }

        return () => {
            if (socket) {
                socket.off('support_tickets_list');
                socket.off('refresh_support_tickets');
                socket.off('new_support_ticket');
            }
        };
    }, [socket]);

    const handleUpdateUser = async (targetEmail, updates) => {
        // ... (existing logic or placeholder if you want to keep it simple)
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/admin/update-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requesterEmail: userEmail,
                    targetEmail,
                    ...updates
                })
            });

            const data = await response.json();
            if (response.ok) {
                addNotification(t('admin.successUpdate'), 'success');
                fetchUsers();
            } else {
                addNotification(data.error || t('admin.errorUpdate'), 'error');
            }
        } catch (err) {
            addNotification(t('admin.errorConnUpdate'), 'error');
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/admin/create-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requesterEmail: userEmail,
                    ...newUser
                })
            });

            const data = await response.json();
            if (response.ok) {
                addNotification(t('admin.successCreate'), 'success');
                setIsCreateModalOpen(false);
                setNewUser({ name: '', email: '', password: '', plan: 'teste' });
                fetchUsers();
            } else {
                addNotification(data.error || t('admin.errorCreate'), 'error');
            }
        } catch (err) {
            addNotification(t('admin.errorConnCreate'), 'error');
        } finally {
            setCreating(false);
        }
    };

    const handleMarkAsRead = (id) => {
        socket.emit('mark_ticket_read', id);
    };

    const handleDeleteTicket = (id) => {
        if (window.confirm('Excluir este ticket permanentemente?')) {
            socket.emit('delete_support_ticket', id);
        }
    };

    if (loading) return <div className="flex items-center justify-center py-20 text-slate-400">{t('admin.loading')}</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <header className="flex justify-between items-center">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>{t('admin.title')}</p>
                    <h2 className="text-2xl font-bold heading-lg text-white">{t('admin.subtitle')}</h2>
                    <p className="text-sm mt-1 text-slate-400">{t('admin.desc')}</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
                >
                    <User size={16} />
                    {t('admin.createBtn')}
                </button>
            </header>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Usuário</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Papel / Cargo</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Plano Atual</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-500 font-bold border border-purple-500/20">
                                                {u.name.substring(0, 1)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{u.name}</p>
                                                <p className="text-xs text-slate-500">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {u.role === 'super_admin' ? (
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20">
                                                    <Crown size={12} /> SUPER ADMIN
                                                </span>
                                            ) : u.role === 'admin' ? (
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-500 text-[10px] font-bold border border-purple-500/20">
                                                    <Shield size={12} /> ADMIN
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 text-[10px] font-bold border border-slate-500/10">
                                                    <User size={12} /> USUÁRIO
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={u.plan}
                                            disabled={u.role === 'super_admin'}
                                            onChange={(e) => handleUpdateUser(u.email, { newPlan: e.target.value })}
                                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                                        >
                                            <option value="pro" className="bg-[#1a1c24]">💎 PRO</option>
                                            <option value="basic" className="bg-[#1a1c24]">⭐ BASIC</option>
                                            <option value="teste" className="bg-[#1a1c24]">⌛ TESTE</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        {userRole === 'super_admin' && u.role !== 'super_admin' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdateUser(u.email, { newRole: u.role === 'admin' ? 'user' : 'admin' })}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${u.role === 'admin'
                                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                                                        : 'bg-purple-500/10 text-purple-500 border border-purple-500/20 hover:bg-purple-500/20'
                                                        }`}
                                                >
                                                    {u.role === 'admin' ? 'REMOVER ADMIN' : 'TORNAR ADMIN'}
                                                </button>
                                            </div>
                                        )}
                                        {u.role === 'super_admin' && (
                                            <span className="text-[10px] font-bold text-slate-600 italic">Inalterável</span>
                                        )}
                                        {userRole === 'admin' && u.role !== 'admin' && u.role !== 'super_admin' && (
                                            <span className="text-[10px] font-bold text-emerald-500">Pode gerenciar plano</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                <AlertCircle className="text-amber-500 shrink-0" size={20} />
                <div>
                    <p className="text-sm font-bold text-amber-500">Regras de Administração</p>
                    <ul className="text-xs text-amber-500/70 mt-1 list-disc ml-4 space-y-1">
                        <li>Super Admins podem gerenciar cargos (Admin) e planos (Pro/Basic/Teste) de todos.</li>
                        <li>Admins podem gerenciar apenas os planos de usuários comuns.</li>
                        <li>Admins não podem alterar outros Admins nem promover ninguém a cargo administrativo.</li>
                    </ul>
                </div>
            </div>

            {/* Seção de Suporte */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <MessageCircle className="text-whatsapp" size={18} />
                    <h3 className="text-lg font-bold text-white">Tickets de Suporte</h3>
                    {tickets.filter(t => t.status === 'unread').length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                            {tickets.filter(t => t.status === 'unread').length} NOVOS
                        </span>
                    )}
                </div>

                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Usuário</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Assunto</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Data</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loadingTickets ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-xs italic">Carregando mensagens...</td></tr>
                                ) : tickets.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-xs italic">Nenhum ticket encontrado.</td></tr>
                                ) : (
                                    tickets.map((ticket) => (
                                        <tr key={ticket.id} className={`hover:bg-white/[0.02] transition-colors ${ticket.status === 'unread' ? 'bg-whatsapp/5' : ''}`}>
                                            <td className="px-6 py-4">
                                                {ticket.status === 'unread' ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-whatsapp/20 text-whatsapp text-[10px] font-bold border border-whatsapp/20">NOVO</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 text-[10px] font-bold">LIDO</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-bold text-white">{ticket.user_name}</p>
                                                    <p className="text-[10px] text-slate-500">{ticket.user_email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ticket.category === 'erro' ? 'bg-red-500/20 text-red-500' : ticket.category === 'duvida' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                    {ticket.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400">
                                                {new Date(ticket.created_at).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setViewingTicket(ticket);
                                                            if (ticket.status === 'unread') handleMarkAsRead(ticket.id);
                                                        }}
                                                        className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors" title="Ler Mensagem">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTicket(ticket.id)}
                                                        className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors" title="Excluir">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Leitura de Ticket */}
            {viewingTicket && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card w-full max-w-lg p-6 border-white/10"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Ticket de Suporte</h3>
                            <button onClick={() => setViewingTicket(null)} className="text-slate-400 hover:text-white">Feche</button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-start bg-white/5 p-3 rounded-xl">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">De</p>
                                    <p className="text-sm text-white font-bold">{viewingTicket.user_name}</p>
                                    <p className="text-xs text-slate-400">{viewingTicket.user_email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Categoria</p>
                                    <span className="text-xs font-bold text-whatsapp uppercase">{viewingTicket.category}</span>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Mensagem</p>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-white text-sm whitespace-pre-wrap leading-relaxed">
                                    {viewingTicket.message}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setViewingTicket(null)}
                            className="w-full mt-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                        >
                            Fechar
                        </button>
                    </motion.div>
                </div>
            )}
            {/* Modal de Criação de Usuário */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card w-full max-w-md p-6 border-white/10"
                    >
                        <h3 className="text-xl font-bold text-white mb-4">{t('admin.modalTitle')}</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('admin.nameLabel')}</label>
                                <input
                                    type="text"
                                    required
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                                    placeholder="João Silva"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('admin.emailLabel')}</label>
                                <input
                                    type="email"
                                    required
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                                    placeholder="joao@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('admin.passwordLabel')}</label>
                                <input
                                    type="password"
                                    required
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('admin.planLabel')}</label>
                                <select
                                    value={newUser.plan}
                                    onChange={e => setNewUser({ ...newUser, plan: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                                >
                                    <option value="pro" className="bg-[#1a1c24]">💎 PRO</option>
                                    <option value="basic" className="bg-[#1a1c24]">⭐ BASIC</option>
                                    <option value="teste" className="bg-[#1a1c24]">⌛ TESTE (3 DIAS)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all"
                                >
                                    {t('admin.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
                                >
                                    {creating ? t('admin.creating') : t('admin.submit')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default AdminTab;
