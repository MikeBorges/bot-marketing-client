import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageSquare, Users, Download, BarChart3, Calendar, Eye, RefreshCw, Search } from 'lucide-react';

const AnalysisTab = ({
    analysisTimeRange,
    setAnalysisTimeRange,
    events,
    getFilteredEvents,
    getDailyStats,
    downloadAnalysisCSV,
    groups,
    stats,
    onRefresh,
    config
}) => {
    const { t } = useTranslation();
    const monitoredIds = config?.monitoredGroups || [];
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filtra localmente para reagir à mudança de analysisTimeRange
    const filteredEvents = useMemo(() => {
        return events.filter(e => {
            // Filtro por Grupo (Monitoramento Seletivo)
            if (monitoredIds.length > 0 && !monitoredIds.includes(e.groupId)) return false;

            if (analysisTimeRange && typeof analysisTimeRange === 'object' && analysisTimeRange.type === 'custom') {
                return e.timestamp >= analysisTimeRange.from && e.timestamp <= analysisTimeRange.to;
            } else if (typeof analysisTimeRange === 'number') {
                return e.timestamp > Date.now() - analysisTimeRange;
            } else if (typeof analysisTimeRange === 'string' && analysisTimeRange.startsWith('month-')) {
                const parts = analysisTimeRange.split('-');
                const year = parseInt(parts[1]);
                const month = parseInt(parts[2]);
                const start = new Date(year, month, 1).getTime();
                const end = new Date(year, month + 1, 1).getTime();
                return e.timestamp >= start && e.timestamp < end;
            }
            return true;
        });
    }, [events, analysisTimeRange]);

    // Calcula o início do bot (primeiro evento ou hoje)
    const firstEventTimestamp = events.length > 0
        ? Math.min(...events.map(e => e.timestamp))
        : Date.now();

    const startDate = new Date(firstEventTimestamp);
    startDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Diferença em dias
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const todayStr = new Date().toISOString().split('T')[0];
    const [dateMode, setDateMode] = useState('preset'); // 'preset' or 'custom'
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState(todayStr);

    // Estados do Modal Detalhado
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [modalFilterGroup, setModalFilterGroup] = useState('all'); // 'all' ou ID do grupo
    const [modalFilterFrom, setModalFilterFrom] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [modalFilterTo, setModalFilterTo] = useState(new Date().toISOString().split('T')[0]);
    const [appliedModalFilters, setAppliedModalFilters] = useState({
        group: 'all',
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });
    const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

    const handleApplyModalFilters = () => {
        setAppliedModalFilters({
            group: modalFilterGroup,
            from: modalFilterFrom,
            to: modalFilterTo
        });
    };


    const applyCustomRange = () => {
        if (!customFrom || !customTo) return;
        
        // Usar split e mapear para Number para evitar problemas de fuso horário (UTC vs Local)
        const [yearFrom, monthFrom, dayFrom] = customFrom.split('-').map(Number);
        const from = new Date(yearFrom, monthFrom - 1, dayFrom, 0, 0, 0, 0).getTime();
        
        const [yearTo, monthTo, dayTo] = customTo.split('-').map(Number);
        const to = new Date(yearTo, monthTo - 1, dayTo, 23, 59, 59, 999).getTime();

        setAnalysisTimeRange({ type: 'custom', from, to });
    };

    const dailyStats = useMemo(() => {
        const statsByDay = {};
        const todayLocalStr = new Date().toLocaleDateString();
        statsByDay[todayLocalStr] = { date: 'Hoje', join: 0, leave: 0, click: 0, growth: 0, timestamp: Date.now() };
        filteredEvents.forEach(e => {
            const d = new Date(e.timestamp);
            const day = d.toLocaleDateString();
            const label = day === todayLocalStr ? 'Hoje' : day;
            if (!statsByDay[day]) statsByDay[day] = { date: label, join: 0, leave: 0, click: 0, growth: 0, timestamp: e.timestamp };
            if (e.type === 'join') statsByDay[day].join++;
            if (e.type === 'leave') statsByDay[day].leave++;
            if (e.type === 'click') statsByDay[day].click++;
            statsByDay[day].growth = statsByDay[day].join - statsByDay[day].leave;
        });
        return Object.values(statsByDay).sort((a, b) => a.timestamp - b.timestamp);
    }, [filteredEvents]);

    // KPIs filtered
    const monitoredGroupsList = monitoredIds.length > 0
        ? groups.filter(g => monitoredIds.includes(g.id))
        : groups;

    const totalGroupsCreated = monitoredGroupsList.filter(g => g.isBotGroup).length;
    const allViewRates = monitoredGroupsList.map(g => {
        const s = stats[g.id];
        return s && s.total > 0 ? (s.views / s.total) * 100 : 0;
    }).filter(v => v > 0);
    const avgViewRate = allViewRates.length > 0
        ? (allViewRates.reduce((a, b) => a + b, 0) / allViewRates.length).toFixed(1)
        : 0;

    // Lógica de exportação CSV do Modal (Estilo Excel)
    const downloadFilteredCSV = (data) => {
        const BOM = '\uFEFF';
        const headers = ["Data", "Grupo", "Entradas", "Saídas", "Cliques", "Saldo"];
        const rows = data.map(d => [
            d.date,
            `"${(d.groupName || '').replace(/"/g, '""')}"`,
            d.joins,
            d.leaves,
            d.clicks,
            d.balance
        ]);

        const csvContent = BOM + [headers, ...rows].map(e => e.join(';')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_agrupado_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const modalAggregatedData = useMemo(() => {
        const filteredByModal = filteredEvents.filter(e => {
            const eventDate = new Date(e.timestamp).toISOString().split('T')[0];
            const matchesDate = eventDate >= appliedModalFilters.from && eventDate <= appliedModalFilters.to;
            const matchesGroup = appliedModalFilters.group === 'all' || e.groupId === appliedModalFilters.group;
            return matchesDate && matchesGroup;
        });

        const aggregation = {};

        filteredByModal.forEach(e => {
            const dateStr = new Date(e.timestamp).toLocaleDateString();
            const groupName = e.groupName || e.groupId;
            const key = `${dateStr}-${groupName}`;
            if (!aggregation[key]) {
                aggregation[key] = {
                    date: dateStr,
                    groupName: groupName,
                    joins: 0,
                    leaves: 0,
                    clicks: 0,
                    balance: 0,
                    timestamp: e.timestamp
                };
            }
            if (e.type === 'join') aggregation[key].joins++;
            if (e.type === 'leave') aggregation[key].leaves++;
            if (e.type === 'click') aggregation[key].clicks++;
            aggregation[key].balance = aggregation[key].joins - aggregation[key].leaves;
        });

        const sortedData = Object.values(aggregation).sort((a, b) => {
            if (sortConfig.key === 'date') {
                return sortConfig.direction === 'asc'
                    ? b.timestamp - a.timestamp
                    : a.timestamp - b.timestamp;
            }
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return sortedData;
    }, [filteredEvents, appliedModalFilters, sortConfig]);

    const requestSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-6xl mx-auto space-y-6"
        >
            {/* ── Header padrão ─────────────────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>{t('menu.analysis')}</p>
                    <h2 className="text-2xl font-bold heading-lg" style={{ color: 'var(--text-primary)' }}>{t('analysis.title')}</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('analysis.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => {
                            if (isRefreshing) return;
                            setIsRefreshing(true);
                            onRefresh?.();
                            setTimeout(() => setIsRefreshing(false), 3000);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: 'rgba(124,111,255,0.1)', border: '1px solid rgba(124,111,255,0.2)', color: 'var(--accent)' }}
                        title="Atualizar dados agora"
                    >
                        <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                        {isRefreshing ? 'Atualizando...' : 'Atualizar'}
                    </button>
                    <button
                        onClick={downloadAnalysisCSV}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: 'var(--mint)' }}
                    >
                        <Download size={15} />
                        {t('analysis.exportBtn')}
                    </button>
                </div>
            </header>

            {/* ── Filtros ───────────────────────────────────────────── */}
            <div className="glass-card">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ color: 'var(--text-muted)' }}>{t('analysis.filterLabel')}</p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setDateMode('preset')}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={dateMode === 'preset'
                                ? { background: 'var(--accent)', color: 'white' }
                                : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        >
                            Períodos
                        </button>
                        <button
                            onClick={() => setDateMode('custom')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={dateMode === 'custom'
                                ? { background: '#3b82f6', color: 'white' }
                                : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                        >
                            <Calendar size={12} />
                            Por Data
                        </button>
                    </div>

                    {dateMode === 'preset' ? (
                        <select
                            value={typeof analysisTimeRange === 'object' ? '' : analysisTimeRange}
                            onChange={(e) => setAnalysisTimeRange(e.target.value.startsWith('month') ? e.target.value : Number(e.target.value))}
                            className="flex-1 rounded-xl px-3 py-1.5 text-sm focus:outline-none transition-colors"
                            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        >
                            <option value={86400000} style={{ background: 'var(--bg-surface)' }}>{t('analysis.timeRange.today')}</option>
                            {diffDays >= 2 && <option value={172800000} style={{ background: 'var(--bg-surface)' }}>{t('analysis.timeRange.yesterday')}</option>}
                            {diffDays >= 3 && <option value={259200000} style={{ background: 'var(--bg-surface)' }}>{t('analysis.timeRange.days', { count: 3 })}</option>}
                            {diffDays >= 7 && <option value={604800000} style={{ background: 'var(--bg-surface)' }}>{t('analysis.timeRange.week')}</option>}
                            {diffDays >= 14 && <option value={1209600000} style={{ background: 'var(--bg-surface)' }}>{t('analysis.timeRange.weeks', { count: 2 })}</option>}
                            {diffDays >= 30 && <option value={2592000000} style={{ background: 'var(--bg-surface)' }}>{t('analysis.timeRange.month')}</option>}
                            {(today.getMonth() !== startDate.getMonth() || today.getFullYear() !== startDate.getFullYear()) && (
                                <optgroup label={t('analysis.timeRange.months')} style={{ background: 'var(--bg-surface)' }}>
                                    {(() => {
                                        const options = [];
                                        let current = new Date(today.getFullYear(), today.getMonth(), 1);
                                        while (current >= new Date(startDate.getFullYear(), startDate.getMonth(), 1)) {
                                            const mIdx = current.getMonth();
                                            const yr = current.getFullYear();
                                            options.push(
                                                <option key={`${yr}-${mIdx}`} value={`month-${yr}-${mIdx}`} style={{ background: 'var(--bg-surface)' }}>
                                                    {t(`analysis.timeRange.monthNames.${mIdx}`)} {yr}
                                                </option>
                                            );
                                            current.setMonth(current.getMonth() - 1);
                                        }
                                        return options;
                                    })()}
                                </optgroup>
                            )}
                        </select>
                    ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                                <label className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>De:</label>
                                <input type="date" value={customFrom} max={todayStr} onChange={e => setCustomFrom(e.target.value)}
                                    className="rounded-lg px-3 py-1.5 text-sm focus:outline-none transition-colors"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <label className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>Até:</label>
                                <input type="date" value={customTo} max={todayStr} onChange={e => setCustomTo(e.target.value)}
                                    className="rounded-lg px-3 py-1.5 text-sm focus:outline-none transition-colors"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <button onClick={applyCustomRange} disabled={!customFrom}
                                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                                style={{ background: '#3b82f6', color: 'white' }}
                            >Filtrar</button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── KPIs ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: t('analysis.stats.entries'), value: `+${filteredEvents.filter(e => e.type === 'join').length}`, color: 'var(--mint)' },
                    { label: t('analysis.stats.exits'), value: `-${filteredEvents.filter(e => e.type === 'leave').length}`, color: 'var(--danger)' },
                ].map((kpi, i) => (
                    <div key={i} className="stat-card">
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{kpi.label}</p>
                        <p className="text-2xl font-bold heading-lg" style={{ color: kpi.color }}>{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Gráfico de Crescimento ────────────────────────────── */}
            <div className="glass-card overflow-hidden">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <BarChart3 size={16} style={{ color: 'var(--accent)' }} />
                        {t('analysis.growthTitle')}
                    </h3>
                    <div className="flex gap-4 text-[10px]">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span style={{ color: 'var(--text-secondary)' }}>{t('analysis.stats.entries')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span style={{ color: 'var(--text-secondary)' }}>{t('analysis.stats.exits')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            <span style={{ color: 'var(--text-secondary)' }}>Cliques</span>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto pb-4 -mx-2 px-2">
                    <div className="h-52 flex items-end gap-2 min-w-[500px] lg:min-w-0">
                        {dailyStats.length > 0 ? dailyStats.map((day, idx) => {
                            const maxVal = Math.max(...dailyStats.map(d => Math.max(d.join, d.leave))) || 1;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                                    <div className="w-full flex justify-center gap-0.5 h-40 items-end">
                                        <motion.div initial={{ height: 0 }} animate={{ height: `${(day.join / maxVal) * 100}%` }}
                                            className="w-1/3 bg-emerald-500/30 border-t-2 border-emerald-500 rounded-t" title={`Entradas: ${day.join}`} />
                                        <motion.div initial={{ height: 0 }} animate={{ height: `${(day.leave / maxVal) * 100}%` }}
                                            className="w-1/3 bg-red-500/30 border-t-2 border-red-500 rounded-t" title={`Saídas: ${day.leave}`} />
                                        <motion.div initial={{ height: 0 }} animate={{ height: `${(day.click / maxVal) * 100}%` }}
                                            className="w-1/3 bg-amber-400/30 border-t-2 border-amber-400 rounded-t" title={`Cliques: ${day.click}`} />
                                    </div>
                                    <span className="text-[9px] rotate-45 origin-left whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{day.date}</span>
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-20">
                                        <div className="rounded-lg shadow-xl text-[10px] whitespace-nowrap p-2" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                                            <p className="font-bold border-b border-white/5 mb-1 pb-1" style={{ color: 'var(--text-primary)' }}>{day.date}</p>
                                            <p className="text-emerald-400">{t('analysis.stats.entries')}: {day.join}</p>
                                            <p className="text-red-400">{t('analysis.stats.exits')}: {day.leave}</p>
                                            <p className="text-amber-400">Cliques: {day.click}</p>
                                            <p style={{ color: 'var(--accent)' }}>{t('analysis.stats.balance')}: {day.growth}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="w-full h-full flex items-center justify-center text-sm italic" style={{ color: 'var(--text-muted)' }}>
                                {t('analysis.emptyChart')}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Métricas por Tipo ────────────────────────────────── */}
            <div className="glass-card">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Users size={15} style={{ color: 'var(--accent)' }} />
                    {t('analysis.metricsTitle')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { label: t('analysis.botGroups'), icon: MessageSquare, color: 'var(--mint)', border: 'rgba(52,211,153,0.15)', bg: 'rgba(52,211,153,0.06)', filterFn: g => g.isBotGroup },
                        { label: t('analysis.personalGroups'), icon: Users, color: 'var(--accent)', border: 'rgba(124,111,255,0.15)', bg: 'rgba(124,111,255,0.06)', filterFn: g => !g.isBotGroup },
                    ].map((item, i) => {
                        const filtered = monitoredGroupsList.filter(item.filterFn);
                        return (
                            <div key={i} className="p-4 rounded-xl" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <item.icon size={15} style={{ color: item.color }} />
                                    <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</h4>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span style={{ color: 'var(--text-secondary)' }}>{t('analysis.totalGroups')}</span>
                                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{filtered.length}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span style={{ color: 'var(--text-secondary)' }}>{t('analysis.totalMembers')}</span>
                                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {filtered.reduce((acc, g) => acc + (g.participants || 0), 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Log de Atividades ────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tabela de Métricas por Grupo */}
                <div className="lg:col-span-2 glass-card overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <BarChart3 size={15} style={{ color: 'var(--accent)' }} />
                            Métricas por Grupo
                        </h3>
                        <button
                            onClick={() => setShowDetailsModal(true)}
                            className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg transition-all hover:opacity-80"
                            style={{ background: 'rgba(124,111,255,0.1)', color: 'var(--accent)', border: '1px solid rgba(124,111,255,0.2)' }}
                        >
                            Ver Detalhes
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Grupo</th>
                                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>Entradas</th>
                                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>Saídas</th>
                                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>Cliques</th>
                                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-muted)' }}>Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                {(() => {
                                    const groupMap = {};
                                    filteredEvents.forEach(e => {
                                        const key = e.groupId || e.groupName || 'Grupo Desconhecido';
                                        if (!groupMap[key]) {
                                            groupMap[key] = { name: e.groupName || 'Grupo Desconhecido', joins: 0, leaves: 0, clicks: 0 };
                                        }
                                        if (e.type === 'join') groupMap[key].joins++;
                                        if (e.type === 'leave') groupMap[key].leaves++;
                                        if (e.type === 'click') groupMap[key].clicks++;
                                    });

                                    const sortedGroups = Object.values(groupMap).sort((a, b) => (b.joins - b.leaves) - (a.joins - a.leaves));
                                    
                                    const grandTotal = sortedGroups.reduce((acc, g) => ({
                                        joins: acc.joins + g.joins,
                                        leaves: acc.leaves + g.leaves,
                                        clicks: acc.clicks + g.clicks
                                    }), { joins: 0, leaves: 0, clicks: 0 });

                                    if (sortedGroups.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan="5" className="py-8 text-center text-sm italic" style={{ color: 'var(--text-muted)' }}>
                                                    Nenhuma atividade registrada no período.
                                                </td>
                                            </tr>
                                        );
                                    }
                                    const groupRows = sortedGroups.map((g, idx) => {
                                        const balance = g.joins - g.leaves;
                                        return (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className="py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{g.name}</td>
                                                <td className="py-3 px-4 text-sm text-center font-bold" style={{ color: 'var(--mint)' }}>+{g.joins}</td>
                                                <td className="py-3 px-4 text-sm text-center font-bold" style={{ color: 'var(--danger)' }}>-{g.leaves}</td>
                                                <td className="py-3 px-4 text-sm text-center font-bold font-mono text-amber-400">{g.clicks}</td>
                                                <td className="py-3 px-4 text-sm text-right">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${balance >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                        {balance > 0 ? '+' : ''}{balance}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    });

                                    return (
                                        <>
                                            {groupRows}
                                            {sortedGroups.length > 0 && (
                                                <tr className="bg-white/5 font-black border-t-2" style={{ borderColor: 'var(--border)' }}>
                                                    <td className="py-4 px-4 text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>TOTAL GERAL</td>
                                                    <td className="py-4 px-4 text-sm text-center" style={{ color: 'var(--mint)' }}>+{grandTotal.joins}</td>
                                                    <td className="py-4 px-4 text-sm text-center" style={{ color: 'var(--danger)' }}>-{grandTotal.leaves}</td>
                                                    <td className="py-4 px-4 text-sm text-center text-amber-400 font-mono">{grandTotal.clicks}</td>
                                                    <td className="py-4 px-4 text-sm text-right">
                                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${(grandTotal.joins - grandTotal.leaves) >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                            {(grandTotal.joins - grandTotal.leaves) > 0 ? '+' : ''}{grandTotal.joins - grandTotal.leaves}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Log de Atividades Recentes */}
                <div className="glass-card">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Eye size={15} style={{ color: 'var(--accent)' }} />
                        {t('analysis.activityLogTitle')}
                    </h3>
                    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                        {filteredEvents.slice(-8).reverse().map((e, idx) => (
                            <div key={idx} className="flex items-center justify-between py-3">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3">
                                        <div className={`glow-dot w-2 h-2`} style={{ background: e.type === 'join' ? 'var(--mint)' : 'var(--danger)', animation: 'none' }} />
                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {e.type === 'join' ? 'Entrou' : 'Saiu'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] ml-5" style={{ color: 'var(--text-secondary)' }}>{e.groupName}</span>
                                </div>
                                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        ))}
                        {filteredEvents.length === 0 && (
                            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>{t('analysis.emptyActivity')}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Modal Detalhado ───────────────────────────────────── */}
            {
                showDetailsModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowDetailsModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden glass-card flex flex-col p-0"
                            style={{ border: '1px solid var(--border)' }}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                                <div>
                                    <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Detalhamento de Métricas</h3>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Análise granular por grupo, data e tipo de evento.</p>
                                </div>
                                <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                    <RefreshCw size={20} className="rotate-45" style={{ color: 'var(--text-muted)' }} />
                                </button>
                            </div>

                            {/* Modal Filters */}
                            <div className="p-6 bg-white/5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-b" style={{ borderColor: 'var(--border)' }}>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Filtrar Grupo</label>
                                    <select
                                        value={modalFilterGroup}
                                        onChange={e => setModalFilterGroup(e.target.value)}
                                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="all">Todos os Grupos</option>
                                        {monitoredGroupsList.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>De (Início)</label>
                                    <input
                                        type="date"
                                        value={modalFilterFrom}
                                        onChange={e => setModalFilterFrom(e.target.value)}
                                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Até (Fim)</label>
                                    <input
                                        type="date"
                                        value={modalFilterTo}
                                        onChange={(e) => setModalFilterTo(e.target.value)}
                                        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none [color-scheme:dark]"
                                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={handleApplyModalFilters}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 h-[38.5px]"
                                    >
                                        <Search size={14} />
                                        Buscar
                                    </button>
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={() => downloadFilteredCSV(modalAggregatedData)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 h-[38.5px]"
                                    >
                                        <Download size={14} />
                                        Exportar Excel
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 z-10" style={{ background: 'var(--bg-surface)' }}>
                                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                            <th
                                                onClick={() => requestSort('date')}
                                                className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-white/5 transition-colors"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    Data
                                                    <RefreshCw size={10} className={sortConfig.key === 'date' ? 'opacity-100' : 'opacity-20'} />
                                                </div>
                                            </th>
                                            <th className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Grupo</th>
                                            <th
                                                onClick={() => requestSort('joins')}
                                                className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-white/5 transition-colors"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    Entradas
                                                    <RefreshCw size={10} className={sortConfig.key === 'joins' ? 'opacity-100' : 'opacity-20'} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => requestSort('leaves')}
                                                className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-white/5 transition-colors"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    Saídas
                                                    <RefreshCw size={10} className={sortConfig.key === 'leaves' ? 'opacity-100' : 'opacity-20'} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => requestSort('clicks')}
                                                className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-white/5 transition-colors"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    Cliques
                                                    <RefreshCw size={10} className={sortConfig.key === 'clicks' ? 'opacity-100' : 'opacity-20'} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => requestSort('balance')}
                                                className="py-3 px-6 text-[10px] font-bold uppercase tracking-wider text-right cursor-pointer hover:bg-white/5 transition-colors"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    Saldo
                                                    <RefreshCw size={10} className={sortConfig.key === 'balance' ? 'opacity-100' : 'opacity-20'} />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                        {modalAggregatedData.length > 0 ? modalAggregatedData.map((row, index) => (
                                            <tr key={index} className="hover:bg-white/5 transition-colors">
                                                <td className="py-4 px-6 text-xs text-center font-medium" style={{ color: 'var(--text-muted)' }}>{row.date}</td>
                                                <td className="py-4 px-6 text-xs font-bold text-white max-w-[300px] truncate" title={row.groupName}>{row.groupName}</td>
                                                <td className="py-4 px-6 text-xs text-center font-mono text-emerald-400 font-bold">+{row.joins}</td>
                                                <td className="py-4 px-6 text-xs text-center font-mono text-rose-400 font-bold">-{row.leaves}</td>
                                                <td className="py-4 px-6 text-xs text-center font-mono text-amber-400 font-bold">{row.clicks}</td>
                                                <td className={`py-4 px-6 text-sm text-right font-mono font-bold ${row.balance >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                                                    {row.balance > 0 ? `+${row.balance}` : row.balance}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="py-20 text-center">
                                                    <div className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Nenhum dado encontrado com os filtros selecionados.</div>
                                                    <button
                                                        onClick={() => { setModalFilterGroup('all'); setModalFilterFrom(''); setModalFilterTo(''); }}
                                                        className="mt-2 text-xs font-bold" style={{ color: 'var(--accent)' }}
                                                    >
                                                        Limpar filtros
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </div>
                )}
        </motion.div>
    );
};

export default AnalysisTab;
