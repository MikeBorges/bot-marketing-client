import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, Lock, Save, Loader2, CheckCircle2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileTab = ({ userEmail, userName, planExpiresAt, userRole, onRenewPlan, API_URL, addNotification }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const [formData, setFormData] = useState({
        name: localStorage.getItem('userName') || userName || '',
        email: userEmail || '',
        password: ''
    });

    const isSuperAdmin = userRole === 'super_admin';

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

    const formatDate = (dateString) => {
        if (isSuperAdmin) return 'Vitalício';
        if (!dateString) return 'Indefinido';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Plan Info Chip */}
            <div className="p-4 rounded-2xl flex items-center justify-between border" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ 
                        background: isSuperAdmin ? 'rgba(124,111,255,0.1)' : (planExpiresAt && new Date(planExpiresAt) < new Date() ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)'), 
                        color: isSuperAdmin ? 'var(--accent)' : (planExpiresAt && new Date(planExpiresAt) < new Date() ? '#ef4444' : 'var(--mint)') 
                    }}>
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status da Assinatura</p>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                            {isSuperAdmin ? 'Acesso Administrativo' : (planExpiresAt && new Date(planExpiresAt) < new Date() ? 'Assinatura Vencida' : 'Plano Ativo')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{isSuperAdmin ? 'Assinatura' : 'Expira em'}</p>
                        <p className="text-sm font-mono font-bold" style={{ color: isSuperAdmin || !planExpiresAt ? 'var(--mint)' : 'var(--accent)' }}>
                            {formatDate(planExpiresAt)}
                        </p>
                    </div>
                    {!isSuperAdmin && (
                        <button
                            onClick={onRenewPlan}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-95 flex items-center gap-2"
                        >
                            <ShoppingBag size={14} />
                            Renovar
                        </button>
                    ) || (
                        <div className="absolute opacity-0 pointer-events-none">
                            {/* Dummy reference to ShoppingBag if needed, but imported in SettingsTab */}
                        </div>
                    )}
                </div>
            </div>

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
