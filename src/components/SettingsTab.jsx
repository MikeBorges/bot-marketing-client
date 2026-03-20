import React from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, CheckCircle2, AlertCircle, ShoppingBag, Save, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileTab from './ProfileTab';

const SettingsTab = (props) => {
    console.log('[SettingsTab] Full Props:', props);
    const { onRenewPlan, status, qrCode, handleLogout, config, onSaveConfig, userEmail, userName, API_URL, addNotification, userPlan, planExpiresAt, userRole, socket } = props;
    const { t } = useTranslation();
    const [activeSubTab, setActiveSubTab] = React.useState('connection');
    const [mlConfig, setMlConfig] = React.useState({
        appId: config?.mercadolivre?.appId || '',
        secretKey: config?.mercadolivre?.secretKey || '',
        accessToken: config?.mercadolivre?.accessToken || ''
    });

    const handleSaveML = () => {
        onSaveConfig({
            ...config,
            mercadolivre: mlConfig
        });
    };

    let subTabs = [
        { id: 'connection', label: 'WhatsApp', icon: QrCode },
        { id: 'profile', label: t('menu.profile'), icon: User },
        { id: 'integrations', label: 'Mercado Livre', icon: ShoppingBag },
    ];

    if (userPlan === 'basic') {
        subTabs = subTabs.filter(tab => tab.id !== 'integrations');
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-6xl mx-auto space-y-6"
        >
            <header>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>{t('menu.config')}</p>
                <h2 className="text-2xl font-bold heading-lg" style={{ color: 'var(--text-primary)' }}>{t('settings.title')}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('settings.subtitle')}</p>
            </header>

            {/* Sub-tabs Navigation */}
            <div className="flex p-1.5 gap-1.5 rounded-2xl bg-white/5 border border-white/10">
                {subTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeSubTab === tab.id
                            ? 'bg-accent/10 text-accent border border-accent/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeSubTab === 'connection' && (
                    <motion.div
                        key="connection"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="w-full space-y-6"
                    >
                        <div className="glass-card">
                            <div className="flex items-center gap-2 mb-4">
                                <QrCode size={15} style={{ color: 'var(--accent)' }} />
                                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>WhatsApp</h3>
                            </div>

                            {(status === 'Conectado' || status === 'connected' || status === 'Ativo') ? (
                                <div className="flex items-center justify-between p-6 rounded-2xl" style={{ background: 'rgba(37,211,102,0.1)', border: '2px solid rgba(37,211,102,0.4)', boxShadow: '0 0 25px rgba(37,211,102,0.15)' }}>
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(37,211,102,0.2)' }}>
                                            <CheckCircle2 size={28} style={{ color: '#25d366' }} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold" style={{ color: '#25d366' }}>{t('settings.connected')}</p>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>O seu WhatsApp está sincronizado e operante.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-red-500/20"
                                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ff4d4d' }}
                                    >
                                        {t('settings.disconnectBtn')}
                                    </button>
                                </div>
                            ) : qrCode ? (
                                <div className="flex flex-col items-center py-4 gap-4">
                                    <div className="bg-white p-3 rounded-2xl shadow-2xl inline-block ring-4 ring-white/5">
                                        <img src={qrCode} alt="WhatsApp QR Code" className="w-40 h-40" />
                                    </div>
                                    <p className="text-center text-sm max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                                        {t('settings.scanDesc')}
                                    </p>
                                    <button
                                        onClick={() => { window.alert('Solicitando Reset Nuclear no servidor...'); socket?.emit('force_qr'); }}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                        style={{ background: 'rgba(124,111,255,0.1)', border: '1px solid rgba(124,111,255,0.3)', color: 'var(--accent)' }}
                                    >
                                        🔄 Gerar novo QR Code
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                                        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin shrink-0" style={{ borderColor: 'rgba(124,111,255,0.4)', borderTopColor: 'var(--accent)' }} />
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('settings.waiting')}</p>
                                    </div>
                                    <button
                                        onClick={() => { window.alert('Solicitando Reset Nuclear no servidor...'); socket?.emit('force_qr'); }}
                                        className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                        style={{ background: 'rgba(124,111,255,0.1)', border: '1px solid rgba(124,111,255,0.3)', color: 'var(--accent)' }}
                                    >
                                        🔄 Forçar QR Code
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeSubTab === 'profile' && (
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="w-full glass-card"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <User size={15} style={{ color: 'var(--accent)' }} />
                            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('menu.profile')}</h3>
                        </div>

                        <ProfileTab
                            userEmail={userEmail}
                            userName={userName}
                            planExpiresAt={planExpiresAt}
                            userRole={userRole}
                            onRenewPlan={props.onRenewPlan}
                            API_URL={API_URL}
                            addNotification={addNotification}
                        />
                    </motion.div>
                )}

                {activeSubTab === 'integrations' && (
                    <motion.div
                        key="integrations"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="w-full glass-card"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <ShoppingBag size={15} style={{ color: 'var(--accent)' }} />
                            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Mercado Livre</h3>
                            <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                Em desenvolvimento
                            </span>
                        </div>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                            Configure as credenciais para integrar com o Mercado Livre.
                        </p>

                        <div className="space-y-3">
                            {[
                                { label: 'App ID', key: 'appId', type: 'text', placeholder: 'Seu App ID do ML' },
                                { label: 'Secret Key', key: 'secretKey', type: 'password', placeholder: 'Sua Secret Key' },
                                { label: 'Access Token', key: 'accessToken', type: 'text', placeholder: 'APP_USR-...' },
                            ].map(field => (
                                <div key={field.key}>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{field.label}</label>
                                    <input
                                        type={field.type}
                                        value={mlConfig[field.key]}
                                        onChange={e => setMlConfig({ ...mlConfig, [field.key]: e.target.value })}
                                        placeholder={field.placeholder}
                                        className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
                                        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                            ))}

                            <div className="pt-3 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
                                <button
                                    onClick={handleSaveML}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                    style={{ background: 'rgba(124,111,255,0.1)', border: '1px solid rgba(124,111,255,0.2)', color: 'var(--accent)' }}
                                >
                                    <Save size={14} />
                                    Salvar Credenciais
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SettingsTab;
