import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageIcon, Tag, Percent, AlignLeft, CheckCircle2, Plus, X, Smile } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

const PromoConfig = ({ autoConfig, setAutoConfig, handleSaveConfig }) => {
    const { t } = useTranslation();
    const [couponInput, setCouponInput] = useState('');
    const [couponDetails, setCouponDetails] = useState({ discount: '', minPurchase: '', validity: '', maxDiscount: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleFrameUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            setAutoConfig({
                ...autoConfig,
                promoConfig: { ...autoConfig.promoConfig, frameImage: base64 }
            });
        };
        reader.readAsDataURL(file);
    };

    const openModal = (index = null) => {
        if (index !== null) {
            const cp = autoConfig.promoConfig?.coupons[index];
            setEditingIndex(index);
            if (typeof cp === 'string') {
                setCouponInput(cp);
                setCouponDetails({ discount: '', minPurchase: '', validity: '', maxDiscount: '' });
            } else {
                setCouponInput(cp.code);
                setCouponDetails({
                    discount: cp.discount || '',
                    minPurchase: cp.minPurchase || '',
                    validity: cp.validity || '',
                    maxDiscount: cp.maxDiscount || ''
                });
            }
        } else {
            setEditingIndex(null);
            setCouponInput('');
            setCouponDetails({ discount: '', minPurchase: '', validity: '', maxDiscount: '' });
        }
        setIsModalOpen(true);
    };

    const saveCoupon = () => {
        if (!couponInput.trim()) return;
        const currentCoupons = [...(autoConfig.promoConfig?.coupons || [])];
        const code = couponInput.trim().toUpperCase();
        const newCoupon = { code, ...couponDetails };

        if (editingIndex !== null) {
            currentCoupons[editingIndex] = newCoupon;
        } else {
            // Verifica se já existe para novos
            if (currentCoupons.some(c => (typeof c === 'string' ? c : c.code) === code)) {
                alert("Este código de cupom já existe!");
                return;
            }
            currentCoupons.push(newCoupon);
        }

        setAutoConfig({
            ...autoConfig,
            promoConfig: {
                ...autoConfig.promoConfig,
                coupons: currentCoupons
            }
        });
        setIsModalOpen(false);
    };

    const removeCoupon = (cpCode) => {
        const currentCoupons = autoConfig.promoConfig?.coupons || [];
        setAutoConfig({
            ...autoConfig,
            promoConfig: {
                ...autoConfig.promoConfig,
                coupons: currentCoupons.filter(c => (typeof c === 'string' ? c : c.code) !== cpCode)
            }
        });
    };

    const config = autoConfig.promoConfig || {
        inflatePercent: 30,
        coupons: [],
        frameImage: '',
        promoMessage: '🔥 PROMOÇÃO IMPERDÍVEL!\n\n📦 {titulo}\n\n💰 De: R$ {precoOriginal}\n✅ Por apenas: R$ {precoPromo}\n\n🎟️ Cupom: {cupom}\n\n🔗 Compre aqui: {link}'
    };

    return (
        <div className="glass-card p-6 border-white/10">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <Tag className="text-orange-400" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Configuração do Chatbot (Promoções)</h3>
                    <p className="text-xs text-slate-400">Personalize como o bot gera ofertas ao receber links no chat</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Coluna Esquerda: Valores e Moldura */}
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                            <Percent size={14} /> % Inflação de Preço (Preço "De:")
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={config.inflatePercent}
                                onChange={(e) => setAutoConfig({
                                    ...autoConfig,
                                    promoConfig: { ...config, inflatePercent: parseInt(e.target.value) }
                                })}
                                className="flex-1 accent-whatsapp"
                            />
                            <span className="text-sm font-bold text-white w-10">{config.inflatePercent}%</span>
                        </div>
                        <p className="text-[10px] text-slate-500 italic">O preço original será exibido {config.inflatePercent}% mais caro no chat.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                            <ImageIcon size={14} /> Moldura da Imagem (PNG)
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg bg-black/40 border border-dashed border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                {config.frameImage ? (
                                    <img src={config.frameImage} alt="Frame" className="w-full h-full object-contain" />
                                ) : (
                                    <ImageIcon className="text-slate-700" size={24} />
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/png"
                                    onChange={handleFrameUpload}
                                    id="frame-upload"
                                    className="hidden"
                                />
                                <label
                                    htmlFor="frame-upload"
                                    className="inline-block px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                                >
                                    Selecionar Moldura
                                </label>
                                {config.frameImage && (
                                    <button
                                        onClick={() => setAutoConfig({ ...autoConfig, promoConfig: { ...config, frameImage: '' } })}
                                        className="ml-2 text-[10px] text-red-400 hover:underline"
                                    >
                                        Remover
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <Tag size={14} /> Meus Cupons
                            </label>
                            <button
                                onClick={() => openModal()}
                                className="px-3 py-1.5 bg-whatsapp/10 hover:bg-whatsapp/20 text-whatsapp border border-whatsapp/20 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                            >
                                <Plus size={14} /> Novo Cupom
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                            {config.coupons.length === 0 ? (
                                <div className="bg-black/20 border border-white/5 rounded-xl p-6 text-center">
                                    <Tag className="mx-auto text-slate-700 mb-2" size={24} />
                                    <p className="text-xs text-slate-500 italic">Nenhum cupom configurado.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {config.coupons.map((cp, i) => {
                                        const code = typeof cp === 'string' ? cp : cp.code;
                                        const discount = typeof cp === 'object' ? cp.discount : '';
                                        return (
                                            <div key={i} className="flex items-center justify-between gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-whatsapp/30 transition-all group">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-whatsapp">{code}</span>
                                                    {discount && <span className="text-[10px] text-slate-400">{discount}</span>}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openModal(i)}
                                                        className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                                                        title="Editar"
                                                    >
                                                        <AlignLeft size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => removeCoupon(code)}
                                                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                                                        title="Excluir"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna Direita: Mensagem */}
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                            <AlignLeft size={14} /> Modelo da Mensagem do Chatbot
                        </label>
                        <textarea
                            value={config.promoMessage}
                            onChange={(e) => setAutoConfig({
                                ...autoConfig,
                                promoConfig: { ...config, promoMessage: e.target.value }
                            })}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-whatsapp/50 h-32 resize-none"
                            placeholder="Sua mensagem..."
                        />
                        <div className="flex flex-wrap gap-2">
                            {['{titulo}', '{precoOriginal}', '{precoPromo}', '{cupom}', '{cupom_desconto}', '{cupom_minimo}', '{cupom_maximo}', '{cupom_validade}', '{link}'].map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setAutoConfig({
                                        ...autoConfig,
                                        promoConfig: { ...config, promoMessage: config.promoMessage + ' ' + tag }
                                    })}
                                    className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-slate-400 hover:text-whatsapp transition-colors"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>

                        {/* Emoji Picker */}
                        <div className="pt-2 border-t border-white/5 space-y-2 relative">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                    <span className="text-xs">😊</span> Emojis
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className={`p-1.5 rounded-lg transition-all ${showEmojiPicker ? 'bg-whatsapp text-white' : 'hover:bg-white/10 text-slate-400'}`}
                                    title="Abrir Seletor de Emojis"
                                >
                                    <Smile size={18} />
                                </button>
                            </div>

                            {showEmojiPicker && (
                                <div className="absolute bottom-full right-0 mb-4 z-[100] shadow-2xl animate-in fade-in zoom-in duration-200">
                                    <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                                    <div className="relative">
                                        <EmojiPicker
                                            onEmojiClick={(emojiData) => {
                                                setAutoConfig({
                                                    ...autoConfig,
                                                    promoConfig: { ...config, promoMessage: config.promoMessage + emojiData.emoji }
                                                });
                                                // We keep it open if the user wants to add multiple emojis
                                            }}
                                            theme={Theme.DARK}
                                            lazyLoadEmojis={true}
                                            searchPlaceholder="Procurar emoji..."
                                            width={320}
                                            height={400}
                                            skinTonesDisabled
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSaveConfig}
                            className="flex items-center gap-2 px-4 py-2 bg-whatsapp/10 hover:bg-whatsapp/20 border border-whatsapp/20 text-whatsapp rounded-xl text-xs font-bold transition-all"
                        >
                            <CheckCircle2 size={14} />
                            Salvar Configurações
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de Configuração de Cupom */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Tag className="text-whatsapp" size={20} />
                                    {editingIndex !== null ? 'Editar Cupom' : 'Novo Cupom'}
                                </h4>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Código do Cupom</label>
                                    <input
                                        type="text"
                                        value={couponInput}
                                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                        placeholder="Ex: PROMO10"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-whatsapp/50 transition-all font-bold tracking-wider"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Desconto</label>
                                        <input
                                            type="text"
                                            value={couponDetails.discount}
                                            onChange={(e) => setCouponDetails({ ...couponDetails, discount: e.target.value })}
                                            placeholder="Ex: 10% OFF"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-whatsapp/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Compra Mínima</label>
                                        <input
                                            type="text"
                                            value={couponDetails.minPurchase}
                                            onChange={(e) => setCouponDetails({ ...couponDetails, minPurchase: e.target.value })}
                                            placeholder="Ex: Acima de R$ 100"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-whatsapp/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Validade</label>
                                        <input
                                            type="text"
                                            value={couponDetails.validity}
                                            onChange={(e) => setCouponDetails({ ...couponDetails, validity: e.target.value })}
                                            placeholder="Ex: Expira hoje"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-whatsapp/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Desconto Máximo</label>
                                        <input
                                            type="text"
                                            value={couponDetails.maxDiscount}
                                            onChange={(e) => setCouponDetails({ ...couponDetails, maxDiscount: e.target.value })}
                                            placeholder="Ex: R$ 50"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-whatsapp/50 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={saveCoupon}
                                    className="flex-1 px-4 py-3 bg-whatsapp text-white hover:bg-whatsapp-dark rounded-xl text-sm font-bold transition-all shadow-lg shadow-whatsapp/20"
                                >
                                    {editingIndex !== null ? 'Salvar Mudanças' : 'Criar Cupom'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromoConfig;
