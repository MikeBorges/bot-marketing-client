import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileTab = ({ userEmail, userName, API_URL, addNotification }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const [formData, setFormData] = useState({
        name: localStorage.getItem('userName') || userName || '',
        email: userEmail || '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSaved(false);

        try {
            const response = await fetch(`${API_URL}/auth/update-profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentEmail: userEmail,
                    ...formData
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const updatedUser = data.user;

                // Update local storage and app state if necessary
                localStorage.setItem('userEmail', updatedUser.email);
                localStorage.setItem('userName', updatedUser.name);

                setSaved(true);
                addNotification(t('profile.success'), 'success');

                // Clear password field after success
                setFormData(prev => ({ ...prev, password: '' }));

                // Optional: If email changed, user might need to re-login or app needs refreshing
                if (updatedUser.email !== userEmail) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            } else {
                addNotification(data.error || 'Erro ao atualizar perfil', 'error');
            }
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            addNotification('Erro de conexão ao atualizar perfil', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4">
                    <div className="space-y-5">
                        {/* Nome */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                <User size={16} style={{ color: 'var(--accent)' }} />
                                {t('profile.nameLabel')}
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-2xl px-5 py-3.5 text-base focus:outline-none transition-all shadow-sm"
                                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                required
                            />
                        </div>

                        {/* E-mail */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                <Mail size={16} style={{ color: 'var(--accent)' }} />
                                {t('profile.emailLabel')}
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full rounded-2xl px-5 py-3.5 text-base focus:outline-none transition-all shadow-sm"
                                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                required
                            />
                        </div>

                        {/* Senha */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                                <Lock size={16} style={{ color: 'var(--accent)' }} />
                                {t('profile.passwordLabel')}
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full rounded-2xl px-5 py-3.5 text-base focus:outline-none transition-all shadow-sm"
                                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            style={{
                                background: saved ? 'rgba(52,211,153,0.1)' : 'var(--accent)',
                                border: saved ? '1px solid rgba(52,211,153,0.2)' : 'none',
                                color: saved ? 'var(--mint)' : 'white'
                            }}
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : saved ? (
                                <CheckCircle2 size={18} />
                            ) : (
                                <Save size={18} />
                            )}
                            {loading ? t('profile.updating') : saved ? t('profile.success') : t('profile.saveBtn')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Hint Chip */}
            <div className="flex gap-3 items-start p-4 rounded-xl" style={{ background: 'rgba(124,111,255,0.05)', border: '1px solid rgba(124,111,255,0.1)' }}>
                <User size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {t('profile.subtitle')} As alterações feitas aqui serão aplicadas a todos os seus dados no sistema.
                </p>
            </div>
        </div>
    );
};

export default ProfileTab;
