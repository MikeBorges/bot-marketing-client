import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MessageSquare, Target, Trash2, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import ScheduledMessages from './ScheduledMessages';
import PromoConfig from './PromoConfig';

const AutomationTab = ({
    groups,
    scheduledMessages,
    onAddScheduled,
    onEditScheduled,
    onDeleteScheduled,
    socket,
    autoConfig,
    setAutoConfig,
    handleSaveConfig,
    userPlan,
    API_URL,
    userEmail,
    addNotification,
    savedConfig
}) => {
    const { t } = useTranslation();
    const [activeSubTab, setActiveSubTab] = React.useState('campaigns');

    const subTabs = [
        { id: 'campaigns', label: t('scheduled.title') || 'Campanhas', icon: Clock },
        { id: 'chatbot', label: t('menu.chatbot') || 'Chatbot', icon: MessageSquare },
        { id: 'smartlink', label: t('automation.smartLink') || 'Link Inteligente', icon: Target },
    ];

    if (userPlan !== 'basic') {
        subTabs.push({ id: 'cleanup', label: t('automation.filtersAndCleanup') || 'Limpeza', icon: Trash2 });
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-6xl mx-auto space-y-6"
        >
            <header>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>{t('menu.automation')}</p>
                <h2 className="text-2xl font-bold heading-lg" style={{ color: 'var(--text-primary)' }}>{t('automation.title')}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('automation.subtitle')}</p>
            </header>

            {/* Sub-tabs Navigation */}
            <div className="flex p-1.5 gap-1.5 rounded-2xl bg-white/5 border border-white/10 overflow-x-auto no-scrollbar">
                {subTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeSubTab === tab.id
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
                {activeSubTab === 'campaigns' && (
                    <motion.div
                        key="campaigns"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="w-full"
                    >
                        <ScheduledMessages
                            groups={groups}
                            scheduledMessages={scheduledMessages}
                            onAdd={onAddScheduled}
                            onEdit={onEditScheduled}
                            onDelete={onDeleteScheduled}
                            socket={socket}
                        />
                    </motion.div>
                )}

                {activeSubTab === 'chatbot' && (
                    <motion.div
                        key="chatbot"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="w-full"
                    >
                        <PromoConfig
                            autoConfig={autoConfig}
                            setAutoConfig={setAutoConfig}
                            handleSaveConfig={handleSaveConfig}
                        />
                    </motion.div>
                )}

                {activeSubTab === 'smartlink' && (
                    <motion.div
                        key="smartlink"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="w-full glass-card"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Target size={15} style={{ color: 'var(--accent)' }} />
                            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('automation.smartLink')}</h3>
                        </div>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{t('automation.linkDesc')}</p>
                        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                            <code className="text-sm font-bold flex-1 truncate" style={{ color: 'var(--mint)' }}>
                                {`${API_URL}/join?u=${btoa(userEmail)}`}
                            </code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${API_URL}/join?u=${btoa(userEmail)}`);
                                    addNotification(t('toast.linkCopied'), 'success');
                                }}
                                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: 'var(--mint)' }}
                            >
                                {t('automation.copyBtn')}
                            </button>
                        </div>
                        {t('automation.autoRedirect') !== 'automation.autoRedirect' && (
                            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{t('automation.autoRedirect')}</p>
                        )}
                    </motion.div>
                )}

                {activeSubTab === 'cleanup' && (
                    <motion.div
                        key="cleanup"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="w-full glass-card"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Trash2 size={15} style={{ color: 'var(--accent)' }} />
                            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('automation.filtersAndCleanup')}</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('automation.inactivityCleanup')}</label>
                                <input
                                    type="number"
                                    value={autoConfig.inactivityDays || 0}
                                    onChange={(e) => setAutoConfig({ ...autoConfig, inactivityDays: parseInt(e.target.value) || 0 })}
                                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
                                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                />
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('automation.inactivityDesc')}</p>
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
                            <motion.button
                                onClick={handleSaveConfig}
                                animate={savedConfig ? { scale: [1, 1.03, 1] } : {}}
                                transition={{ duration: 0.3 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                                style={savedConfig
                                    ? { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: 'var(--mint)' }
                                    : { background: 'rgba(124,111,255,0.1)', border: '1px solid rgba(124,111,255,0.2)', color: 'var(--accent)' }}
                            >
                                <AnimatePresence mode="wait">
                                    {savedConfig ? (
                                        <motion.span key="saved" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="flex items-center gap-2">
                                            <CheckCircle2 size={14} />
                                            {t('automation.savedBtn')}
                                        </motion.span>
                                    ) : (
                                        <motion.span key="save" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>
                                            {t('automation.saveBtn')}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Common Legend / Footer */}
            <div className="flex gap-3 items-start p-4 rounded-xl" style={{ background: 'rgba(124,111,255,0.05)', border: '1px solid rgba(124,111,255,0.1)' }}>
                <AlertCircle size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{t('automation.logicTitle')}</strong> {t('automation.logicDesc')}
                </p>
            </div>
        </motion.div>
    );
};

export default AutomationTab;
