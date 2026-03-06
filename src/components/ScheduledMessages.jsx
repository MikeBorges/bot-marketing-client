import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Trash2, Calendar, Users, Image as ImageIcon, Send, X, CheckSquare, Eye, Clipboard, Search } from 'lucide-react';

const ScheduledMessages = ({ groups, scheduledMessages, onAdd, onEdit, onDelete, socket }) => {
    const { t, i18n } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMsg, setEditingMsg] = useState(null);
    const [viewingMsg, setViewingMsg] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const [text, setText] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [datetime, setDatetime] = useState('');
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [listSearchTerm, setListSearchTerm] = useState('');
    const [listDateFilter, setListDateFilter] = useState('');
    const [selectedMsgs, setSelectedMsgs] = useState(new Set());

    // Carregar rascunho ao montar
    useEffect(() => {
        const draft = localStorage.getItem('scheduled_draft');
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (parsed.text) setText(parsed.text);
                if (parsed.imagePreview) setImagePreview(parsed.imagePreview);
                if (parsed.datetime) setDatetime(parsed.datetime);
                if (parsed.selectedGroups && Array.isArray(parsed.selectedGroups)) {
                    setSelectedGroups(parsed.selectedGroups);
                }
            } catch (e) {
                console.error("Erro ao carregar rascunho:", e);
            }
        }

        if (localStorage.getItem('auto_open_schedule') === 'true') {
            setIsModalOpen(true);
            localStorage.removeItem('auto_open_schedule');
        }
    }, []);

    // Salvar rascunho automaticamente (apenas se não estiver editando uma mensagem existente)
    useEffect(() => {
        if (editingMsg) return;

        const draft = { text, imagePreview, datetime, selectedGroups };
        // Só salva se houver algo preenchido para não poluir o localStorage
        if (text || imagePreview || datetime || selectedGroups.length > 0) {
            localStorage.setItem('scheduled_draft', JSON.stringify(draft));
        } else {
            localStorage.removeItem('scheduled_draft');
        }
    }, [text, imagePreview, datetime, selectedGroups, editingMsg]);

    // Suporte a colar imagem via Ctrl+V
    const textareaRef = useRef(null);

    useEffect(() => {
        if (!isModalOpen) return;
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            // Verifica se o foco está no textarea — se sim, deixa o navegador tratar (cola texto normalmente)
            const activeEl = document.activeElement;
            const isTextareaFocused = activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT');

            // Procura por imagem no clipboard
            let hasImage = false;
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    hasImage = true;
                    // Só cola a imagem se o foco NÃO estiver num campo de texto
                    if (!isTextareaFocused) {
                        const file = item.getAsFile();
                        const reader = new FileReader();
                        reader.onloadend = () => setImagePreview(reader.result);
                        reader.readAsDataURL(file);
                    }
                    break;
                }
            }

            // Se não tinha imagem, não faz nada — deixa o browser colar texto normalmente
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isModalOpen]);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleOpenModal = (msg = null) => {
        if (msg) {
            setEditingMsg(msg);
            setText(msg.text);
            setImagePreview(msg.image);

            // Se for um timestamp (número), converte para o formato local ISO esperado pelo input
            if (typeof msg.datetime === 'number') {
                const date = new Date(msg.datetime);
                const localISO = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                setDatetime(localISO);
            } else {
                setDatetime(msg.datetime);
            }

            setSelectedGroups(msg.targetGroups || []);
        } else {
            setEditingMsg(null);
            // Ao abrir para uma nova mensagem, tentamos carregar o rascunho do localStorage
            // (Isso garante que mesmo se o estado foi limpo por algum motivo, o rascunho volte)
            const draft = localStorage.getItem('scheduled_draft');
            if (draft) {
                try {
                    const { text: dText, imagePreview: dImage, datetime: dDate, selectedGroups: dGroups } = JSON.parse(draft);
                    setText(dText || '');
                    setImagePreview(dImage || null);
                    setDatetime(dDate || '');
                    setSelectedGroups(Array.isArray(dGroups) ? dGroups : []);
                } catch (e) {
                    console.error("Erro ao processar rascunho no modal:", e);
                }
            } else {
                setText('');
                setImagePreview(null);
                setDatetime('');
                setSelectedGroups([]);
            }
        }
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSelectAll = () => {
        if (selectedGroups.length === groups.length) {
            setSelectedGroups([]);
        } else {
            setSelectedGroups(groups.map(g => g.id));
        }
    };

    const toggleGroup = (groupId) => {
        setSelectedGroups(prev =>
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };


    const handleSave = () => {
        if (!datetime || selectedGroups.length === 0 || (!text && !imagePreview)) return;

        // Converte a string do input datetime-local (que é local do browser)
        // para um timestamp absoluto em milissegundos.
        // Isso garante que o servidor (independente de onde estiver) mande na hora exata.
        const absoluteTimestamp = new Date(datetime).getTime();

        const payload = {
            id: editingMsg ? editingMsg.id : undefined,
            text,
            image: imagePreview,
            datetime: absoluteTimestamp, // Agora enviamos o ponto exato no tempo
            targetGroups: selectedGroups
        };

        if (editingMsg) {
            onEdit(payload);
        } else {
            onAdd(payload);
            // Limpa o rascunho após adicionar com sucesso
            localStorage.removeItem('scheduled_draft');
            setText('');
            setImagePreview(null);
            setDatetime('');
            setSelectedGroups([]);
        }
        setIsModalOpen(false);
    };

    const handleDeleteSelected = () => {
        const ids = Array.from(selectedMsgs);
        if (ids.length === 0) return;

        if (window.confirm(`Tem certeza que deseja excluir ${ids.length} campanhas selecionadas?`)) {
            socket.emit('delete_selected_scheduled', { ids });
            setSelectedMsgs(new Set());
        }
    };

    const toggleMsgSelection = (id) => {
        setSelectedMsgs(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const filteredMessages = scheduledMessages.filter(msg => {
        const matchesText = !listSearchTerm || (msg.text || '').toLowerCase().includes(listSearchTerm.toLowerCase());
        const matchesDate = !listDateFilter || (new Date(msg.datetime).toLocaleDateString() === new Date(listDateFilter + 'T12:00:00').toLocaleDateString());
        return matchesText && matchesDate;
    });

    const toggleSelectAllList = () => {
        if (selectedMsgs.size === filteredMessages.length) {
            setSelectedMsgs(new Set());
        } else {
            setSelectedMsgs(new Set(filteredMessages.map(m => m.id)));
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        <Clock className="text-blue-400" />
                        {t('scheduled.title')}
                    </h2>
                    <p className="text-slate-400">{t('scheduled.subtitle')}</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-bold shadow-lg shadow-blue-600/20"
                >
                    <Plus size={18} /> {t('scheduled.newBtn')}
                </button>
            </header>

            {/* Filtros e Ações em Massa */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex-1 flex flex-col md:flex-row gap-4 w-full">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Pesquisar nas campanhas..."
                            value={listSearchTerm}
                            onChange={(e) => setListSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="date"
                            value={listDateFilter}
                            onChange={(e) => setListDateFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 [color-scheme:dark]"
                        />
                        {listDateFilter && (
                            <button onClick={() => setListDateFilter('')} className="ml-2 text-xs text-slate-500 hover:text-white">Limpar</button>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    {selectedMsgs.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/20 transition-all"
                        >
                            <Trash2 size={16} />
                            Excluir Selecionados ({selectedMsgs.size})
                        </button>
                    )}
                    <button
                        onClick={toggleSelectAllList}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 transition-all"
                    >
                        <CheckSquare size={16} />
                        {selectedMsgs.size === filteredMessages.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredMessages.length === 0 && (
                    <div className="glass-card p-8 text-center border-dashed border-white/20">
                        <Calendar className="mx-auto h-12 w-12 text-slate-500 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Nenhuma campanha encontrada</h3>
                        <p className="text-slate-400">Tente ajustar seus filtros ou crie uma nova campanha.</p>
                    </div>
                )}

                {filteredMessages.slice().reverse().map(msg => (
                    <div
                        key={msg.id}
                        onClick={() => toggleMsgSelection(msg.id)}
                        className={`glass-card flex flex-col md:flex-row gap-4 justify-between items-start md:items-center cursor-pointer border-2 transition-all ${selectedMsgs.has(msg.id) ? 'border-blue-500/50 bg-blue-500/5' : 'border-transparent'}`}
                    >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${selectedMsgs.has(msg.id) ? 'bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'border-white/20'}`} onClick={(e) => { e.stopPropagation(); toggleMsgSelection(msg.id); }}>
                                {selectedMsgs.has(msg.id) ? <CheckSquare size={14} className="text-white" /> : null}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${msg.status === 'concluido' ? 'bg-emerald-500/20 text-emerald-400' : msg.status === 'enviando' ? 'bg-blue-500/20 text-blue-400' : 'bg-whatsapp/20 text-whatsapp'}`}>
                                        {t(`scheduled.status.${msg.status}`)}
                                    </span>
                                    <div className="flex items-center gap-1 text-sm text-slate-300">
                                        <Clock size={14} />
                                        {(() => {
                                            try {
                                                const d = new Date(msg.datetime);
                                                return isNaN(d.getTime())
                                                    ? msg.datetime
                                                    : d.toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US');
                                            } catch (e) {
                                                return msg.datetime;
                                            }
                                        })()}
                                    </div>
                                </div>
                                <p className="text-white text-sm line-clamp-2">{msg.text || `(${t('scheduled.modal.imageLabel').replace(' (Opcional)', '').replace(' (Optional)', '')})`}</p>
                                <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                    <Users size={12} /> {msg.targetGroups?.length || 0} {t('menu.groups').toLowerCase()} {t('dashboard.synced').toLowerCase()}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                            {msg.status === 'pendente' && (
                                <button onClick={() => handleOpenModal(msg)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white font-medium transition-colors">
                                    {t('scheduled.editBtn')}
                                </button>
                            )}
                            <button onClick={() => setViewingMsg(msg)} className="p-1.5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-colors" title="Ver Conteúdo">
                                <Eye size={18} />
                            </button>
                            <button onClick={() => onDelete(msg.id)} className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative z-10 glass-card w-full max-w-3xl border-white/20 p-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Send className="text-whatsapp" size={24} />
                                    {editingMsg ? t('scheduled.modal.titleEdit') : t('scheduled.modal.titleAdd')}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Coluna Esquerda: Mensagem e Imagem */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">{t('scheduled.modal.textLabel')}</label>
                                        <textarea
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            placeholder={t('scheduled.modal.textPlaceholder')}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-whatsapp/50 transition-colors h-32 resize-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">
                                            {t('scheduled.modal.imageLabel')}
                                            <span className="ml-2 text-xs text-slate-500 font-normal">{t('scheduled.modal.imageLabelHint')}</span>
                                        </label>
                                        <div
                                            className={`border border-dashed rounded-xl p-4 text-center transition-all ${isDragging
                                                ? 'border-blue-400 bg-blue-500/10'
                                                : 'border-white/20 hover:bg-white/5'
                                                }`}
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={handleDrop}
                                        >
                                            <input type="file" id="campaign-img" accept="image/*" onChange={handleFileChange} className="hidden" />
                                            <label htmlFor="campaign-img" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                                                {imagePreview ? (
                                                    <img src={imagePreview} className="max-h-32 object-contain rounded-lg" alt="Preview" />
                                                ) : (
                                                    <>
                                                        <ImageIcon size={32} className={isDragging ? 'text-blue-400' : 'text-slate-500'} />
                                                        <span className="text-sm text-slate-400 font-medium">
                                                            {isDragging ? t('scheduled.modal.imageDragging') : t('scheduled.modal.imagePlaceholder')}
                                                        </span>
                                                    </>
                                                )}
                                            </label>
                                            {imagePreview && (
                                                <button onClick={() => setImagePreview(null)} className="mt-2 text-xs text-red-400 hover:underline">{t('scheduled.modal.imageRemove')}</button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-slate-400">{t('scheduled.modal.datetimeLabel')}</label>
                                            <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">Fuso horário local</span>
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="datetime-local"
                                                value={datetime}
                                                onChange={(e) => setDatetime(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-whatsapp/50 transition-colors [color-scheme:dark] appearance-none safari-date-picker"
                                                style={{ WebkitAppearance: 'none', minHeight: '48px' }}
                                            />
                                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover:text-whatsapp transition-colors" size={18} />
                                        </div>
                                        <p className="text-[10px] text-slate-500 italic px-1">Selecione o horário exato em que deseja disparar a campanha.</p>
                                    </div>
                                </div>

                                {/* Coluna Direita: Grupos */}
                                <div className="space-y-2 flex flex-col h-full">
                                    <div className="space-y-3 mb-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-slate-400">{t('scheduled.modal.groupsLabel', { selected: selectedGroups.length, total: groups.length })}</label>
                                            <button onClick={handleSelectAll} className="text-xs font-bold text-whatsapp hover:text-white transition-colors">
                                                {selectedGroups.length === groups.length ? t('scheduled.modal.deselectAll') : t('scheduled.modal.selectAll')}
                                            </button>
                                        </div>

                                        {/* Campo de Busca */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder={t('groups.searchPlaceholder') || "Pesquisar grupos..."}
                                                value={searchTerm || ''}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-whatsapp/30 transition-colors"
                                            />
                                            {searchTerm && (
                                                <button
                                                    onClick={() => setSearchTerm('')}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>

                                        {searchTerm && (
                                            <button
                                                onClick={() => {
                                                    const filteredIds = groups
                                                        .filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                                        .map(g => g.id);

                                                    setSelectedGroups(prev => {
                                                        const newSet = new Set(prev);
                                                        filteredIds.forEach(id => newSet.add(id));
                                                        return Array.from(newSet);
                                                    });
                                                }}
                                                className="w-full py-1.5 bg-whatsapp/10 hover:bg-whatsapp/20 border border-whatsapp/20 rounded-lg text-[10px] font-bold text-whatsapp transition-colors mt-1"
                                            >
                                                {t('scheduled.modal.selectAllFiltered') || "Selecionar todos os filtrados"}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 min-h-[200px] bg-white/5 border border-white/10 rounded-xl p-2 overflow-y-auto space-y-1">
                                        {groups.length === 0 ? (
                                            <div className="p-4 text-center text-slate-500 text-sm italic">{t('scheduled.modal.emptyGroups')}</div>
                                        ) : (() => {
                                            const filtered = groups.filter(g =>
                                                !searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase())
                                            );

                                            if (filtered.length === 0) {
                                                return <div className="p-4 text-center text-slate-500 text-xs italic">Nenhum grupo encontrado</div>;
                                            }

                                            return filtered.map(g => (
                                                <div
                                                    key={g.id}
                                                    onClick={() => toggleGroup(g.id)}
                                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
                                                >
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${selectedGroups.includes(g.id) ? 'bg-whatsapp border-whatsapp shadow-[0_0_10px_rgba(74,222,128,0.3)]' : 'border-white/20 group-hover:border-whatsapp/50'}`}>
                                                        {selectedGroups.includes(g.id) ? <CheckSquare size={14} className="text-black" /> : null}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white font-medium truncate">{g.name}</p>
                                                        <p className="text-[10px] text-slate-500">{g.participants} {t('scheduled.modal.members')}</p>
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <hr className="border-white/10 my-6" />

                            <div className="flex justify-end gap-4">
                                <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-300 hover:bg-white/10 transition-colors">
                                    {t('scheduled.modal.cancel')}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!datetime || selectedGroups.length === 0 || (!text && !imagePreview)}
                                    className="px-6 py-3 rounded-xl font-bold bg-whatsapp hover:bg-whatsapp-dark text-white transition-colors shadow-lg shadow-whatsapp/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Calendar size={18} />
                                    {editingMsg ? t('scheduled.modal.updateBtn') : t('scheduled.modal.scheduleBtn')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Modal */}
            < AnimatePresence >
                {viewingMsg && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewingMsg(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative z-10 glass-card w-full max-w-lg border-white/20 p-6 min-h-[300px] flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Eye className="text-blue-400" size={24} />
                                    Conteúdo da Mensagem
                                </h3>
                                <button onClick={() => setViewingMsg(null)} className="text-slate-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4">
                                {viewingMsg.image && (
                                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 flex justify-center p-2">
                                        <img src={viewingMsg.image} alt="Mensagem" className="max-h-48 object-contain rounded-lg" />
                                    </div>
                                )}

                                {viewingMsg.text ? (
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-white whitespace-pre-wrap text-sm leading-relaxed">
                                        {viewingMsg.text}
                                    </div>
                                ) : (
                                    <div className="text-slate-500 italic text-sm text-center py-4 bg-white/5 rounded-xl border border-white/10">
                                        Nenhum texto vinculado. Apenas envio de imagem.
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setViewingMsg(null)} className="mt-6 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-white transition-colors">
                                Fechar
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ScheduledMessages;
