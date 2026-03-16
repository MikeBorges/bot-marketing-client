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
    socket,
    userPlan
}) => {
    const { t } = useTranslation();
    const isBasicPlan = userPlan && (userPlan.toLowerCase() === 'basic' || userPlan.toLowerCase() === 'teste');
    const botGroupsCount = groups.filter(g => g.isBotGroup).length;
    const groupLimit = isBasicPlan ? 5 : (userPlan?.toLowerCase() === 'intermediario' ? 10 : 999);
    const hasReachedLimit = botGroupsCount >= groupLimit;
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

        // 1. Salva a configuração ANTES de limpar os campos
        const nextConfig = { ...autoConfig, baseName: newGroupName.trim(), groupDescription: newGroupDesc };
        if (newGroupIndex) nextConfig.groupStartIndex = parseInt(newGroupIndex) + 1;
        setAutoConfig(nextConfig);

        // 2. Chama a criação manual passando a descrição atual
        handleCreateManualGroup(name, newGroupDesc);

        // 3. Limpa os campos da UI
        setNewGroupName('');
        setNewGroupDesc('');
        setNewGroupIndex('');
        setIsModalOpen(false);

        // 4. Persiste a configuração no backend
        // handleSaveConfig já usa o autoConfig atualizado via setAutoConfig
        setTimeout(() => handleSaveConfig(), 100);
    };

    // ─── Análise de Grupos ───────────────────────────────────────────────────
    // Filtra apenas os grupos selecionados para monitoramento E opcionalmente pelo termo de busca
    const analysisData = groups
        .filter(g => (autoConfig.monitoredGroups || []).includes(g.id))
        .map(g => {
            const views = stats?.[g.id]?.views || 0;
            const viewsPct = g.participants > 0 ? ((views / g.participants) * 100) : 0;
            const createdAt = stats?.[g.id]?.createdAt || null;
            return { ...g, views, viewsPct, createdAt };
        });

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
    const [activeSubTab, setActiveSubTab] = useState('overview');

    const subTabs = [
        { id: 'overview', label: 'Meus Grupos', icon: Users },
        { id: 'analysis', label: 'Estatísticas', icon: BarChart2 },
        { id: 'config', label: 'Configuração', icon: Plus },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-6xl mx-auto space-y-6"
        >
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{t('groups.title')}</h2>
                    <p className="text-xs md:text-sm text-slate-400">{t('groups.subtitle', { count: groups.length })}</p>
                </div>
                {activeSubTab === 'overview' && (
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder={t('groups.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-whatsapp/50 transition-colors"
                        />
                    </div>
                )}
            </header>

            {/* Sub-tabs Navigation */}
            <div className="flex p-1.5 gap-1.5 rounded-2xl bg-white/5 border border-white/10 overflow-x-auto no-scrollbar">
                {subTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeSubTab === tab.id
                            ? 'bg-whatsapp/10 text-whatsapp border border-whatsapp/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeSubTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="glass-card overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Users size={20} className="text-whatsapp" />
                                        {t('groups.title')}
                                    </h3>
                                    <button
                                        onClick={handleRefreshClick}
                                        disabled={isRefreshing}
                                        title="Sincronizar grupos agora"
                                        className={`flex items-center gap-2 px-3 py-1.5 border font-bold text-xs rounded-lg transition-all ${refreshDone
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            : 'bg-whatsapp/10 hover:bg-whatsapp/20 border-whatsapp/20 text-whatsapp'
                                            } disabled:opacity-60`}
                                    >
                                        <RefreshCw size={12} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                                        {isRefreshing ? 'Sincronizando...' : refreshDone ? '✓ Sincronizado!' : 'Sincronizar'}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {searchTerm ? `${groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).length} resultados` : `${groups.length} grupos encontrados`}
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th
                                                className="text-left px-4 py-3 text-xs text-slate-500 uppercase font-bold cursor-pointer hover:text-white transition-colors"
                                                onClick={toggleAllMonitoring}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${(autoConfig.monitoredGroups || []).length === groups.length && groups.length > 0 ? 'bg-whatsapp border-whatsapp' : 'border-white/20'}`}>
                                                        {(autoConfig.monitoredGroups || []).length === groups.length && groups.length > 0 && <CheckCircle2 size={12} className="text-black" />}
                                                    </div>
                                                    Monitorar
                                                </div>
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase font-bold">Grupo</th>
                                            <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase font-bold">Membros</th>
                                            <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase font-bold">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {groups.filter(g => (g.name || "").toLowerCase().includes(searchTerm.toLowerCase())).map((group) => (
                                            <tr key={group.id} className={`hover:bg-white/5 transition-all ${!(autoConfig.monitoredGroups || []).includes(group.id) ? 'opacity-70' : ''}`}>
                                                <td className="px-4 py-4" onClick={() => toggleMonitoring(group.id)}>
                                                    <div className="flex items-center justify-start">
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer ${(autoConfig.monitoredGroups || []).includes(group.id) ? 'bg-whatsapp border-whatsapp shadow-[0_0_10px_rgba(74,222,128,0.3)]' : 'border-white/20'}`}>
                                                            {(autoConfig.monitoredGroups || []).includes(group.id) && <CheckCircle2 size={14} className="text-black" />}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-whatsapp/10 text-whatsapp font-bold flex items-center justify-center uppercase shrink-0">
                                                            {group.name.substring(0, 1)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-white font-bold truncate max-w-[200px]" title={group.name}>{group.name}</p>
                                                                {group.isBotGroup && <span className="text-[9px] bg-whatsapp/20 text-whatsapp px-1.5 py-0.5 rounded font-black uppercase">BOT</span>}
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 truncate italic">ID: {group.id.split('@')[0]}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-white font-bold">{group.participants}</span>
                                                        <span className="text-[10px] text-slate-500 uppercase tracking-tighter">membros</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleDeleteGroup(group.id, group.name)}
                                                            className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-xl transition-colors"
                                                            title={t('groups.deleteTooltip')}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {groups.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="py-20 text-center">
                                                    <Users size={48} className="mx-auto text-slate-600 mb-4" />
                                                    <p className="text-slate-500 font-medium">{t('groups.empty')}</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeSubTab === 'analysis' && (
                    <motion.div
                        key="analysis"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="glass-card overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <BarChart2 size={20} className="text-blue-400" />
                                    {t('groups.analysis.title')}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={exportToCSV}
                                        disabled={analysisData.length === 0}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold text-sm rounded-xl transition-all disabled:opacity-40"
                                    >
                                        <Download size={16} />
                                        {t('groups.analysis.exportBtn')}
                                    </button>
                                </div>
                            </div>

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

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase font-bold">
                                                Grupo
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
                                        {sortedData.filter(g => (autoConfig.monitoredGroups || []).includes(g.id)).map((g) => {
                                            const capacityPct = autoConfig?.threshold > 0
                                                ? Math.min(100, (g.participants / autoConfig.threshold) * 100)
                                                : Math.min(100, (g.participants / capacityBase) * 100);
                                            return (
                                                <tr key={g.id} className="hover:bg-white/5 transition-colors">
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

                                        {analysisData.length > 0 && (
                                            <tr className="border-t-2 border-white/10 bg-white/5 font-bold">
                                                <td className="px-4 py-3 text-xs text-slate-400 uppercase">{t('groups.analysis.totalRow')}</td>
                                                <td className="px-4 py-3 text-right text-white">{totalMembers.toLocaleString('pt-BR')}</td>
                                                <td className="px-4 py-3 hidden md:table-cell" />
                                                <td className="px-4 py-3 text-right text-blue-400">{totalViews.toLocaleString('pt-BR')}</td>
                                                <td className="px-4 py-3 text-right text-whatsapp">{avgViewsPct.toFixed(1)}%</td>
                                                <td className="px-4 py-3 hidden lg:table-cell" />
                                            </tr>
                                        )}

                                        {analysisData.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="px-4 py-12 text-center text-slate-500 italic text-sm">
                                                    {t('groups.analysis.noData')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeSubTab === 'config' && (
                    <motion.div
                        key="config"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full space-y-6"
                    >
                        <div className="glass-card p-6 md:p-8 space-y-8">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{t('groups.modal.title')}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{t('groups.modal.subtitle')}</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">{t('groups.modal.changeImageBtn')}</label>
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

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Nome para Novo Grupo</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            placeholder="Ex: Grupo VIP, Promo Verão..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-whatsapp/50 transition-colors"
                                        />
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
                                    <p className="text-xs italic min-h-[1rem]">
                                        {finalGroupName() && (
                                            <span>Será criado: <span className="text-whatsapp font-semibold">"{finalGroupName()}"</span> &nbsp;&bull;&nbsp; Próximo automático: <span className="text-slate-300">"{newGroupName.trim() || autoConfig.baseName} #{newGroupIndex ? parseInt(newGroupIndex) + 1 : (autoConfig.groupStartIndex || 1)}"</span></span>
                                        )}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">{t('groups.modal.baseNameLabel')}</label>
                                    <input
                                        type="text"
                                        value={autoConfig.baseName}
                                        onChange={(e) => setAutoConfig({ ...autoConfig, baseName: e.target.value })}
                                        placeholder={t('groups.modal.baseNamePlaceholder')}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-whatsapp/50 transition-colors"
                                    />
                                    <p className="text-xs text-slate-500 italic">{t('groups.modal.baseNameDesc', { name: autoConfig.baseName })}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">{t('groups.modal.descLabel')}</label>
                                    <textarea
                                        value={newGroupDesc}
                                        onChange={(e) => setNewGroupDesc(e.target.value)}
                                        placeholder={t('groups.modal.descPlaceholder')}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-whatsapp/50 transition-colors min-h-[100px] resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">{t('groups.modal.thresholdLabel')}</label>
                                    <input
                                        type="number"
                                        value={autoConfig.threshold}
                                        onChange={(e) => setAutoConfig({ ...autoConfig, threshold: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-whatsapp/50 transition-colors"
                                    />
                                </div>

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
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="flex flex-col md:flex-row gap-4 pt-4">
                                    {hasReachedLimit && (
                                        <div className="col-span-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold">Limite de Grupos Atingido</p>
                                                <p className="text-xs opacity-80 mt-1">
                                                    Seu plano atual permite criar até {groupLimit} grupos administrados pelo bot.
                                                    Você já possui {botGroupsCount} grupos ativos.
                                                    Remova um grupo existente ou faça upgrade para criar novos!
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => {
                                            if (hasReachedLimit) {
                                                addNotification('Limite de grupos atingido para o seu plano!', 'error');
                                                return;
                                            }
                                            submitCreation();
                                            setAutoConfig(prev => ({ ...prev, groupDescription: newGroupDesc }));
                                            handleSaveConfig();
                                        }}
                                        disabled={hasReachedLimit}
                                        className={`flex-1 flex items-center justify-center gap-2 ${hasReachedLimit ? 'bg-slate-700 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'} text-white font-bold py-4 rounded-xl transition-all shadow-lg`}
                                    >
                                        <Plus size={20} />
                                        {t('groups.modal.createNowBtn')}
                                    </button>

                                    <button
                                        onClick={handleSaveConfig}
                                        className={`flex-1 flex items-center justify-center gap-2 font-bold py-4 rounded-xl transition-all ${savedConfig ? 'bg-emerald-600' : 'bg-whatsapp hover:bg-whatsapp-dark'} text-white shadow-lg shadow-whatsapp/20`}
                                    >
                                        {savedConfig ? (
                                            <span className="flex items-center gap-2"><CheckCircle2 size={20} /> {t('groups.modal.savedBtn')}</span>
                                        ) : (
                                            <span>{t('automation.saveBtn')}</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence >
        </motion.div >
    );
};

export default GroupsTab;
