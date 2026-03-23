import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Tag, Send, Plus } from 'lucide-react';

const PromoEditModal = ({ isOpen, onClose, editData, onGenerate }) => {
    const { t } = useTranslation();

    const [customTitleInput, setCustomTitleInput] = useState('');
    const [originalPriceInput, setOriginalPriceInput] = useState('');
    const [promoPriceInput, setPromoPriceInput] = useState('');
    const [freightInput, setFreightInput] = useState('');
    const [installmentsInput, setInstallmentsInput] = useState(1);
    const [installmentValueInput, setInstallmentValueInput] = useState('');
    const [interestFree, setInterestFree] = useState(true);
    const [showInstallments, setShowInstallments] = useState(true);
    const [showCouponInMessage, setShowCouponInMessage] = useState(true);

    const [selectedCoupon, setSelectedCoupon] = useState('');
    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        if (isOpen && editData) {
            setCustomTitleInput(editData.product?.title || '');
            setOriginalPriceInput(editData.suggestedOriginalPrice?.toString() || '');
            setPromoPriceInput(editData.product?.price?.toString() || '');
            setFreightInput('');
            setInstallmentsInput(editData.product?.installmentCount || 12);
            setInstallmentValueInput(editData.product?.installmentValue?.toString() || '');
            setInterestFree(editData.product?.interestFree ?? true);

            const rawCoupon = editData.config?.coupons?.[0] || '';
            // Extrai o code se for objeto, ou usa a string diretamente
            const defaultCoupon = typeof rawCoupon === 'object' ? rawCoupon.code : rawCoupon;
            setSelectedCoupon(defaultCoupon);
            setImagePreview(editData.product?.image || '');
        }
    }, [isOpen, editData]);

    // Cálculo automático de parcelas se for SEM JUROS
    useEffect(() => {
        if (interestFree) {
            const price = parseFloat(promoPriceInput) || 0;
            const count = parseInt(installmentsInput) || 1;
            if (price > 0 && count > 0) {
                const val = (price / count).toFixed(2);
                setInstallmentValueInput(val);
            }
        }
    }, [interestFree, promoPriceInput, installmentsInput]);

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
            productData: {
                ...editData.product,
                title: customTitleInput.trim() || editData.product.title
            },
            customImageBase64: imagePreview !== editData.product?.image ? imagePreview : null,
            customOriginalPrice: parseFloat(originalPriceInput || editData.suggestedOriginalPrice),
            customPromoPrice: parseFloat(promoPriceInput || editData.product?.price),
            customInstallments: installmentsInput,
            customInstallmentValue: parseFloat(installmentValueInput),
            freight: freightInput.trim(),
            interestFree: interestFree,
            coupon: selectedCoupon,
            showCouponInMessage: showCouponInMessage,
            showInstallments: showInstallments
        });
        onClose();
    };

    const coupons = editData.config?.coupons || [];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg bg-[#1a1c23] border border-white/10 shadow-2xl flex flex-col max-h-[90vh] rounded-[24px] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
                                <Tag size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Editar Promoção</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                        {/* Imagem */}
                        <div className="relative group rounded-2xl overflow-hidden bg-black/40 border border-white/5 aspect-[16/7] flex items-center justify-center">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                            ) : (
                                <ImageIcon size={32} className="text-slate-600" />
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center p-4">
                                <p className="text-sm font-bold text-white mb-1">Dê <kbd className="px-1 py-0.5 bg-white/20 rounded text-xs">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-white/20 rounded text-xs">V</kbd></p>
                                <p className="text-xs text-slate-300">Para colar uma nova imagem</p>
                            </div>
                        </div>

                        {/* Nome do Produto */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome do Produto</label>
                            <input
                                type="text"
                                value={customTitleInput}
                                onChange={(e) => setCustomTitleInput(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500/50 outline-none transition-all"
                            />
                        </div>

                        {/* Seção Preços */}
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                            <h4 className="text-sm font-bold text-white mb-2">Preços e Parcelamento</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 relative">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Preço Anterior (De R$)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={originalPriceInput}
                                            onChange={(e) => setOriginalPriceInput(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500/50 outline-none transition-all pr-32"
                                        />
                                        <div className="absolute right-2 top-1.5 flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setOriginalPriceInput(editData.product?.originalPrice?.toString() || originalPriceInput)}
                                                className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold text-slate-400 hover:text-blue-400 flex flex-col items-center gap-0.5 transition-all"
                                                title="Usar preço original do ML"
                                            >
                                                Original
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const current = parseFloat(promoPriceInput) || 0;
                                                    const inflated = (current * 1.2).toFixed(2);
                                                    setOriginalPriceInput(inflated);
                                                }}
                                                className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold text-slate-400 hover:text-orange-400 flex flex-col items-center gap-0.5 transition-all"
                                                title="Inflar 20% sobre o preço atual"
                                            >
                                                <Plus size={10} /> +20%
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Preço de Promoção (Por R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={promoPriceInput}
                                        onChange={(e) => setPromoPriceInput(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500/50 outline-none transition-all font-bold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nº de Parcelas</label>
                                    <input
                                        type="number"
                                        value={installmentsInput}
                                        onChange={(e) => setInstallmentsInput(parseInt(e.target.value) || 1)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500/50 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Valor da Parcela (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={installmentValueInput}
                                        readOnly={interestFree}
                                        onChange={(e) => setInstallmentValueInput(e.target.value)}
                                        className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all ${interestFree ? 'opacity-50 cursor-not-allowed border-emerald-500/20' : 'focus:border-orange-500/50'}`}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="interestFree"
                                    checked={interestFree}
                                    onChange={(e) => setInterestFree(e.target.checked)}
                                    className="w-5 h-5 rounded-lg border-white/10 bg-white/5 accent-orange-500"
                                />
                                <label htmlFor="interestFree" className="text-sm text-slate-300 font-bold cursor-pointer">
                                    Parcelamento SEM Juros?
                                </label>
                            </div>
                        </div>

                        {/* Seção Detalhes */}
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                            <h4 className="text-sm font-bold text-white mb-2">Detalhes da Promoção e Envio</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Tipo de Frete</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Grátis"
                                        value={freightInput}
                                        onChange={(e) => setFreightInput(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500/50 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Cupom de Desconto</label>
                                    <select
                                        value={selectedCoupon}
                                        onChange={(e) => setSelectedCoupon(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500/50 outline-none transition-all appearance-none"
                                    >
                                        <option value="">Nenhum cupom</option>
                                        {coupons.map((cp, idx) => {
                                            const code = typeof cp === 'object' ? cp.code : cp;
                                            return <option key={idx} value={code}>{code}</option>;
                                        })}
                                    </select>
                                </div>
                            </div>

                            {/* Opções de Exibição */}
                            <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Opções de Exibição de Mensagem</p>
                                
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="showCouponInMessage"
                                        checked={showCouponInMessage}
                                        onChange={(e) => setShowCouponInMessage(e.target.checked)}
                                        className="w-5 h-5 rounded-lg border-white/10 bg-white/5 accent-orange-500"
                                    />
                                    <label htmlFor="showCouponInMessage" className="text-xs text-slate-300 font-bold cursor-pointer">
                                        Exibir CUPOM no texto da mensagem?
                                    </label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="showInstallments"
                                        checked={showInstallments}
                                        onChange={(e) => setShowInstallments(e.target.checked)}
                                        className="w-5 h-5 rounded-lg border-white/10 bg-white/5 accent-orange-500"
                                    />
                                    <label htmlFor="showInstallments" className="text-xs text-slate-300 font-bold cursor-pointer">
                                        Exibir PARCELAMENTO na imagem e texto?
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGenerate}
                            className="px-8 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-slate-200 shadow-xl flex items-center gap-2 transition-all hover:-translate-y-0.5"
                        >
                            <Send size={18} />
                            Gerar Promoção
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PromoEditModal;
