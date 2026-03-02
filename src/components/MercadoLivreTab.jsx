import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, TrendingUp, Package, RefreshCw, AlertTriangle, Calendar, Search, ExternalLink, DollarSign, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';

// ─── Mini Bar Chart Component ───────────────────────────────────────────────
const BarChart = ({ data, colorClass, label }) => {
    if (!data || data.length === 0) return <p className="text-slate-500 italic text-xs text-center py-4">Sem dados</p>;
    const maxVal = Math.max(...data.map(d => d.value)) || 1;
    return (
        <div className="space-y-3">
            {label && <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</p>}
            <div className="flex items-end gap-1.5 h-28">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 pointer-events-none">
                            <div className="bg-slate-800 border border-white/10 px-2 py-1 rounded-lg text-[10px] whitespace-nowrap">
                                <p className="font-bold text-white">{d.label}</p>
                                <p className={colorClass.replace('bg-', 'text-')}>{typeof d.value === 'number' && d.value > 100 ? `R$ ${d.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : d.value}</p>
                            </div>
                        </div>
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(d.value / maxVal) * 100}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                            className={`w-full rounded-t-sm ${colorClass} opacity-70 hover:opacity-100 transition-opacity`}
                            style={{ minHeight: d.value > 0 ? '4px' : '0' }}
                        />
                        <span className="text-[8px] text-slate-600 truncate w-full text-center">{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Donut Chart Component ───────────────────────────────────────────────────
const DonutChart = ({ segments, size = 120 }) => {
    const r = 40;
    const circ = 2 * Math.PI * r;
    const total = segments.reduce((a, s) => a + s.value, 0) || 1;
    let offset = 0;
    return (
        <div className="flex flex-col items-center gap-3">
            <svg width={size} height={size} viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
                {segments.map((seg, i) => {
                    const dashArr = (seg.value / total) * circ;
                    const el = (
                        <motion.circle
                            key={i}
                            cx="50" cy="50" r={r}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="16"
                            strokeDasharray={`${dashArr} ${circ}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            initial={{ strokeDasharray: `0 ${circ}` }}
                            animate={{ strokeDasharray: `${dashArr} ${circ}` }}
                            transition={{ duration: 0.8, delay: i * 0.2 }}
                        />
                    );
                    offset += dashArr;
                    return el;
                })}
                <text x="50" y="54" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                    {total}
                </text>
            </svg>
            <div className="flex flex-wrap gap-3 justify-center">
                {segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
                        <span className="text-slate-400">{seg.label}: <strong className="text-white">{seg.value}</strong></span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const MercadoLivreTab = ({ config, onSaveConfig, addNotification }) => {
    const mlConfig = config?.mercadolivre || {};
    const [accessToken, setAccessToken] = useState(mlConfig.accessToken || '');
    const [appId, setAppId] = useState(mlConfig.appId || '');
    const [secretKey, setSecretKey] = useState(mlConfig.secretKey || '');

    const [mlData, setMlData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState(todayStr);

    const isConnected = !!(mlConfig.accessToken || accessToken);

    const handleSaveCredentials = () => {
        onSaveConfig({
            ...config,
            mercadolivre: { appId, secretKey, accessToken }
        });
        addNotification('Credenciais do Mercado Livre salvas!', 'success');
    };

    const fetchMLData = async () => {
        const token = accessToken || mlConfig.accessToken;
        if (!token) { setError('Insira seu Access Token primeiro.'); return; }
        setLoading(true);
        setError(null);
        try {
            const meRes = await fetch('https://api.mercadolibre.com/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!meRes.ok) throw new Error('Token inválido. Verifique suas credenciais.');
            const me = await meRes.json();

            let dateFilter = '';
            if (dateFrom) dateFilter += `&date_created_from=${dateFrom}T00:00:00.000-03:00`;
            if (dateTo) dateFilter += `&date_created_to=${dateTo}T23:59:59.999-03:00`;

            const ordersRes = await fetch(
                `https://api.mercadolibre.com/orders/search?seller=${me.id}&sort=date_desc&limit=50${dateFilter}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const ordersData = await ordersRes.json();
            const orders = ordersData.results || [];

            const claimsRes = await fetch(
                `https://api.mercadolibre.com/post-purchase/v1/claims/search?seller_id=${me.id}&status=opened&limit=50`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const claimsData = claimsRes.ok ? await claimsRes.json() : { data: [] };
            const claims = claimsData.data || [];
            const devolutions = claims.filter(c => c.type === 'mediations' || c.type === 'returns');

            const totalRevenue = orders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
            const pendingRevenue = orders
                .filter(o => o.status === 'paid' || o.status === 'payment_in_process')
                .reduce((acc, o) => acc + (o.total_amount || 0), 0);

            // Build daily revenue chart data
            const dailyMap = {};
            orders.forEach(o => {
                const day = new Date(o.date_created).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                if (!dailyMap[day]) dailyMap[day] = { value: 0, count: 0 };
                dailyMap[day].value += o.total_amount || 0;
                dailyMap[day].count += 1;
            });
            const dailyRevenue = Object.entries(dailyMap)
                .map(([label, d]) => ({ label, value: Math.round(d.value) }))
                .slice(-10);
            const dailyCount = Object.entries(dailyMap)
                .map(([label, d]) => ({ label, value: d.count }))
                .slice(-10);

            // Status breakdown for donut
            const statusMap = {};
            orders.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });

            setMlData({
                user: me,
                totalSales: orders.length,
                totalRevenue,
                pendingRevenue,
                devolutions: devolutions.length,
                openClaims: claims.length,
                recentOrders: orders.slice(0, 10),
                recentClaims: claims.slice(0, 5),
                dailyRevenue,
                dailyCount,
                statusMap
            });
        } catch (err) {
            setError(err.message || 'Erro ao buscar dados do Mercado Livre.');
        } finally {
            setLoading(false);
        }
    };

    const statusColors = { paid: '#10b981', payment_in_process: '#f59e0b', cancelled: '#ef4444', other: '#6366f1' };
    const statusLabels = { paid: 'Pago', payment_in_process: 'Em Processo', cancelled: 'Cancelado' };

    const donutSegments = mlData ? Object.entries(mlData.statusMap).map(([k, v]) => ({
        label: statusLabels[k] || k,
        value: v,
        color: statusColors[k] || statusColors.other
    })) : [];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
        >
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                        <ShoppingBag className="text-yellow-400" size={32} />
                        Mercado Livre
                    </h2>
                    <p className="text-slate-400 text-sm">Análise de vendas, devoluções e recebimentos.</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${isConnected
                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-yellow-400 animate-pulse' : 'bg-slate-600'}`} />
                    {isConnected ? 'Conta Vinculada' : 'Não Vinculado'}
                </div>
            </header>

            {/* Credentials */}
            <div className="glass-card border-yellow-500/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500" />
                <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-white">🔐 Credenciais de Acesso</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">App ID</label>
                        <input type="text" value={appId} onChange={e => setAppId(e.target.value)} placeholder="Seu App ID"
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400/50" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Secret Key</label>
                        <input type="password" value={secretKey} onChange={e => setSecretKey(e.target.value)} placeholder="Sua Secret Key"
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400/50" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Access Token</label>
                        <input type="text" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="APP_USR-..."
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400/50" />
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <a href="https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao" target="_blank" rel="noopener noreferrer"
                        className="text-xs text-yellow-400/70 hover:text-yellow-400 hover:underline flex items-center gap-1 transition-colors">
                        Como obter meu Access Token? <ExternalLink size={11} />
                    </a>
                    <button onClick={handleSaveCredentials}
                        className="px-5 py-2 rounded-xl font-bold bg-yellow-500 hover:bg-yellow-600 text-black text-sm shadow-lg transition-all">
                        Salvar
                    </button>
                </div>
            </div>

            {/* Date Filter */}
            <div className="glass-card">
                <h3 className="text-base font-bold mb-4 text-white flex items-center gap-2">
                    <Calendar size={18} className="text-blue-400" /> Filtrar por Período
                </h3>
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">De:</label>
                        <input type="date" value={dateFrom} max={todayStr} onChange={e => setDateFrom(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400/50" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Até:</label>
                        <input type="date" value={dateTo} max={todayStr} onChange={e => setDateTo(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400/50" />
                    </div>
                    <button onClick={fetchMLData} disabled={loading}
                        className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl text-sm flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-yellow-500/20">
                        {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                        {loading ? 'Carregando...' : 'Buscar Dados'}
                    </button>
                </div>
                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm">
                        <AlertTriangle size={16} /> {error}
                    </div>
                )}
            </div>

            {/* Results */}
            {mlData && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                            className="glass-card p-5 border-emerald-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full" />
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><TrendingUp size={18} /></div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Vendas</p>
                            </div>
                            <h3 className="text-3xl font-bold text-emerald-400">{mlData.totalSales}</h3>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <ArrowUpRight size={12} className="text-emerald-400" /> pedidos no período
                            </p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="glass-card p-5 border-yellow-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-bl-full" />
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400"><DollarSign size={18} /></div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Vendido</p>
                            </div>
                            <h3 className="text-2xl font-bold text-yellow-400">
                                R$ {mlData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">valor bruto total</p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="glass-card p-5 border-blue-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full" />
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><CheckCircle2 size={18} /></div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">A Receber</p>
                            </div>
                            <h3 className="text-2xl font-bold text-blue-400">
                                R$ {mlData.pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">pagos / em processo</p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="glass-card p-5 border-red-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-bl-full" />
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-red-500/10 rounded-lg text-red-400"><Package size={18} /></div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Devoluções</p>
                            </div>
                            <h3 className="text-3xl font-bold text-red-400">{mlData.devolutions}</h3>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <ArrowDownRight size={12} className="text-red-400" /> {mlData.openClaims} reclamações abertas
                            </p>
                        </motion.div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Revenue Bar Chart */}
                        <div className="glass-card md:col-span-2">
                            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                <TrendingUp size={18} className="text-yellow-400" /> Receita por Dia (R$)
                            </h3>
                            {mlData.dailyRevenue.length > 0 ? (
                                <BarChart data={mlData.dailyRevenue} colorClass="bg-yellow-400" />
                            ) : (
                                <p className="text-slate-500 italic text-sm text-center py-8">Sem dados no período.</p>
                            )}
                        </div>

                        {/* Status Donut */}
                        <div className="glass-card flex flex-col items-center justify-center">
                            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                <Package size={18} className="text-blue-400" /> Status dos Pedidos
                            </h3>
                            {donutSegments.length > 0 ? (
                                <DonutChart segments={donutSegments} size={140} />
                            ) : (
                                <p className="text-slate-500 italic text-sm text-center py-8">Sem pedidos.</p>
                            )}
                        </div>
                    </div>

                    {/* Sales Count Bar Chart */}
                    <div className="glass-card">
                        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <ShoppingBag size={18} className="text-emerald-400" /> Vendas por Dia (Quantidade)
                        </h3>
                        {mlData.dailyCount.length > 0 ? (
                            <BarChart data={mlData.dailyCount} colorClass="bg-emerald-400" />
                        ) : (
                            <p className="text-slate-500 italic text-sm text-center py-8">Sem dados no período.</p>
                        )}
                    </div>

                    {/* Recent Orders Table */}
                    <div className="glass-card overflow-hidden">
                        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp size={18} className="text-emerald-400" /> Últimas Vendas
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Pedido</th>
                                        <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Status</th>
                                        <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase">Data</th>
                                        <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {mlData.recentOrders.map((order, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 text-slate-400 font-mono text-xs">#{order.id}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${order.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                                            'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {statusLabels[order.status] || order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-xs">
                                                {new Date(order.date_created).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-white">
                                                R$ {(order.total_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                    {mlData.recentOrders.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-12 text-center text-slate-500 italic">
                                                Nenhuma venda encontrada no período.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Claims */}
                    {mlData.recentClaims.length > 0 && (
                        <div className="glass-card border-red-500/20">
                            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                                <Package size={18} className="text-red-400" /> Reclamações / Devoluções
                            </h3>
                            <div className="space-y-3">
                                {mlData.recentClaims.map((claim, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                                        <div>
                                            <p className="text-sm font-medium text-white">Reclamação #{claim.id}</p>
                                            <p className="text-xs text-slate-400">{claim.type} — {claim.stage}</p>
                                        </div>
                                        <span className="text-xs text-red-400 font-bold bg-red-500/10 px-3 py-1 rounded-full">{claim.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {!mlData && !loading && (
                <div className="glass-card text-center py-20">
                    <ShoppingBag size={56} className="text-yellow-400/20 mx-auto mb-5" />
                    <p className="text-white font-bold text-lg mb-2">Pronto para analysar suas vendas?</p>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                        Configure seu <strong className="text-yellow-400">Access Token</strong>, escolha o período e clique em <strong className="text-white">"Buscar Dados"</strong> para ver seus gráficos e métricas.
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export default MercadoLivreTab;
