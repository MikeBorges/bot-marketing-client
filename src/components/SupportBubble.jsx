import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, HelpCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SupportBubble = ({ socket, addNotification }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [category, setCategory] = useState('duvida');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSending(true);
        socket.emit('send_support_ticket', { category, message });

        // Ouvir confirmação única
        const handleResponse = (res) => {
            if (res.success) {
                addNotification(t('support.success') || 'Mensagem enviada com sucesso!', 'success');
                setMessage('');
                setIsOpen(false);
            }
            setSending(false);
            socket.off('support_ticket_sent', handleResponse);
        };
        socket.on('support_ticket_sent', handleResponse);
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-whatsapp text-white shadow-2xl shadow-whatsapp/30 z-[200] flex items-center justify-center transition-colors"
                title="Suporte"
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
            </motion.button>

            {/* Chat Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 w-full max-w-[350px] glass-card p-6 border-white/10 z-[200] shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-whatsapp/10 flex items-center justify-center text-whatsapp">
                                <MessageCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white leading-tight">Suporte</h3>
                                <p className="text-xs text-slate-400">Como podemos ajudar?</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Assunto</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCategory('duvida')}
                                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${category === 'duvida' ? 'bg-whatsapp/10 border-whatsapp/30 text-whatsapp' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                    >
                                        <HelpCircle size={18} />
                                        <span className="text-[10px] font-bold mt-1">Dúvida</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCategory('erro')}
                                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${category === 'erro' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                    >
                                        <AlertTriangle size={18} />
                                        <span className="text-[10px] font-bold mt-1">Erro</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCategory('sugestao')}
                                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${category === 'sugestao' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                    >
                                        <Lightbulb size={18} />
                                        <span className="text-[10px] font-bold mt-1">Ideia</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Sua Mensagem</label>
                                <textarea
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Descreva o que aconteceu..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-whatsapp/50 transition-all h-32 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={sending || !message.trim()}
                                className="w-full py-3 rounded-xl bg-whatsapp hover:bg-whatsapp/90 text-white font-bold shadow-lg shadow-whatsapp/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {sending ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Enviar Mensagem
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SupportBubble;
