import React from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, CheckCircle2, AlertCircle, ShoppingBag, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsTab = ({ status, qrCode, handleLogout, config, onSaveConfig }) => {
    const { t } = useTranslation();
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
        // We'll rely on App.jsx notification
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="max-w-2xl space-y-6"
        >
            <header>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>{t('menu.config')}</p>
                <h2 className="text-2xl font-bold heading-lg" style={{ color: 'var(--text-primary)' }}>{t('settings.title')}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('settings.subtitle')}</p>
            </header>

            {/* ── Conexão WhatsApp ── */}
            <div className="glass-card">
                <div className="flex items-center gap-2 mb-4">
                    <QrCode size={15} style={{ color: 'var(--accent)' }} />
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('settings.connection')}</h3>
                </div>

                {status === 'Conectado' ? (
                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.15)' }}>
                                <CheckCircle2 size={20} style={{ color: 'var(--mint)' }} />
                            </div>
                            <div>
                                <p className="text-sm font-bold" style={{ color: 'var(--mint)' }}>{t('settings.connected')}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>WhatsApp Web ativo</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
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
                    </div>
                ) : (
                    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin shrink-0" style={{ borderColor: 'rgba(124,111,255,0.4)', borderTopColor: 'var(--accent)' }} />
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('settings.waiting')}</p>
                    </div>
                )}
            </div>

            {/* ── Mercado Livre ── */}
            <div className="glass-card">
                <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag size={15} style={{ color: 'var(--text-secondary)' }} />
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Integração Mercado Livre</h3>
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
            </div>
        </motion.div>
    );
};

export default SettingsTab;

