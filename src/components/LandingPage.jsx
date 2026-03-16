import React from 'react';
import { motion } from 'framer-motion';
import {
    MessageSquare,
    Users,
    Target,
    Zap,
    Shield,
    BarChart3,
    ArrowRight,
    CheckCircle2,
    Play,
    Globe,
    Lock,
    X
} from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
    const features = [
        {
            title: "WhatsApp Multicontas",
            desc: "Gerencie múltiplas instâncias de WhatsApp em uma única interface organizada e intuitiva.",
            icon: MessageSquare,
            color: "var(--accent)"
        },
        {
            title: "Automação de Grupos",
            desc: "Criação e monitoramento automático de ciclos de grupos para garantir escala no seu marketing.",
            icon: Users,
            color: "var(--mint)"
        },
        {
            title: "Agendador de Campanhas",
            desc: "Programe suas ofertas e avisos para datas e horários estratégicos com suporte a imagens e links.",
            icon: Zap,
            color: "#8b5cf6"
        },
        {
            title: "Captura de Leads (Remarketing)",
            desc: "Extraia contatos automaticamente de seus grupos e construa uma base sólida para remarketing direto.",
            icon: Target,
            color: "#f43f5e"
        },
        {
            title: "Análise de Crescimento",
            desc: "Visualize o desempenho de seus grupos com gráficos detalhados de entradas, saídas e taxa de retenção.",
            icon: BarChart3,
            color: "#0ea5e9"
        },
        {
            title: "Segurança Anti-Spam",
            desc: "Sistemas inteligentes de delay e proteção para manter suas contas seguras e saudáveis.",
            icon: Shield,
            color: "#22c55e"
        }
    ];

    const steps = [
        { title: "Conecte", desc: "Escaneie o QR Code para vincular suas contas de WhatsApp com segurança." },
        { title: "Configure", desc: "Defina seus critérios de automação, mensagens de boas-vindas e metas de leads." },
        { title: "Escale", desc: "Assista sua base crescer enquanto o sistema gerencia seus grupos 24/7." }
    ];

    return (
        <div className="min-h-screen bg-[#0F1117] text-white selection:bg-purple-500/30 overflow-x-hidden">
            {/* Header / Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F1117]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
                            <Zap size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>OffeHub</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
                        <a href="#how-it-works" className="hover:text-white transition-colors">Como Funciona</a>
                        <a href="#plans" className="hover:text-white transition-colors">Planos</a>
                    </div>

                    <button
                        onClick={onGetStarted}
                        className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-sm transition-all shadow-lg shadow-purple-600/20 active:scale-95"
                    >
                        Entrar no Dashboard
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 blur-[130px] rounded-full -z-10" />
                <div className="absolute bottom-1/4 -left-20 w-[500px] h-[500px] bg-emerald-600/10 blur-[120px] rounded-full -z-10" />

                <div className="max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-purple-400 text-xs font-bold tracking-widest uppercase mb-6">
                            ⚡ Automação Inteligente para WhatsApp
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                            Escale seu Marketing de <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-emerald-400">Grupos como nunca antes</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                            O OffeHub é a solução definitiva para gerenciar leads, automação e campanhas em escala dentro do ecossistema do WhatsApp.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={onGetStarted}
                                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-black font-extrabold text-base hover:scale-105 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-white/10"
                            >
                                Começar Agora Grátis
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-base hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                <Play size={18} fill="currentColor" />
                                Ver Demonstração
                            </button>
                        </div>
                    </motion.div>

                    {/* App Preview Mockup */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-20 relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1117] via-transparent to-transparent z-10" />
                        <div className="p-2 bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm">
                            <div className="bg-[#1A1D27] rounded-2xl overflow-hidden border border-white/5">
                                <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/20" />
                                    </div>
                                    <div className="flex-1 flex justify-center">
                                        <div className="h-6 w-1/3 bg-white/5 rounded-full border border-white/5" />
                                    </div>
                                </div>
                                <div className="p-8 aspect-video flex flex-col items-center justify-center gap-6">
                                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-purple-500/30 flex items-center justify-center animate-pulse">
                                        <MessageSquare size={40} className="text-purple-500/50" />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-32 h-4 bg-white/10 rounded-full" />
                                        <div className="w-20 h-4 bg-white/10 rounded-full" />
                                    </div>
                                    <div className="w-full max-w-lg space-y-3">
                                        <div className="h-32 w-full bg-white/5 rounded-2xl border border-white/5" />
                                        <div className="h-16 w-3/4 bg-white/5 rounded-2xl border border-white/5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 px-6 relative">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black mb-4">Tudo o que você precisa <br /> para dominar o WhatsApp</h2>
                        <p className="text-slate-400">Ferramentas avançadas para quem leva o marketing a sério.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-4 group"
                            >
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ background: `${f.color}15`, color: f.color }}>
                                    <f.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold">{f.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-sm">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="py-24 px-6 bg-white/[0.02]">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black mb-4">Simples, Rápido e Eficiente</h2>
                        <p className="text-slate-400">Do zero ao monitoramento em menos de 2 minutos.</p>
                    </div>

                    <div className="relative space-y-12">
                        <div className="absolute left-[24px] top-8 bottom-8 w-px bg-gradient-to-b from-purple-600 to-transparent md:left-1/2" />

                        {steps.map((s, i) => (
                            <div key={i} className={`flex items-start gap-8 md:items-center ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                                <div className="relative z-10 w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center font-black text-xl shadow-lg shadow-purple-600/20 md:mx-auto">
                                    {i + 1}
                                </div>
                                <div className="flex-1 space-y-2 md:text-left overflow-hidden">
                                    <h3 className="text-2xl font-bold">{s.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="plans" className="py-24 px-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 blur-[120px] rounded-full -z-10" />

                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black mb-4">Planos que acompanham seu crescimento</h2>
                        <p className="text-slate-400">Escolha o plano ideal para o momento do seu negócio.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Basic */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col"
                        >
                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-2">Básico</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-bold text-slate-400">R$</span>
                                    <span className="text-4xl font-black">197,99</span>
                                    <span className="text-sm font-medium text-slate-500">/mês</span>
                                </div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {[
                                    "1 Conta WhatsApp",
                                    "Até 5 Grupos Monitorados",
                                    "Captura de até 50 Leads",
                                    "3 Agendamentos por dia",
                                    "Sem Chatbot / Promoções",
                                    "Suporte via Ticket",
                                    "Interface OffeHub Premium"
                                ].map((item, i) => (
                                    <li key={i} className={`flex items-center gap-3 text-sm ${item === "Sem Chatbot / Promoções" ? 'text-slate-500 italic' : 'text-slate-300'}`}>
                                        {item === "Sem Chatbot / Promoções" ? <X size={16} className="text-red-500/50" /> : <CheckCircle2 size={16} className="text-purple-500" />}
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={onGetStarted} className="w-full py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold transition-all">
                                Começar Agora
                            </button>
                        </motion.div>

                        {/* Intermediário */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="p-8 rounded-[2rem] bg-gradient-to-b from-purple-600/20 to-indigo-600/20 border-2 border-purple-500/50 flex flex-col relative"
                        >
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-purple-600/20">
                                Mais Popular
                            </div>
                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-2">Intermediário</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-bold text-slate-400">R$</span>
                                    <span className="text-4xl font-black">389,99</span>
                                    <span className="text-sm font-medium text-slate-500">/mês</span>
                                </div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {[
                                    "2 Contas WhatsApp",
                                    "Até 10 Grupos Monitorados",
                                    "Captura de até 1.000 Leads",
                                    "5 Agendamentos por dia",
                                    "100 Links Inteligentes / mês",
                                    "Integração Mercado Livre",
                                    "Suporte prioritário"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-slate-100 font-medium">
                                        <CheckCircle2 size={16} className="text-purple-400" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={onGetStarted} className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold shadow-lg shadow-purple-600/20 transition-all">
                                Selecionar Plano
                            </button>
                        </motion.div>

                        {/* Pro */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col"
                        >
                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-2">Pro</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-bold text-slate-400">R$</span>
                                    <span className="text-4xl font-black">597,99</span>
                                    <span className="text-sm font-medium text-slate-500">/mês</span>
                                </div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {[
                                    "5 Contas WhatsApp",
                                    "Grupos Monitorados Ilimitados",
                                    "Leads Ilimitados",
                                    "Agendamentos Ilimitados",
                                    "Integração Mercado Livre",
                                    "Análise de Dados Avançada",
                                    "Gerente de Conta"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                        <CheckCircle2 size={16} className="text-purple-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={onGetStarted} className="w-full py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold transition-all">
                                Conversar com Vendas
                            </button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden bg-gradient-to-tr from-purple-600 to-indigo-700 shadow-2xl shadow-purple-600/20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">Pronto para transformar seu <br /> WhatsApp em uma máquina?</h2>
                        <p className="text-purple-100/70 text-lg md:text-xl max-w-2xl mx-auto mb-12">
                            Não perca mais tempo com processos manuais. Comece a automatizar sua operação hoje mesmo.
                        </p>
                        <button
                            onClick={onGetStarted}
                            className="bg-white text-purple-700 px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            Quero o Acesso agora
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
                    <div className="col-span-2 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                                <Zap size={16} />
                            </div>
                            <span className="text-lg font-bold">OffeHub</span>
                        </div>
                        <p className="text-slate-500 max-w-sm">
                            Impulsionando o crescimento de milhares de empresas através da automação inteligente de WhatsApp.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-sm uppercase tracking-widest text-slate-300">Plataforma</h4>
                        <ul className="space-y-2 text-slate-500 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Funcionalidades</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">API para Devs</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-sm uppercase tracking-widest text-slate-300">Legal</h4>
                        <ul className="space-y-2 text-slate-500 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-xs">
                    <p>&copy; 2024 OffeHub. Desenvolvido com ❤️ para escalabilidade.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Twitter</a>
                        <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                        <a href="#" className="hover:text-white transition-colors">Instagram</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
