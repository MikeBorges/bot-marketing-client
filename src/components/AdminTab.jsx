import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, Crown, AlertCircle, MessageCircle, Eye, Trash2, Megaphone, Send, X, Save, Loader2 } from 'lucide-react';

const AdminTab = ({ userEmail, userRole, addNotification, socket }) => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', plan: 'basic' });
    const [creating, setCreating] = useState(false);

    const [tickets, setTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [viewingTicket, setViewingTicket] = useState(null);

    // Broadcast state
    const [broadcasts, setBroadcasts] = useState([]);
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastTargets, setBroadcastTargets] = useState([]); // empty = all
    const [broadcastSending, setBroadcastSending] = useState(false);
    const [broadcastExpanded, setBroadcastExpanded] = useState(true);
    const [selectSpecific, setSelectSpecific] = useState(false);
    const [expiryEdits, setExpiryEdits] = useState({});
    const [updatingExpiryEmail, setUpdatingExpiryEmail] = useState(null);

    const [activeSubTab, setActiveSubTab] = useState('users');

    const subTabs = [
        { id: 'users', label: 'Usuários', icon: User },
        { id: 'broadcast', label: 'Avisos', icon: Megaphone },
        { id: 'support', label: 'Suporte', icon: MessageCircle },
    ];

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
            // Broadcasts
            socket.emit('get_broadcasts');
            socket.on('broadcasts_update', ({ broadcasts: data }) => setBroadcasts(data || []));
            socket.on('new_broadcast', (b) => setBroadcasts(prev => [b, ...prev]));
            socket.on('broadcast_deleted', ({ broadcastId }) => setBroadcasts(prev => prev.filter(b => b.id !== broadcastId)));
        }

        return () => {
            if (socket) {
                socket.off('support_tickets_list');
                socket.off('refresh_support_tickets');
                socket.off('new_support_ticket');
                socket.off('broadcasts_update');
                socket.off('new_broadcast');
                socket.off('broadcast_deleted');
            }
        };
    }, [socket]);

    const handleUpdateUser = async (targetEmail, updates, targetId = null) => {
        // ... (existing logic or placeholder if you want to keep it simple)
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/admin/update-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requesterEmail: userEmail,
                    targetEmail,
                    targetId,
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
                setNewUser({ name: '', email: '', password: '', plan: 'basic' });
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

    const handleDeleteBroadcast = (id) => {
        if (window.confirm('Excluir este aviso permanentemente?')) {
            socket.emit('delete_broadcast', { broadcastId: id });
        }
    };

    const handleSendBroadcast = () => {
        if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
            addNotification('Título e mensagem são obrigatórios.', 'error');
            return;
        }
        setBroadcastSending(true);
        socket.once('broadcast_sent', ({ success, error }) => {
            setBroadcastSending(false);
            if (success) {
                addNotification('Aviso enviado com sucesso!', 'success');
                setBroadcastTitle('');
                setBroadcastMessage('');
                setBroadcastTargets([]);
                setSelectSpecific(false);
            } else {
                addNotification(error || 'Erro ao enviar aviso.', 'error');
            }
        });
        socket.emit('send_broadcast', {
            title: broadcastTitle,
            message: broadcastMessage,
            targetEmails: selectSpecific ? broadcastTargets : []
        });
    };

    const handleDeleteUser = async (targetEmail) => {
        if (!window.confirm(`TEM CERTEZA? Isso excluirá permanentemente o usuário ${targetEmail} e TODOS os seus dados (leads, contas, agendamentos). Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/admin/delete-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requesterEmail: userEmail,
                    targetEmail
                })
            });

            const data = await response.json();
            if (response.ok) {
                addNotification('Usuário e dados excluídos com sucesso!', 'success');
                fetchUsers();
            } else {
                addNotification(data.error || 'Erro ao excluir usuário', 'error');
            }
        } catch (err) {
            addNotification('Erro de conexão ao excluir usuário', 'error');
        }
    };

    if (loading) return <div className="flex items-center justify-center py-20 text-slate-400">{t('admin.loading')}</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl mx-auto space-y-6"
        >
            <header className="flex justify-between items-center">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>{t('admin.title')}</p>
                    <h2 className="text-2xl font-bold heading-lg text-white">{t('admin.subtitle')}</h2>
                    <p className="text-sm mt-1 text-slate-400">{t('admin.desc')}</p>
                </div>
                {activeSubTab === 'users' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
                    >
                        <User size={16} />
                        {t('admin.createBtn')}
                    </button>
                )}
            </header>

            {/* Sub-tabs Navigation */}
            <div className="flex p-1.5 gap-1.5 rounded-2xl bg-white/5 border border-white/10 overflow-x-auto no-scrollbar">
                {subTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeSubTab === tab.id
                            ? 'bg-accent/10 text-accent border border-accent/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                        {tab.id === 'support' && tickets.filter(t => t.status === 'unread').length > 0 && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeSubTab === 'users' && (
                    <motion.div
                        key="users"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="w-full space-y-6"
                    >
                        <div className="glass-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/5">
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Usuário</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Papel / Cargo</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Plano Atual</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Última Renovação</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Validade</th>
                                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map((u) => (
                                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <div className="w-9 h-9 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-500 font-bold border border-purple-500/20">
                                                                {u.name.substring(0, 1)}
                                                            </div>
                                                            {u.plan_expires_at && new Date(u.plan_expires_at) < new Date() && (
                                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1a1c24] animate-pulse" title="Vencido" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white flex items-center gap-2">
                                                                {u.name}
                                                                {u.plan_expires_at && new Date(u.plan_expires_at) < new Date() && (
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 uppercase">Vencido</span>
                                                                )}
                                                            </p>
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
                                                        onChange={(e) => handleUpdateUser(u.email, { newPlan: e.target.value }, u.id)}
                                                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                                                    >
                                                        <option value="pro" className="bg-[#1a1c24]">💎 PRO</option>
                                                        <option value="intermediario" className="bg-[#1a1c24]">🚀 INTERMEDIÁRIO</option>
                                                        <option value="basic" className="bg-[#1a1c24]">⭐ BASIC</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-mono text-slate-400">
                                                        {u.plan_updated_at ? new Date(u.plan_updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="datetime-local"
                                                            value={expiryEdits[u.email] !== undefined ? expiryEdits[u.email] : (u.plan_expires_at ? new Date(u.plan_expires_at).toISOString().slice(0, 16) : '')}
                                                            onChange={(e) => setExpiryEdits(prev => ({ ...prev, [u.email]: e.target.value }))}
                                                            disabled={u.role === 'super_admin'}
                                                            className={`bg-white/5 border rounded-lg px-2 py-1 text-[10px] font-mono text-white focus:outline-none focus:border-purple-500 disabled:opacity-50 ${u.plan_expires_at && new Date(u.plan_expires_at) < new Date() ? 'border-red-500/50 text-red-400' : 'border-white/10'}`}
                                                        />
                                                        {expiryEdits[u.email] !== undefined && (
                                                            <button
                                                                onClick={async () => {
                                                                    setUpdatingExpiryEmail(u.email);
                                                                    const newVal = expiryEdits[u.email] ? new Date(expiryEdits[u.email]).toISOString() : null;
                                                                    await handleUpdateUser(u.email, { newPlanExpiresAt: newVal }, u.id);
                                                                    setExpiryEdits(prev => {
                                                                        const copy = { ...prev };
                                                                        delete copy[u.email];
                                                                        return copy;
                                                                    });
                                                                    setUpdatingExpiryEmail(null);
                                                                }}
                                                                disabled={updatingExpiryEmail === u.email}
                                                                className="p-1.5 bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/30 transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                                                                title="Confirmar e Salvar Validade"
                                                            >
                                                                {updatingExpiryEmail === u.email ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                            </button>
                                                        )}
                                                    </div>
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
                                                            <button
                                                                onClick={() => handleDeleteUser(u.email)}
                                                                className="p-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all shadow-lg shadow-red-500/10"
                                                                title="Excluir Usuário e Dados"
                                                            >
                                                                <Trash2 size={14} />
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
                                    <li>Super Admins podem gerenciar cargos (Admin) e planos (Pro/Intermediário/Basic) de todos.</li>
                                    <li>Admins podem gerenciar apenas os planos de usuários comuns.</li>
                                    <li>Admins não podem alterar outros Admins nem promover ninguém a cargo administrativo.</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeSubTab === 'broadcast' && (
                    <motion.div
                        key="broadcast"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="w-full space-y-6"
                    >
                        {userRole === 'super_admin' ? (
                            <div className="glass-card space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Megaphone size={16} className="text-accent" />
                                    <h3 className="text-sm font-bold text-white">Novo Aviso</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Título do Aviso</label>
                                        <input
                                            type="text"
                                            value={broadcastTitle}
                                            onChange={e => setBroadcastTitle(e.target.value)}
                                            placeholder="Ex: Manutenção programada!"
                                            className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                                            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Mensagem</label>
                                        <textarea
                                            rows={4}
                                            value={broadcastMessage}
                                            onChange={e => setBroadcastMessage(e.target.value)}
                                            placeholder="Escreva o aviso para os usuários..."
                                            className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
                                            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>

                                {/* Destinatários */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Destinatários</label>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setSelectSpecific(false)}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${!selectSpecific ? 'border-transparent' : 'border-white/10'}`}
                                            style={{ background: !selectSpecific ? 'var(--accent)' : 'var(--bg-hover)', color: !selectSpecific ? 'white' : 'var(--text-secondary)' }}
                                        >
                                            👥 Todos os usuários
                                        </button>
                                        <button
                                            onClick={() => setSelectSpecific(true)}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${selectSpecific ? 'border-transparent' : 'border-white/10'}`}
                                            style={{ background: selectSpecific ? 'var(--accent)' : 'var(--bg-hover)', color: selectSpecific ? 'white' : 'var(--text-secondary)' }}
                                        >
                                            🎯 Selecionar usuários
                                        </button>
                                    </div>

                                    {selectSpecific && (
                                        <div className="mt-3 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                                            {users.filter(u => u.role !== 'super_admin').map(u => (
                                                <label key={u.email} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={broadcastTargets.includes(u.email)}
                                                        onChange={e => {
                                                            if (e.target.checked) setBroadcastTargets(prev => [...prev, u.email]);
                                                            else setBroadcastTargets(prev => prev.filter(em => em !== u.email));
                                                        }}
                                                        className="w-4 h-4 accent-purple-500"
                                                    />
                                                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleSendBroadcast}
                                    disabled={broadcastSending || !broadcastTitle.trim() || !broadcastMessage.trim()}
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                    style={{ background: 'var(--accent)', color: 'white' }}
                                >
                                    <Send size={14} />
                                    {broadcastSending ? 'Enviando...' : 'Enviar Aviso'}
                                </button>
                            </div>
                        ) : (
                            <div className="glass-card p-8 text-center bg-amber-500/5 border-amber-500/10">
                                <Shield size={32} className="mx-auto text-amber-500/40 mb-3" />
                                <p className="text-sm text-amber-500/80 font-bold">Apenas Super Admin pode enviar avisos globais.</p>
                            </div>
                        )}

                        {/* Avisos anteriores */}
                        {broadcasts.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Histórico de Avisos</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {broadcasts.map(b => (
                                        <div key={b.id} className="glass-card flex items-start gap-4 p-4 hover:bg-white/[0.04] transition-colors group">
                                            <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent shrink-0 border border-accent-border">
                                                <Megaphone size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-sm font-bold truncate text-white">{b.title}</p>
                                                    <span className="text-[10px] text-slate-500 font-medium">{new Date(b.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs line-clamp-2 text-slate-400 leading-relaxed mb-3">{b.message}</p>
                                                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                    <span>{b.read_by?.length || 0} LEITURAS</span>
                                                    <span>{b.target_emails?.length > 0 ? `${b.target_emails.length} PRIVADO` : 'PÚBLICO'}</span>
                                                    {userRole === 'super_admin' && (
                                                        <button
                                                            onClick={() => handleDeleteBroadcast(b.id)}
                                                            className="ml-auto p-1 text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeSubTab === 'support' && (
                    <motion.div
                        key="support"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-6"
                    >
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals remain same, just ensure they are at the end of return */}
            {/* Modal de Leitura de Ticket */}
            {viewingTicket && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card w-full max-w-lg p-6 border-white/10 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Ticket de Suporte</h3>
                            <button onClick={() => setViewingTicket(null)} className="text-slate-400 hover:text-white p-2">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-start bg-white/5 p-3 rounded-xl border border-white/5">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Solicitante</p>
                                    <p className="text-sm text-white font-bold">{viewingTicket.user_name}</p>
                                    <p className="text-xs text-slate-400">{viewingTicket.user_email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Categoria</p>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${viewingTicket.category === 'erro' ? 'bg-red-500/20 text-red-500' : viewingTicket.category === 'duvida' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        {viewingTicket.category}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Mensagem enviada</p>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-white text-sm whitespace-pre-wrap leading-relaxed min-h-[100px]">
                                    {viewingTicket.message}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setViewingTicket(null)}
                            className="w-full mt-6 py-3 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold transition-all shadow-lg shadow-accent/20"
                        >
                            Fechar Chamado
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
                        className="glass-card w-full max-w-md p-6 border-white/10 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">{t('admin.modalTitle')}</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white p-2">
                                <X size={20} />
                            </button>
                        </div>
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
                                    <option value="intermediario" className="bg-[#1a1c24]">🚀 INTERMEDIÁRIO</option>
                                    <option value="basic" className="bg-[#1a1c24]">⭐ BASIC</option>
                                </select>
                            </div>
                            <div className="flex gap-3 mt-8">
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
                                    className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-xl text-sm font-bold shadow-lg shadow-accent/20 transition-all disabled:opacity-50"
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
