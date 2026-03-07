import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trash2, Target, CheckCircle2, Plus, X, Download, BarChart2, Eye, TrendingUp, RefreshCw, Search } from 'lucide-react';

const GroupsTab = ({
    groups,
    searchTerm,
    setSearchTerm,
    autoConfig,
    setAutoConfig,
    imagePreview,
    handleFileChange,
    handleSaveConfig,
    savedConfig,
    stats,
    handleDeleteGroup,
    handleCreateManualGroup,
    onRefreshViews,
    socket
}) => {
    const { t } = useTranslation();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshDone, setRefreshDone] = useState(false);

    useEffect(() => {
        if (!socket) return;
        const handleDone = ({ count }) => {
            setIsRefreshing(false);
            setRefreshDone(true);
            setTimeout(() => setRefreshDone(false), 2500);
            console.log(`[GroupsTab] Views atualizados: ${count} grupos`);
        };
        socket.on('views_refresh_done', handleDone);
        return () => socket.off('views_refresh_done', handleDone);
    }, [socket]);

    const handleRefreshClick = useCallback(() => {
        setIsRefreshing(true);
        setRefreshDone(false);
        onRefreshViews?.();
        // Timeout de segurança: se não houver resposta em 30s, reseta
        setTimeout(() => setIsRefreshing(false), 30000);
    }, [onRefreshViews]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [newGroupIndex, setNewGroupIndex] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'participants', direction: 'desc' });
    const [analysisTerm, setAnalysisTerm] = useState('');

    const finalGroupName = () => {
        const name = newGroupName.trim();
        if (!name) return '';
        return newGroupIndex ? `${name} #${newGroupIndex}` : name;
    };

    const submitCreation = () => {
        const name = finalGroupName();
        if (!name) return;
        handleCreateManualGroup(name, newGroupDesc);
        // Atualiza o baseName para que a automação use o mesmo padrão
        // e o groupStartIndex para continuar do próximo número
        const nextConfig = { ...autoConfig, baseName: newGroupName.trim() };
        if (newGroupIndex) nextConfig.groupStartIndex = parseInt(newGroupIndex) + 1;
        setAutoConfig(nextConfig);
        setNewGroupName('');
        setNewGroupDesc('');
        setNewGroupIndex('');
        setIsModalOpen(false);
    };

    // ─── Análise de Grupos ───────────────────────────────────────────────────
    const analysisData = groups.map(g => {
        const views = stats?.[g.id]?.views || 0;
        const viewsPct = g.participants > 0 ? ((views / g.participants) * 100) : 0;
        const createdAt = stats?.[g.id]?.createdAt || null;
        return { ...g, views, viewsPct, createdAt };
    });

    // Filtra pela barra de pesquisa da análise (não afeta os KPIs)
    const filteredAnalysis = analysisTerm.trim()
        ? analysisData.filter(g => g.name.toLowerCase().includes(analysisTerm.toLowerCase()))
        : analysisData;

    const sortedData = [...filteredAnalysis].sort((a, b) => {
        if (!sortConfig.key) return 0;
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Fallbacks para nulos
        if (valA === null || valA === undefined) valA = 0;
        if (valB === null || valB === undefined) valB = 0;

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const requestSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const toggleMonitoring = (groupId) => {
        const current = autoConfig.monitoredGroups || [];
        let next;
        if (current.includes(groupId)) {
            next = current.filter(id => id !== groupId);
        } else {
            next = [...current, groupId];
        }
        const nextConfig = { ...autoConfig, monitoredGroups: next };
        setAutoConfig(nextConfig);
        // Persiste imediatamente para não perder a seleção
        socket.emit('update_config', { ...nextConfig, imageData: imagePreview });
    };

    const toggleAllMonitoring = () => {
        const current = autoConfig.monitoredGroups || [];
        let next;
        if (current.length === groups.length) {
            next = [];
        } else {
            next = groups.map(g => g.id);
        }
        const nextConfig = { ...autoConfig, monitoredGroups: next };
        setAutoConfig(nextConfig);
        socket.emit('update_config', { ...nextConfig, imageData: imagePreview });
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <TrendingUp size={10} className="ml-1 opacity-20" />;
        return sortConfig.direction === 'desc'
            ? <TrendingUp size={10} className="ml-1 text-whatsapp" style={{ transform: 'rotate(180deg)' }} />
            : <TrendingUp size={10} className="ml-1 text-whatsapp" />;
    };

    const totalMembers = analysisData.reduce((a, g) => a + g.participants, 0);
    const totalViews = analysisData.reduce((a, g) => a + g.views, 0);
    // Média ponderada: total de views / total de membros (correto e consistente com a coluna)
    const avgViewsPct = totalMembers > 0 ? (totalViews / totalMembers) * 100 : 0;

    // Base de capacidade: usa threshold configurado se for maior que o maior grupo,
    // senão usa o maior número de membros como 100% (evita barras com 2850%)
    const maxParticipants = groups.length > 0 ? Math.max(...groups.map(g => g.participants)) : 1;
    const thresholdOk = autoConfig?.threshold > 0 && autoConfig.threshold >= maxParticipants;
    const capacityBase = thresholdOk ? autoConfig.threshold : Math.max(maxParticipants, 1);

    const exportToCSV = () => {
        const BOM = '\uFEFF'; // UTF-8 BOM para Excel reconhecer acentos
        const headers = ['Grupo', 'Membros', 'Capacidade (%)', 'Views', 'Views (%)', 'Data Criação'];
        const rows = analysisData.map(g => [
            `"${g.name.replace(/"/g, '""')}"`,
            g.participants,
            autoConfig?.threshold > 0 ? Math.min(100, ((g.participants / capacityBase) * 100)).toFixed(1) : '-',
            g.views,
            g.viewsPct.toFixed(1),
            g.createdAt ? new Date(g.createdAt).toLocaleDateString('pt-BR') : 'N/D'
        ]);
        // Linha de totais
        rows.push([
            '"TOTAL"',
            totalMembers,
            '',
            totalViews,
            avgViewsPct.toFixed(1) + ' (média)',
            ''
        ]);

        const csvContent = BOM + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const today = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        link.download = `analise_grupos_${today}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
        >
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{t('groups.title')}</h2>
                    <p className="text-xs md:text-sm text-slate-400">{t('groups.subtitle', { count: groups.length })}</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder={t('groups.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-whatsapp/50 transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-whatsapp hover:bg-whatsapp-dark text-white font-bold py-2 px-4 rounded-xl transition-all shadow-lg shadow-whatsapp/20"
                    >
                        <Plus size={18} />
                        {t('groups.createBtn')}
                    </button>
                </div>
            </header>

            {/* Modal de Configurações de Criação de Grupo */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative z-10 glass-card w-full max-w-2xl border-white/20 p-6 md:p-8 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{t('groups.modal.title')}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{t('groups.modal.subtitle')}</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Formulário Único Unificado */}
                            <div className="space-y-8">
                                {/* 1. Imagem do Grupo (Upload) */}
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-white uppercase tracking-wider block">{t('groups.modal.changeImageBtn')}</label>
                                    <div className="flex flex-col md:flex-row md:items-center gap-6 bg-white/5 p-4 rounded-xl border border-white/10">
                                        <div className="w-20 h-20 rounded-2xl bg-black/20 border border-dashed border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Users className="text-slate-600" size={32} />
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="group-image-upload"
                                            />
                                            <label
                                                htmlFor="group-image-upload"
                                                className="inline-block px-4 py-2 bg-whatsapp/10 hover:bg-whatsapp/20 border border-whatsapp/20 rounded-lg text-sm font-bold cursor-pointer transition-colors text-whatsapp"
                                            >
                                                {t('groups.modal.changeImageBtn')}
                                            </label>
                                            <p className="text-xs text-slate-500">{t('groups.modal.imageDesc')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* ―― Nome + Número do Grupo ―― */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white uppercase tracking-wider block">Nome do Grupo</label>
                                    <div className="flex gap-2 items-center">
                                        {/* Nome livre */}
                                        <input
                                            type="text"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            placeholder="Ex: Grupo VIP, Promo Verão..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-whatsapp/50 transition-colors"
                                        />
                                        {/* Número opcional */}
                                        <span className="text-slate-500 font-bold text-lg">#</span>
                                        <input
                                            type="number"
                                            value={newGroupIndex}
                                            onChange={(e) => setNewGroupIndex(e.target.value)}
                                            placeholder="50"
                                            min="1"
                                            className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-whatsapp/50 transition-colors"
                                        />
                                    </div>
                                    {/* Preview do nome final */}
                                    <p className="text-xs italic">
                                        {finalGroupName()
                                            ? <span>Será criado: <span className="text-whatsapp font-semibold">"{finalGroupName()}"</span> &nbsp;&bull;&nbsp; Próximo automático: <span className="text-slate-300">"{newGroupName.trim() || autoConfig.baseName} #{newGroupIndex ? parseInt(newGroupIndex) + 1 : (autoConfig.groupStartIndex || 1)}"</span></span>
                                            : <span className="text-slate-500">Preencha o nome acima para ver o grupo que será criado</span>
                                        }
                                    </p>
                                </div>

                                {/* Nome Base (padrão do robô) */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white uppercase tracking-wider block">{t('groups.modal.baseNameLabel')}</label>
                                    <input
                                        type="text"
                                        value={autoConfig.baseName}
                                        onChange={(e) => setAutoConfig({ ...autoConfig, baseName: e.target.value })}
                                        placeholder={t('groups.modal.baseNamePlaceholder')}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-whatsapp/50 transition-colors"
                                    />
                                    <p className="text-xs text-slate-500 italic">{t('groups.modal.baseNameDesc', { name: autoConfig.baseName })}</p>
                                </div>

                                {/* 3. Descrição do Grupo */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white uppercase tracking-wider block">{t('groups.modal.descLabel')}</label>
                                    <textarea
                                        value={newGroupDesc}
                                        onChange={(e) => setNewGroupDesc(e.target.value)}
                                        placeholder={t('groups.modal.descPlaceholder')}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-whatsapp/50 transition-colors min-h-[100px] resize-none"
                                    />
                                </div>

                                {/* 4. Limite de Participantes */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-white uppercase tracking-wider block">{t('groups.modal.thresholdLabel')}</label>
                                    <input
                                        type="number"
                                        value={autoConfig.threshold}
                                        onChange={(e) => setAutoConfig({ ...autoConfig, threshold: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-whatsapp/50 transition-colors"
                                    />
                                    <p className="text-xs text-slate-500 italic">{t('groups.modal.thresholdDesc')}</p>
                                </div>

                                {/* 5. Mensagem no Privado */}
                                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                                    <div className="p-5 flex items-center justify-between bg-white/5">
                                        <div>
                                            <h4 className="text-white font-bold flex items-center gap-2">
                                                <Target size={18} className="text-blue-400" />
                                                {t('groups.modal.antiSpamTitle')}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-1">{t('groups.modal.antiSpamDesc')}</p>
                                        </div>
                                        <button
                                            onClick={() => setAutoConfig({ ...autoConfig, antiSpam: !autoConfig.antiSpam })}
                                            className={`w-14 h-7 rounded-full transition-all relative ${autoConfig.antiSpam ? 'bg-whatsapp' : 'bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${autoConfig.antiSpam ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {autoConfig.antiSpam && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="p-5 border-t border-white/10 space-y-3"
                                            >
                                                <label className="text-sm font-medium text-slate-400">{t('groups.modal.welcomeLabel')}</label>
                                                <textarea
                                                    value={autoConfig.welcomeMessage}
                                                    onChange={(e) => setAutoConfig({ ...autoConfig, welcomeMessage: e.target.value })}
                                                    placeholder={t('groups.modal.welcomePlaceholder')}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-whatsapp/50 transition-colors h-28 resize-none"
                                                />
                                                <p className="text-xs text-whatsapp/80 italic">{t('groups.modal.welcomeDesc')}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Botão de Ação Único */}
                                <div className="flex flex-col md:flex-row gap-4 pt-4">
                                    <button
                                        onClick={() => {
                                            submitCreation();
                                            setAutoConfig(prev => ({ ...prev, groupDescription: newGroupDesc }));
                                            handleSaveConfig();
                                            setTimeout(() => setIsModalOpen(false), 1000);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20"
                                    >
                                        <Plus size={20} />
                                        {t('groups.modal.createNowBtn')}
                                    </button>

                                    <motion.button
                                        onClick={() => {
                                            handleSaveConfig();
                                            setTimeout(() => setIsModalOpen(false), 800);
                                        }}
                                        animate={savedConfig ? { scale: [1, 1.05, 1] } : {}}
                                        className={`flex-1 flex items-center justify-center gap-2 font-bold py-4 rounded-xl transition-all ${savedConfig ? 'bg-emerald-600' : 'bg-whatsapp hover:bg-whatsapp-dark'} text-white shadow-lg shadow-whatsapp/20`}
                                    >
                                        <AnimatePresence mode="wait">
                                            {savedConfig ? (
                                                <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                                    <CheckCircle2 size={20} /> {t('groups.modal.savedBtn')}
                                                </motion.span>
                                            ) : (
                                                <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                    {t('automation.saveBtn')}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Painel de Análise de Grupos */}
            <div className="glass-card overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BarChart2 size={20} className="text-blue-400" />
                        {t('groups.analysis.title')}
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefreshClick}
                            disabled={isRefreshing}
                            title="Atualizar dados agora"
                            className={`flex items-center gap-2 px-3 py-2 border font-bold text-sm rounded-xl transition-all ${refreshDone
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 text-blue-400'
                                } disabled:opacity-60`}
                        >
                            <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                            {isRefreshing ? 'Atualizando...' : refreshDone ? '✓ Atualizado!' : 'Atualizar'}
                        </button>
                        <button
                            onClick={exportToCSV}
                            disabled={groups.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold text-sm rounded-xl transition-all disabled:opacity-40"
                        >
                            <Download size={16} />
                            {t('groups.analysis.exportBtn')}
                        </button>
                    </div>
                </div>

                {/* KPIs rápidos */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">{t('groups.analysis.totalMembers')}</p>
                        <p className="text-2xl font-bold text-white">{totalMembers.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">{t('groups.analysis.totalViews')}</p>
                        <p className="text-2xl font-bold text-blue-400">{totalViews.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">{t('groups.analysis.avgViews')}</p>
                        <p className="text-2xl font-bold text-whatsapp">{avgViewsPct.toFixed(1)}%</p>
                    </div>
                </div>

                {/* Header da tabela com filtro */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <p className="text-xs text-slate-500">
                        {analysisTerm ? `${filteredAnalysis.length} de ${analysisData.length} grupos` : `${analysisData.length} grupos`}
                    </p>
                    <div className="relative w-full sm:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Filtrar por nome..."
                            value={analysisTerm}
                            onChange={e => setAnalysisTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-8 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                        {analysisTerm && (
                            <button
                                onClick={() => setAnalysisTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabela */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th
                                    className="text-left px-4 py-3 text-xs text-slate-500 uppercase font-bold cursor-pointer hover:text-white transition-colors"
                                    onClick={toggleAllMonitoring}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${(autoConfig.monitoredGroups || []).length === groups.length ? 'bg-whatsapp border-whatsapp' : 'border-white/20'}`}>
                                            {(autoConfig.monitoredGroups || []).length === groups.length && <CheckCircle2 size={12} className="text-black" />}
                                        </div>
                                        Monitorar
                                    </div>
                                </th>
                                <th
                                    className="text-left px-4 py-3 text-xs text-slate-500 uppercase font-bold cursor-pointer hover:text-white transition-colors"
                                    onClick={() => requestSort('name')}
                                >
                                    <div className="flex items-center">{t('groups.analysis.colGroup')} <SortIcon column="name" /></div>
                                </th>
                                <th
                                    className="text-right px-4 py-3 text-xs text-slate-500 uppercase font-bold cursor-pointer hover:text-white transition-colors"
                                    onClick={() => requestSort('participants')}
                                >
                                    <div className="flex items-center justify-end">{t('groups.analysis.colMembers')} <SortIcon column="participants" /></div>
                                </th>
                                <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase font-bold hidden md:table-cell">{t('groups.analysis.colCapacity')}</th>
                                <th
                                    className="text-right px-4 py-3 text-xs text-slate-500 uppercase font-bold cursor-pointer hover:text-white transition-colors"
                                    onClick={() => requestSort('views')}
                                >
                                    <div className="flex items-center justify-end">{t('groups.analysis.colViews')} <SortIcon column="views" /></div>
                                </th>
                                <th
                                    className="text-right px-4 py-3 text-xs text-slate-500 uppercase font-bold cursor-pointer hover:text-white transition-colors"
                                    onClick={() => requestSort('viewsPct')}
                                >
                                    <div className="flex items-center justify-end">{t('groups.analysis.colViewsPct')} <SortIcon column="viewsPct" /></div>
                                </th>
                                <th
                                    className="text-right px-4 py-3 text-xs text-slate-500 uppercase font-bold cursor-pointer hover:text-white transition-colors hidden lg:table-cell"
                                    onClick={() => requestSort('createdAt')}
                                >
                                    <div className="flex items-center justify-end">{t('groups.analysis.colCreated')} <SortIcon column="createdAt" /></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedData
                                .map((g, idx) => {
                                    const capacityPct = autoConfig?.threshold > 0
                                        ? Math.min(100, (g.participants / autoConfig.threshold) * 100)
                                        : Math.min(100, (g.participants / capacityBase) * 100);
                                    return (
                                        <tr key={g.id} className={`hover:bg-white/5 transition-colors ${!(autoConfig.monitoredGroups || []).includes(g.id) ? 'opacity-50' : ''}`}>
                                            <td className="px-4 py-3" onClick={() => toggleMonitoring(g.id)}>
                                                <div className="flex items-center justify-center">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${(autoConfig.monitoredGroups || []).includes(g.id) ? 'bg-whatsapp border-whatsapp shadow-[0_0_10px_rgba(74,222,128,0.3)]' : 'border-white/20'}`}>
                                                        {(autoConfig.monitoredGroups || []).includes(g.id) && <CheckCircle2 size={14} className="text-black" />}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-whatsapp/10 text-whatsapp text-xs font-bold flex items-center justify-center uppercase shrink-0">
                                                        {g.name.substring(0, 1)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-white font-medium text-sm">{g.name}</p>
                                                        {g.isBotGroup && <span className="text-[9px] text-whatsapp font-bold uppercase">BOT</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-white font-bold">{g.participants}</td>
                                            <td className="px-4 py-3 text-right hidden md:table-cell">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${capacityPct >= 100 ? 'bg-red-500' :
                                                                capacityPct >= 80 ? 'bg-orange-400' : 'bg-whatsapp'
                                                                }`}
                                                            style={{ width: `${Math.min(100, capacityPct)}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-bold ${capacityPct >= 100 ? 'text-red-400' :
                                                        capacityPct >= 80 ? 'text-orange-400' : 'text-slate-400'
                                                        }`}>{capacityPct.toFixed(0)}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-blue-400 font-bold">{g.views}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${Math.min(100, g.viewsPct)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-300">{g.viewsPct.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs text-slate-500 hidden lg:table-cell">
                                                {g.createdAt ? new Date(g.createdAt).toLocaleDateString('pt-BR') : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}

                            {/* Linha de totais */}
                            {analysisData.length > 0 && (
                                <tr className="border-t-2 border-white/10 bg-white/5">
                                    <td className="px-4 py-3" />
                                    <td className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">{t('groups.analysis.totalRow')}</td>
                                    <td className="px-4 py-3 text-right font-bold text-white">{totalMembers.toLocaleString('pt-BR')}</td>
                                    <td className="px-4 py-3 hidden md:table-cell" />
                                    <td className="px-4 py-3 text-right font-bold text-blue-400">{totalViews.toLocaleString('pt-BR')}</td>
                                    <td className="px-4 py-3 text-right font-bold text-whatsapp">{avgViewsPct.toFixed(1)}%</td>
                                    <td className="px-4 py-3 hidden lg:table-cell" />
                                </tr>
                            )}

                            {analysisData.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-12 text-center text-slate-500 italic text-sm">
                                        {t('groups.analysis.noData')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {groups.filter(g => (g.name || "").toLowerCase().includes(searchTerm.toLowerCase())).map((group) => (
                    <div key={group.id} className="glass-card group hover:scale-[1.02] transition-all relative overflow-hidden">
                        {group.unreadCount > 0 && (
                            <div className="absolute top-0 right-0 bg-whatsapp text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-lg">
                                {t('groups.newBadge', { count: group.unreadCount })}
                            </div>
                        )}
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-whatsapp/10 flex items-center justify-center text-whatsapp font-bold text-xl uppercase">
                                {group.name.substring(0, 1)}
                            </div>
                            <div className="bg-white/5 px-2 py-1 rounded text-[10px] font-bold text-slate-400 italic">
                                ID: {group.id.split('@')[0]}
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 truncate" title={group.name}>{group.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                            <Users size={16} />
                            {group.participants} {t('scheduled.modal.members')}
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleMonitoring(group.id); }}
                                    className={`w-4 h-4 rounded-full flex-shrink-0 border transition-all ${(autoConfig.monitoredGroups || []).includes(group.id) ? 'bg-whatsapp border-whatsapp' : 'bg-slate-700 border-white/20'}`}
                                    title={(autoConfig.monitoredGroups || []).includes(group.id) ? "Monitoramento Ativo" : "Monitoramento Inativo"}
                                />
                                <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase truncate">
                                    {(autoConfig.monitoredGroups || []).includes(group.id) ? 'Monitorando' : 'Ignorado'}
                                </span>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <span className="text-[9px] md:text-[10px] text-slate-500">{t('groups.engagement')}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white">{stats?.[group.id]?.views || 0}</span>
                                    <div className="w-8 md:w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-whatsapp transition-all duration-500"
                                            style={{ width: `${Math.min(100, (stats?.[group.id]?.views / (group.participants || 1) * 100) || 0)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteGroup(group.id, group.name)}
                                className="p-1.5 md:p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition-colors flex-shrink-0"
                                title={t('groups.deleteTooltip')}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
                {groups.length === 0 && (
                    <div className="col-span-full py-20 text-center glass rounded-2xl border-dashed border-white/10">
                        <Users size={48} className="mx-auto text-slate-600 mb-4" />
                        <p className="text-slate-500">{t('groups.empty')}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default GroupsTab;
