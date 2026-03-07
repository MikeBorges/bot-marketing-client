import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, Trash2, Megaphone } from 'lucide-react';

const BroadcastModal = ({ isOpen, onClose, broadcasts = [], userEmail, socket }) => {
    const unread = broadcasts.filter(b => !b.read_by?.includes(userEmail));

    const handleOpen = (b) => {
        if (!b.read_by?.includes(userEmail)) {
            socket?.emit('mark_broadcast_read', { broadcastId: b.id });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'linear-gradient(135deg, rgba(124,111,255,0.15), rgba(124,111,255,0.05))' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,111,255,0.2)', border: '1px solid rgba(124,111,255,0.3)' }}>
                            <Megaphone size={18} style={{ color: 'var(--accent)' }} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Avisos do Sistema</h2>
                            {unread.length > 0 && (
                                <p className="text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>
                                    {unread.length} não lido{unread.length > 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg transition-colors hover:bg-white/10" style={{ color: 'var(--text-muted)' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto max-h-[60vh] divide-y" style={{ borderColor: 'var(--border)' }}>
                    {broadcasts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 gap-3">
                            <Bell size={32} style={{ color: 'var(--text-muted)' }} />
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum aviso no momento</p>
                        </div>
                    ) : broadcasts.map((b) => {
                        const isUnread = !b.read_by?.includes(userEmail);
                        return (
                            <div
                                key={b.id}
                                onClick={() => handleOpen(b)}
                                className="p-4 cursor-pointer transition-colors hover:bg-white/[0.03]"
                                style={{
                                    background: isUnread ? 'rgba(124,111,255,0.05)' : 'transparent',
                                    borderLeft: isUnread ? '3px solid var(--accent)' : '3px solid transparent'
                                }}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {isUnread && (
                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
                                            )}
                                            <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{b.title}</p>
                                        </div>
                                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{b.message}</p>
                                        <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
                                            {new Date(b.created_at).toLocaleString('pt-BR')}
                                            {b.target_emails?.length > 0 && <span className="ml-2 px-1.5 py-0.5 rounded bg-white/10">Selecionado</span>}
                                        </p>
                                    </div>
                                    {!isUnread && <CheckCircle size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90" style={{ background: 'var(--accent)', color: 'white' }}>
                        Fechar
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default BroadcastModal;
