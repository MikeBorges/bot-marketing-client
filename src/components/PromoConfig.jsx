import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageIcon, Tag, Percent, AlignLeft, CheckCircle2 } from 'lucide-react';

const PromoConfig = ({ autoConfig, setAutoConfig, handleSaveConfig }) => {
    const { t } = useTranslation();
    const [couponInput, setCouponInput] = useState('');

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

    const addCoupon = () => {
        if (!couponInput.trim()) return;
        const currentCoupons = autoConfig.promoConfig?.coupons || [];
        if (!currentCoupons.includes(couponInput.trim().toUpperCase())) {
            setAutoConfig({
                ...autoConfig,
                promoConfig: {
                    ...autoConfig.promoConfig,
                    coupons: [...currentCoupons, couponInput.trim().toUpperCase()]
                }
            });
        }
        setCouponInput('');
    };

    const removeCoupon = (cp) => {
        const currentCoupons = autoConfig.promoConfig?.coupons || [];
        setAutoConfig({
            ...autoConfig,
            promoConfig: {
                ...autoConfig.promoConfig,
                coupons: currentCoupons.filter(c => c !== cp)
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

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                            <Tag size={14} /> Meus Cupons
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && addCoupon()}
                                placeholder="Ex: PROMO10"
                                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-whatsapp/50"
                            />
                            <button
                                onClick={addCoupon}
                                className="px-3 py-2 bg-whatsapp/10 text-whatsapp border border-whatsapp/20 rounded-lg text-xs font-bold"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {config.coupons.map((cp, i) => (
                                <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-slate-300">
                                    {cp}
                                    <button onClick={() => removeCoupon(cp)} className="text-slate-500 hover:text-red-400">×</button>
                                </div>
                            ))}
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
                            {['{titulo}', '{precoOriginal}', '{precoPromo}', '{cupom}', '{link}'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setAutoConfig({
                                        ...autoConfig,
                                        promoConfig: { ...config, promoMessage: config.promoMessage + ' ' + tag }
                                    })}
                                    className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-slate-400 hover:text-whatsapp"
                                >
                                    {tag}
                                </button>
                            ))}
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
        </div>
    );
};

export default PromoConfig;
