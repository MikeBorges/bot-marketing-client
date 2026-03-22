import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Trash2, User, Terminal, Wifi, WifiOff, Copy, Download } from 'lucide-react';
import PromoEditModal from './PromoEditModal';

const ChatbotTab = ({ socket, status }) => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('chatbot_history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map(m => ({ ...m, time: new Date(m.time) }));
            } catch (e) { return []; }
        }
        return [
            {
                id: 1,
                from: 'bot',
                text: '👋 Olá! Sou o painel de controle do Bot. Digite um comando abaixo para interagir comigo.',
                time: new Date()
            }
        ];
    });
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Estados do Modal de Edição
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editPromoData, setEditPromoData] = useState(null);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        try {
            // Pruna o histórico para não estourar o quota do localStorage (5MB)
            // Removemos as imagens em base64 e limitamos às últimas 20 mensagens
            const historyToSave = messages.slice(-20).map(m => ({
                ...m,
                image: m.image ? 'IMAGE_REMOVED_TO_SAVE_SPACE' : null 
            }));
            localStorage.setItem('chatbot_history', JSON.stringify(historyToSave));
        } catch (e) {
            console.warn('[Chatbot] Erro ao salvar histórico (Quota Excedida):', e.message);
        }
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        const handleBotResponse = (data) => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + Math.random(),
                from: 'bot',
                text: data.text || data,
                image: data.image || null,
                isPromo: data.isPromo || false,
                time: new Date()
            }]);
        };

        const handlePromoEditStart = (data) => {
            setIsTyping(false);
            setEditPromoData(data);
            setEditModalOpen(true);
        };

        const handleError = (errorMsg) => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + Math.random(),
                from: 'bot',
                text: `❌ Erro: ${errorMsg}`,
                time: new Date()
            }]);
        };

        socket.on('bot_response', handleBotResponse);
        socket.on('promo_edit_start', handlePromoEditStart);
        socket.on('error', handleError);
        return () => {
            socket.off('bot_response', handleBotResponse);
            socket.off('promo_edit_start', handlePromoEditStart);
            socket.off('error', handleError);
        };
    }, [socket]);

    // Limpa o chat visualmente quando o status muda (troca de conta ou desconexão)
    useEffect(() => {
        if (status === 'Desconectado') {
            setMessages([
                {
                    id: Date.now() + Math.random(),
                    from: 'bot',
                    text: '👋 Conexão resetada. Digite um comando para começar.',
                    time: new Date()
                }
            ]);
        }
    }, [status]);

    const sendMessage = () => {
        const text = input.trim();
        if (!text) return;

        // Adicionar mensagem do usuário
        setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            from: 'user',
            text,
            time: new Date()
        }]);
        setInput('');
        setIsTyping(true);

        // Enviar pro servidor
        socket.emit('chatbot_command', { text });

        // Timeout caso não haja resposta (expandido para 15s por causa do scrape)
        setTimeout(() => setIsTyping(false), 15000);
    };

    const handleGenerateCustomPromo = (customData) => {
        setIsTyping(true);
        socket.emit('generate_promo_custom', customData);
    };

    const handleScheduleShortcut = (text, imageBase64) => {
        const draft = {
            text: text,
            imagePreview: imageBase64 || '',
            datetime: '',
            selectedGroups: []
        };
        localStorage.setItem('scheduled_draft', JSON.stringify(draft));
        localStorage.setItem('auto_open_schedule', 'true');

        window.dispatchEvent(new CustomEvent('switchTabToAutomation'));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        const initialMsg = [{
            id: Date.now() + Math.random(),
            from: 'bot',
            text: `🧹 Conversa limpa!`,
            time: new Date()
        }];
        setMessages(initialMsg);
        localStorage.removeItem('chatbot_history');
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const copyText = (text) => {
        navigator.clipboard.writeText(text);
        alert('Texto copiado!');
    };

    const downloadImage = (imageBase64, filename = 'promocao.png') => {
        const link = document.createElement('a');
        link.href = imageBase64;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyImage = async (imageBase64) => {
        try {
            const resp = await fetch(imageBase64);
            const blob = await resp.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            alert('Imagem copiada para a área de transferência!');
        } catch (err) {
            console.error('Falha ao copiar imagem:', err);
            alert('Erro ao copiar imagem. Tente usar o botão de download.');
        }
    };

    const handleCopyAll = async (msg) => {
        if (msg.image) {
            try {
                const resp = await fetch(msg.image);
                const blob = await resp.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
            } catch (err) { console.error('Falha ao copiar imagem:', err); }
        }
        if (msg.text) {
            navigator.clipboard.writeText(msg.text);
        }
        alert('Imagem e Texto copiados (Tudo junto)');
    };

    // Comandos de atalho
    const shortcuts = [
        { label: '!status', desc: 'Ver status do bot' },
        { label: '!grupos', desc: 'Listar grupos' },
        { label: '!leads', desc: 'Total de leads' },
        { label: '!ajuda', desc: 'Ver todos os comandos' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6 h-full flex flex-col"
        >
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>Chatbot</p>
                    <h2 className="text-2xl font-bold heading-lg" style={{ color: 'var(--text-primary)' }}>{t('chatbot.title') || 'Comandos do Bot'}</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('chatbot.subtitle') || 'Interaja com o motor do sistema'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${status === 'Conectado'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        {status === 'Conectado' ? <Wifi size={13} /> : <WifiOff size={13} />}
                        {status === 'Conectado' ? (t('chatbot.connected') || 'Conectado') : (t('chatbot.disconnected') || 'Desconectado')}
                    </div>
                    <button
                        onClick={clearChat}
                        className="nav-item text-xs py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                        <Trash2 size={14} />
                        Limpar Conversa
                    </button>
                </div>
            </header>

            {/* Atalhos rápidos */}
            <div className="flex flex-wrap gap-2">
                {shortcuts.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => { setInput(s.label); inputRef.current?.focus(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-whatsapp/10 hover:text-whatsapp border border-white/10 hover:border-whatsapp/20 rounded-lg text-xs font-mono text-slate-400 transition-all"
                        title={s.desc}
                    >
                        <Terminal size={12} />
                        {s.label}
                    </button>
                ))}
                <span className="text-xs text-slate-600 self-center ml-1">{t('chatbot.shortcutsHint') || 'clique no atalho ou digite'}</span>
            </div>

            {/* Área de mensagens */}
            <div className="glass-card flex-1 flex flex-col overflow-hidden" style={{ minHeight: '600px', maxHeight: '800px' }}>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`flex gap-3 ${msg.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${msg.from === 'user'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-whatsapp/20 text-whatsapp'
                                    }`}>
                                    {msg.from === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>

                                {/* Balão */}
                                <div className={`max-w-[80%] flex flex-col ${msg.from === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`rounded-2xl text-sm leading-relaxed overflow-hidden ${msg.from === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-sm'
                                        : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm'
                                        }`}>

                                        {msg.image && (
                                            <div className="relative group">
                                                {msg.image === 'IMAGE_REMOVED_TO_SAVE_SPACE' ? (
                                                    <div className="p-4 bg-white/5 text-slate-500 text-[10px] italic flex items-center justify-center border-b border-white/5">
                                                        Imagem não disponível no histórico antigo
                                                    </div>
                                                ) : (
                                                    <img src={msg.image} alt="Promo" className="w-full max-w-[300px] block" />
                                                )}
                                                {msg.image !== 'IMAGE_REMOVED_TO_SAVE_SPACE' && (
                                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-2">
                                                        <button
                                                            onClick={() => downloadImage(msg.image)}
                                                            className="p-2 bg-white/20 rounded-lg text-white shadow-lg hover:bg-whatsapp hover:scale-110 transition-all backdrop-blur-md"
                                                            title="Baixar Imagem"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => copyImage(msg.image)}
                                                            className="p-2 bg-white/20 rounded-lg text-white shadow-lg hover:bg-whatsapp hover:scale-110 transition-all backdrop-blur-md"
                                                            title="Copiar Imagem"
                                                        >
                                                            <Copy size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleCopyAll(msg)}
                                                            className="p-2 bg-white/20 rounded-lg text-white shadow-lg hover:bg-blue-500 hover:scale-110 transition-all backdrop-blur-md"
                                                            title="Copiar Tudo (Img + Texto)"
                                                        >
                                                            <Send size={16} className="rotate-[-45deg]" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="px-4 py-2.5 whitespace-pre-wrap relative group">
                                            {msg.text}
                                            {msg.isPromo && (
                                                <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                                                    <button
                                                        onClick={() => copyText(msg.text)}
                                                        className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                                                    >
                                                        <Copy size={14} />
                                                        Copiar Texto
                                                    </button>
                                                    <button
                                                        onClick={() => handleScheduleShortcut(msg.text, msg.image)}
                                                        className="w-full py-2 bg-whatsapp/10 hover:bg-whatsapp/20 text-whatsapp rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                                    >
                                                        <Bot size={14} />
                                                        Agendar Campanha
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-600 mt-1 px-1">{formatTime(msg.time)}</span>
                                </div>
                            </motion.div>
                        ))}

                        {/* Digitando... */}
                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-3"
                            >
                                <div className="w-8 h-8 rounded-full bg-whatsapp/20 text-whatsapp flex items-center justify-center">
                                    <Bot size={16} />
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            className="w-2 h-2 bg-whatsapp rounded-full"
                                            animate={{ y: [0, -4, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-white/10 p-4 flex gap-3">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite um comando..."
                        rows={1}
                        className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-whatsapp/50 transition-colors resize-none"
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                        onInput={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || status !== 'Conectado'}
                        className="px-4 py-2.5 bg-whatsapp hover:bg-whatsapp-dark text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-whatsapp/20 flex items-center gap-2 font-bold text-sm"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl flex gap-3 items-start">
                <Terminal size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200/70 leading-relaxed">
                    <strong className="text-white">{t('chatbot.infoTitle') || 'Comandos:'}</strong> {t('chatbot.infoDesc') || 'Use o chatbot para testar envio de mensagens ou conversar com a IA de Vendas da configuração de Auto-Resposta e Remoção de SPAMs.'}
                </div>
            </div>

            <PromoEditModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                editData={editPromoData}
                onGenerate={handleGenerateCustomPromo}
            />
        </motion.div>
    );
};

export default ChatbotTab;
