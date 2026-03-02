import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Plus, Check, Pencil, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AccountSwitcher = ({ accounts, activeAccountId, onSwitch, onAdd, onRename, onRemove }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');

    const activeAccount = accounts.find(a => a.id === activeAccountId);

    const handleAdd = () => {
        if (!newAccountName.trim()) return;
        onAdd(newAccountName.trim());
        setNewAccountName('');
        setShowAddModal(false);
    };

    const handleRenameSubmit = (id) => {
        if (editingName.trim()) onRename(id, editingName.trim());
        setEditingId(null);
    };

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => setOpen(!open)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                    <div className="w-7 h-7 rounded-lg bg-whatsapp/20 flex items-center justify-center text-whatsapp text-xs font-bold uppercase flex-shrink-0">
                        {activeAccount?.name?.substring(0, 2) || '?'}
                    </div>
                    <span className="flex-1 text-left text-sm font-medium text-white truncate">
                        {activeAccount?.name || t('accounts.select')}
                    </span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full mt-2 left-0 right-0 z-50 glass rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                        >
                            <div className="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
                                {accounts.map(acc => (
                                    <div key={acc.id} className={`flex items-center gap-2 px-2 py-2 rounded-lg group ${acc.id === activeAccountId ? 'bg-whatsapp/10' : 'hover:bg-white/5'}`}>
                                        {editingId === acc.id ? (
                                            <input
                                                autoFocus
                                                value={editingName}
                                                onChange={e => setEditingName(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(acc.id); if (e.key === 'Escape') setEditingId(null); }}
                                                onBlur={() => handleRenameSubmit(acc.id)}
                                                className="flex-1 bg-white/10 rounded px-2 py-0.5 text-sm text-white outline-none border border-whatsapp/50"
                                            />
                                        ) : (
                                            <button
                                                className="flex-1 text-left text-sm font-medium text-white flex items-center gap-2"
                                                onClick={() => { onSwitch(acc.id); setOpen(false); }}
                                            >
                                                {acc.id === activeAccountId && <Check size={12} className="text-whatsapp flex-shrink-0" />}
                                                <span className="truncate">{acc.name}</span>
                                            </button>
                                        )}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditingId(acc.id); setEditingName(acc.name); }}
                                                className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                            {accounts.length > 1 && (
                                                <button
                                                    onClick={() => { onRemove(acc.id); setOpen(false); }}
                                                    className="p-1 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-white/5 p-1.5">
                                <button
                                    onClick={() => { setShowAddModal(true); setOpen(false); }}
                                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    <Plus size={14} />
                                    {t('accounts.addBtn')}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modal de nova conta */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowAddModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative z-10 glass-card w-full max-w-sm border-white/20"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">{t('accounts.modal.title')}</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400">
                                    <X size={16} />
                                </button>
                            </div>
                            <p className="text-sm text-slate-400 mb-4">{t('accounts.modal.desc')}</p>
                            <input
                                autoFocus
                                type="text"
                                placeholder={t('accounts.modal.placeholder')}
                                value={newAccountName}
                                onChange={e => setNewAccountName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-whatsapp/50 transition-colors mb-4"
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 text-sm font-medium transition-colors">
                                    {t('accounts.modal.cancel')}
                                </button>
                                <button onClick={handleAdd} className="flex-1 py-2.5 bg-whatsapp hover:bg-whatsapp-dark rounded-xl text-white text-sm font-bold transition-colors">
                                    {t('accounts.modal.createBtn')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AccountSwitcher;
