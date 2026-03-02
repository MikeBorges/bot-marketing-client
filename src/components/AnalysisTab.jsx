import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageSquare, Users, Download, BarChart3, Calendar, Eye } from 'lucide-react';

const AnalysisTab = ({
    analysisTimeRange,
    setAnalysisTimeRange,
    events,
    getFilteredEvents,
    getDailyStats,
    downloadAnalysisCSV,
    groups,
    stats
}) => {
    const { t } = useTranslation();
    const filteredEvents = getFilteredEvents();

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

    const applyCustomRange = () => {
        if (!customFrom || !customTo) return;
        const from = new Date(customFrom).setHours(0, 0, 0, 0);
        const to = new Date(customTo).setHours(23, 59, 59, 999);
        setAnalysisTimeRange({ type: 'custom', from, to });
    };

    const dailyStats = getDailyStats();

    // KPIs filtered
    const totalGroupsCreated = groups.filter(g => g.isBotGroup).length;
    const allViewRates = groups.map(g => {
        const s = stats[g.id];
        return s && s.total > 0 ? (s.views / s.total) * 100 : 0;
    }).filter(v => v > 0);
    const avgViewRate = allViewRates.length > 0
        ? (allViewRates.reduce((a, b) => a + b, 0) / allViewRates.length).toFixed(1)
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
        >
            {/* ── Header padrão ─────────────────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>{t('menu.analysis')}</p>
                    <h2 className="text-2xl font-bold heading-lg" style={{ color: 'var(--text-primary)' }}>{t('analysis.title')}</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('analysis.subtitle')}</p>
                </div>
                <button
                    onClick={downloadAnalysisCSV}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0"
                    style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: 'var(--mint)' }}
                >
                    <Download size={15} />
                    {t('analysis.exportBtn')}
                </button>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: t('analysis.stats.entries'), value: `+${filteredEvents.filter(e => e.type === 'join').length}`, color: 'var(--mint)' },
                    { label: t('analysis.stats.exits'), value: `-${filteredEvents.filter(e => e.type === 'leave').length}`, color: 'var(--danger)' },
                    { label: 'Grupos Criados', value: totalGroupsCreated, color: '#fbbf24' },
                    { label: `${t('analysis.stats.views')} Média`, value: `${avgViewRate}%`, color: 'var(--accent)' },
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
                                            className="w-5/12 bg-emerald-500/30 border-t-2 border-emerald-500 rounded-t" />
                                        <motion.div initial={{ height: 0 }} animate={{ height: `${(day.leave / maxVal) * 100}%` }}
                                            className="w-5/12 bg-red-500/30 border-t-2 border-red-500 rounded-t" />
                                    </div>
                                    <span className="text-[9px] rotate-45 origin-left whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{day.date}</span>
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-20">
                                        <div className="rounded-lg shadow-xl text-[10px] whitespace-nowrap p-2" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                                            <p className="font-bold border-b border-white/5 mb-1 pb-1" style={{ color: 'var(--text-primary)' }}>{day.date}</p>
                                            <p className="text-emerald-400">{t('analysis.stats.entries')}: {day.join}</p>
                                            <p className="text-red-400">{t('analysis.stats.exits')}: {day.leave}</p>
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
                        const filtered = groups.filter(item.filterFn);
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
            <div className="glass-card">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Eye size={15} style={{ color: 'var(--accent)' }} />
                    {t('analysis.activityLogTitle')}
                </h3>
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {filteredEvents.slice(-5).reverse().map((e, idx) => (
                        <div key={idx} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <div className={`glow-dot w-2 h-2`} style={{ background: e.type === 'join' ? 'var(--mint)' : 'var(--danger)', animation: 'none' }} />
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    {e.type === 'join' ? t('analysis.activityJoin') : t('analysis.activityLeave')} <strong style={{ color: 'var(--text-primary)' }}>{e.groupName}</strong>
                                </span>
                            </div>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(e.timestamp).toLocaleTimeString()}</span>
                        </div>
                    ))}
                    {filteredEvents.length === 0 && (
                        <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>{t('analysis.emptyActivity')}</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default AnalysisTab;

