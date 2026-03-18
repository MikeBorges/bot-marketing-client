import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle, X, Send, HelpCircle, AlertTriangle, Lightbulb
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── Aba Suporte ──────────────────────────────────────────
const SupportTicketTab = ({ socket, addNotification }) => {
    const { t } = useTranslation();
    const [category, setCategory] = useState('duvida');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim() || sending) return;
        setSending(true);
        
        // Remove listener anterior se existir (segurança extra)
        socket.off('support_ticket_sent');

        socket.once('support_ticket_sent', (res) => {
            if (res.success) {
                addNotification(t('support.success') || 'Mensagem enviada!', 'success');
                setMessage('');
            } else {
                addNotification(res.error || 'Erro ao enviar.', 'error');
            }
            setSending(false);
        });
        
        socket.emit('send_support_ticket', { category, message });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 h-full">
            <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Assunto</label>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'duvida', icon: HelpCircle, label: 'Dúvida', activeColor: '#22c55e' },
                        { id: 'erro', icon: AlertTriangle, label: 'Erro', activeColor: '#ef4444' },
                        { id: 'sugestao', icon: Lightbulb, label: 'Ideia', activeColor: '#f59e0b' },
                    ].map(({ id, icon: Icon, label, activeColor }) => (
                        <button
                            key={id} type="button" onClick={() => setCategory(id)}
                            className="flex flex-col items-center justify-center p-2 rounded-xl border transition-all"
                            style={category === id
                                ? { background: `${activeColor}18`, border: `1px solid ${activeColor}40`, color: activeColor }
                                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }
                            }
                        >
                            <Icon size={18} />
                            <span className="text-[10px] font-bold mt-1">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sua Mensagem</label>
                <textarea
                    required value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Descreva o que aconteceu..."
                    className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-whatsapp/50 transition-all resize-none"
                    style={{ minHeight: 90 }}
                />
            </div>
            <button
                type="submit" disabled={sending || !message.trim()}
                className="py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: '#22c55e' }}>
                {sending
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Send size={16} /> Enviar</>
                }
            </button>
        </form>
    );
};

// ─── Componente Principal ─────────────────────────────────
const SupportBubble = ({ socket, addNotification, userPlan = 'teste', userEmail = '', userName = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Persistência da posição
    const [position, setPosition] = useState(() => {
        try {
            const saved = localStorage.getItem('support_bubble_pos');
            return saved ? JSON.parse(saved) : { x: 0, y: 0 };
        } catch (e) {
            return { x: 0, y: 0 };
        }
    });

    const handleDragEnd = (event, info) => {
        const newPos = { x: position.x + info.offset.x, y: position.y + info.offset.y };
        setPosition(newPos);
        localStorage.setItem('support_bubble_pos', JSON.stringify(newPos));
        setTimeout(() => setDragActive(false), 100);
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            onDragStart={() => setDragActive(true)}
            onDragEnd={handleDragEnd}
            initial={false}
            animate={{ x: position.x, y: position.y }}
            className="fixed bottom-6 right-6 z-[200] flex flex-col items-end"
            style={{ touchAction: 'none' }}
        >
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="mb-4 flex flex-col"
                        style={{
                            width: 380, height: 480,
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 20,
                            overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0"
                            style={{ borderBottom: '1px solid var(--border)' }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(124,111,255,0.15)' }}>
                                <MessageCircle size={17} style={{ color: 'var(--accent)' }} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-white leading-tight">Suporte Técnico</h3>
                                <p className="text-[10px] text-slate-500">Estamos aqui para ajudar!</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden p-4" style={{ minHeight: 0 }}>
                            <SupportTicketTab socket={socket} addNotification={addNotification} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                    if (!dragActive) setIsOpen(!isOpen);
                }}
                className="w-14 h-14 rounded-full text-white flex items-center justify-center cursor-grab active:cursor-grabbing"
                style={{ background: 'var(--accent)', boxShadow: '0 0 28px rgba(124,111,255,0.5)' }}
                title="Suporte"
            >
                <AnimatePresence mode="wait">
                    <motion.div key={isOpen ? 'x' : 'msg'}
                        initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.15 }}>
                        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
                    </motion.div>
                </AnimatePresence>
            </motion.button>
        </motion.div>
    );
};

export default SupportBubble;
