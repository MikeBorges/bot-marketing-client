import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Tag, Send } from 'lucide-react';

const PromoEditModal = ({ isOpen, onClose, editData, onGenerate }) => {
    const { t } = useTranslation();

    const [originalPriceInput, setOriginalPriceInput] = useState('');
    const [selectedCoupon, setSelectedCoupon] = useState('');
    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        if (isOpen && editData) {
            setOriginalPriceInput(editData.suggestedOriginalPrice?.toString() || '');
            const rawCoupon = editData.config?.coupons?.[0] || '';
            // Extrai o code se for objeto, ou usa a string diretamente
            const defaultCoupon = typeof rawCoupon === 'object' ? rawCoupon.code : rawCoupon;
            setSelectedCoupon(defaultCoupon);
            setImagePreview(editData.product?.image || '');
        }
    }, [isOpen, editData]);

    // Lidar com Ctrl+V (Colar Imagem)
    useEffect(() => {
        const handlePaste = (e) => {
            if (!isOpen) return;
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        setImagePreview(event.target.result);
                    };
                    reader.readAsDataURL(blob);
                    break;
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen]);

    if (!isOpen || !editData) return null;

    const handleGenerate = () => {
        onGenerate({
            url: editData.url,
            productData: editData.product,
            customImageBase64: imagePreview !== editData.product?.image ? imagePreview : null,
            customOriginalPrice: parseFloat(originalPriceInput || editData.suggestedOriginalPrice),
            coupon: selectedCoupon
        });
        onClose();
    };

    const coupons = editData.config?.coupons || [];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card w-full max-w-md bg-[#1a1c23] border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                                <Tag size={16} />
                            </div>
                            <h3 className="font-bold text-white">Editar Promoção</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
                        {/* Imagem */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase">
                                <ImageIcon size={14} /> Imagem do Produto
                            </label>
                            <div className="relative group rounded-xl overflow-hidden bg-black/40 border border-white/5 aspect-square flex items-center justify-center">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <ImageIcon size={32} className="text-slate-600" />
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center p-4">
                                    <p className="text-sm font-bold text-white mb-1">Dê <kbd className="px-1 py-0.5 bg-white/20 rounded text-xs">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-white/20 rounded text-xs">V</kbd></p>
                                    <p className="text-xs text-slate-300">Para colar uma nova imagem e substituir esta.</p>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500 text-center uppercase tracking-wider">
                                {imagePreview !== editData.product?.image ? "✨ IMAGEM CUSTOMIZADA!" : "IMAGEM ORIGINAL DO SITE"}
                            </p>
                        </div>

                        {/* Preço De */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Preço "De" (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={originalPriceInput}
                                onChange={(e) => setOriginalPriceInput(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-whatsapp/50 outline-none"
                            />
                            <p className="text-[10px] text-slate-500 flex justify-between">
                                <span>Preço de Venda real: <strong className="text-white">R$ {editData.product?.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                            </p>
                        </div>

                        {/* Cupom */}
                        {coupons.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Cupom de Desconto</label>
                                <select
                                    value={selectedCoupon}
                                    onChange={(e) => setSelectedCoupon(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-whatsapp/50 outline-none"
                                >
                                    <option value="">Nenhum cupom</option>
                                    {coupons.map((cp, idx) => {
                                        const code = typeof cp === 'object' ? cp.code : cp;
                                        return (
                                            <option key={idx} value={code}>{code}</option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5 bg-black/20 mt-auto flex justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGenerate}
                            className="px-4 py-2 rounded-lg text-sm font-bold bg-whatsapp hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all hover:-translate-y-0.5"
                        >
                            <Send size={16} />
                            Gerar Promoção
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PromoEditModal;
