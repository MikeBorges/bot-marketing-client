import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LandingPage from './components/LandingPage';
import { io } from 'socket.io-client';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  CheckCircle2,
  AlertCircle,
  QrCode,
  UserPlus,
  ShieldCheck,
  Trash2,
  Download,
  Target,
  BarChart3,
  Globe,
  ShoppingBag,
  Bot,
  LogOut,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GroupsTab from './components/GroupsTab';
import AnalysisTab from './components/AnalysisTab';
import AccountSwitcher from './components/AccountSwitcher';
import SettingsTab from './components/SettingsTab';
import ProfileTab from './components/ProfileTab';
import ScheduledMessages from './components/ScheduledMessages';
import MercadoLivreTab from './components/MercadoLivreTab';
import ChatbotTab from './components/ChatbotTab';
import PromoConfig from './components/PromoConfig';
import SupportBubble from './components/SupportBubble';
import AuthPage from './components/AuthPage';
import AdminTab from './components/AdminTab';
import AutomationTab from './components/AutomationTab';
import BroadcastModal from './components/BroadcastModal';

// Trigger Redeploy: 2026-03-04
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const socket = io(API_URL, {
  auth: {
    token: 'meu-token-ultra-seguro-123',
    userEmail: localStorage.getItem('userEmail') || ''
  },
  autoConnect: false // Vamos conectar manualmente após login/carregamento
});

const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, x: 50, scale: 0.8 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: 20, scale: 0.8 }}
    className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${type === 'success'
      ? 'bg-whatsapp/20 border-whatsapp/30 text-whatsapp'
      : 'bg-red-500/20 border-red-500/30 text-red-400'
      }`}
  >
    {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
    <span className="font-medium">{message}</span>
  </motion.div>
);

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card max-w-sm w-full relative z-10 border-white/20"
          >
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors"
              >
                {t('modal.cancel')}
              </button>
              <button
                onClick={() => { onConfirm(); onCancel(); }}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/20"
              >
                {t('modal.confirm')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

function App() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState('Desconectado');
  const [qrCode, setQrCode] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [groups, setGroups] = useState([]);
  const [leads, setLeads] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [accounts, setAccounts] = useState([{ id: 'default', name: t('app.mainAccount') }]);
  const [activeAccountId, setActiveAccountId] = useState(localStorage.getItem('activeAccountId') || 'default');
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');
  const [showAuth, setShowAuth] = useState(false);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'user');
  const [userPlan, setUserPlan] = useState(localStorage.getItem('userPlan') || 'teste');

  // Broadcasts
  const [broadcasts, setBroadcasts] = useState([]);
  const [unreadBroadcasts, setUnreadBroadcasts] = useState(0);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && userEmail) {
      socket.auth.userEmail = userEmail;
      socket.connect();
    }
    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, userEmail]);
  const [autoConfig, setAutoConfig] = useState({
    baseName: 'Grupo de Ofertas',
    imageUrl: '',
    threshold: 990,
    welcomeMessage: '',
    antiSpam: false,
    inactivityDays: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [savedConfig, setSavedConfig] = useState(false);
  const [analysisTimeRange, setAnalysisTimeRange] = useState(86400000);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [remarketingModal, setRemarketingModal] = useState({ isOpen: false, lead: null, text: '' });
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [bulkRemarketingModal, setBulkRemarketingModal] = useState({ isOpen: false, text: '' });


  const addNotification = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  useEffect(() => {
    socket.on('status', (newStatus) => setStatus(newStatus));
    socket.on('qr', (url) => setQrCode(url));
    socket.on('groups', (data) => setGroups(data));
    socket.on('accounts', (data) => setAccounts(data));
    socket.on('active_account', (id) => {
      setActiveAccountId(id);
      localStorage.setItem('activeAccountId', id);
    });
    socket.on('config', (config) => {
      if (config) {
        setAutoConfig(prev => ({ ...prev, ...config }));
        if (config.imageData) setImagePreview(config.imageData);
      }
    });
    socket.on('leads', (data) => setLeads(data));
    socket.on('leads_update', (data) => setLeads(data));
    socket.on('events', (data) => setEvents(data));
    socket.on('events_update', (data) => setEvents(data));
    socket.on('stats_update', (data) => setStats(data));
    socket.on('scheduled_update', setScheduledMessages);
    socket.on('private_message_sent', () => {
      addNotification(t('toast.messageSent'), 'success');
      setRemarketingModal({ isOpen: false, lead: null, text: '' });
    });
    socket.on('error', (msg) => {
      addNotification(msg, 'error');
    });
    socket.on('new_group', (data) => {
      addNotification(`✅ Grupo "${data.name}" criado com sucesso!`, 'success');
      // Opcional: abrir o link do grupo automaticamente ou mostrar em um modal
      console.log('Novo grupo criado:', data.link);
    });

    return () => {
      socket.off('status');
      socket.off('qr');
      socket.off('groups');
      socket.off('accounts');
      socket.off('active_account');
      socket.off('config');
      socket.off('leads');
      socket.off('leads_update');
      socket.off('events');
      socket.off('events_update');
      socket.off('stats_update');
      socket.off('scheduled_update');
      socket.off('error');
      socket.off('new_group');
    };
  }, []);

  // Atalho do Chatbot para abrir o modal de agendamento na aba automation
  useEffect(() => {
    const handleOpenSchedule = () => setActiveTab('automation');
    window.addEventListener('switchTabToAutomation', handleOpenSchedule);
    return () => window.removeEventListener('switchTabToAutomation', handleOpenSchedule);
  }, []);

  // Handlers de conta
  const handleSwitchAccount = (id) => {
    // Reset imediato para evitar "flash" de dados da conta anterior
    setGroups([]);
    setStats({});
    setQrCode(null);
    setEvents([]);
    setActiveAccountId(id);
    localStorage.setItem('activeAccountId', id);
    addNotification(t('toast.switchingAccount'), 'success');
    socket.emit('switch_account', { id });
  };
  const handleAddAccount = (name) => { socket.emit('add_account', { name }); addNotification(t('toast.accountCreated', { name }), 'success'); };
  const handleRenameAccount = (id, name) => { socket.emit('rename_account', { id, name }); };
  const handleRemoveAccount = (id) => {
    setModalConfig({
      isOpen: true, title: t('modal.removeAccountTitle'),
      message: t('modal.removeAccountDesc'),
      onConfirm: () => socket.emit('remove_account', { id })
    });
  };

  const handleSaveConfig = () => {
    socket.emit('update_config', {
      ...autoConfig,
      imageData: imagePreview
    });
    addNotification(t('toast.configSaved'), 'success');
    setSavedConfig(true);
    setTimeout(() => setSavedConfig(false), 2500);
  };

  const handleCreateManualGroup = (name, description) => {
    if (!name || name.trim() === '') {
      addNotification(t('toast.nameRequired'), 'error');
      return;
    }
    // Assuming setIsCreating is defined elsewhere or removed.
    // For now, commenting out setIsCreating as it's not in the provided context.
    // setIsCreating(true);
    socket.emit('create_manual_group', { name, description });
    addNotification(t('toast.requestSent'), 'success');
    // Assuming a socket.on('group_created') or similar will eventually set isCreating(false)
    // For now, we can set a timeout or rely on a success/error event from the backend
    // setTimeout(() => setIsCreating(false), 3000); // Example: reset after 3 seconds
  };

  useEffect(() => {
    if (!socket || !userEmail) return;

    const handleNewTicket = (ticket) => {
      if (ticket.user_email !== userEmail && (userRole === 'admin' || userRole === 'super_admin')) {
        addNotification(`🆘 Novo Ticket de ${ticket.user_name}: ${ticket.category.toUpperCase()}`, 'info');
      }
    };

    socket.on('new_support_ticket', handleNewTicket);

    // Broadcasts
    const handleBroadcastsUpdate = ({ broadcasts: data, unread }) => {
      setBroadcasts(data || []);
      setUnreadBroadcasts(unread || 0);
    };
    const handleNewBroadcast = (b) => {
      setBroadcasts(prev => [b, ...prev]);
      if (!b.read_by?.includes(userEmail)) {
        setUnreadBroadcasts(prev => prev + 1);
        addNotification(`📣 Novo aviso: ${b.title}`, 'info');
      }
    };
    const handleBroadcastDeleted = ({ broadcastId }) => {
      setBroadcasts(prev => prev.filter(b => b.id !== broadcastId));
    };
    socket.on('broadcasts_update', handleBroadcastsUpdate);
    socket.on('new_broadcast', handleNewBroadcast);
    socket.on('broadcast_deleted', handleBroadcastDeleted);

    return () => {
      socket.off('new_support_ticket', handleNewTicket);
      socket.off('broadcasts_update', handleBroadcastsUpdate);
      socket.off('new_broadcast', handleNewBroadcast);
      socket.off('broadcast_deleted', handleBroadcastDeleted);
    };
  }, [socket, userEmail, userRole]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addNotification(t('toast.imageSize'), 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    setModalConfig({
      isOpen: true,
      title: t('modal.disconnectTitle'),
      message: t('modal.disconnectDesc'),
      onConfirm: () => {
        socket.emit('logout');
        addNotification(t('toast.disconnecting'), 'success');
      }
    });
  };

  const handleSystemLogout = () => {
    // 1. Desconecta o socket
    socket.disconnect();

    // 2. Limpa dados de autenticação
    setIsAuthenticated(false);
    setShowAuth(false);
    setUserEmail('');
    setUserRole('user');
    setUserPlan('basic');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userPlan');
    localStorage.removeItem('chatbot_history');

    // 3. Reseta TODO o estado do painel (Isolamento de Dados)
    setStatus('Desconectado');
    setQrCode(null);
    setGroups([]);
    setLeads([]);
    setEvents([]);
    setStats({});
    setAccounts([{ id: 'default', name: t('app.mainAccount') }]);
    setActiveAccountId('default');
    setActiveTab('dashboard');
    setAutoConfig({
      baseName: 'Grupo de Ofertas',
      imageUrl: '',
      threshold: 990,
      welcomeMessage: '',
      antiSpam: false,
      inactivityDays: 0
    });
    setScheduledMessages([]);
    setSelectedLeads(new Set());
    setImagePreview(null);

    addNotification('Sessão encerrada com sucesso!', 'success');
  };

  const handleDeleteGroup = (groupId, groupName) => {
    setModalConfig({
      isOpen: true,
      title: t('modal.deleteGroupTitle'),
      message: t('modal.deleteGroupDesc', { name: groupName }),
      onConfirm: () => {
        socket.emit('delete_group', { groupId });
        addNotification(t('toast.requestSent'), 'success');
      }
    });
  };

  const handleAddScheduled = (msgData) => {
    // Optimistic update
    const tempId = 'temp-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const optimisticMsg = {
      ...msgData,
      id: tempId,
      status: 'pendente',
      datetime: msgData.datetime
    };
    setScheduledMessages(prev => [optimisticMsg, ...prev]);

    socket.emit('add_scheduled', msgData);
    addNotification(t('toast.campaignScheduled'), 'success');
  };

  const handleEditScheduled = (msgData) => {
    socket.emit('edit_scheduled', msgData);
    addNotification(t('toast.campaignUpdated'), 'success');
  };

  const handleDeleteScheduled = (id) => {
    socket.emit('delete_scheduled', id);
    addNotification(t('toast.campaignRemoved'), 'success');
  };

  const downloadLeads = () => {
    if (leads.length === 0) {
      addNotification(t('toast.noLeadsExport'), 'error');
      return;
    }

    const headers = [
      t('remarketing.headers.date'),
      t('remarketing.headers.name'),
      t('remarketing.headers.number'),
      t('remarketing.headers.originGroup')
    ];
    const rows = leads.map(l => [
      new Date(l.date).toLocaleDateString(),
      l.name,
      l.number,
      l.groupName
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_remarketing_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification(t('toast.reportExported'), 'success');
  };

  const handleDeleteLead = (id) => {
    socket.emit('delete_lead', { id });
    addNotification('Lead removido!', 'success');
  };

  const handleDeleteSelectedLeads = () => {
    const ids = leads.filter(l => selectedLeads.has(l.number)).map(l => l.id);
    if (ids.length === 0) return;

    setModalConfig({
      isOpen: true,
      title: 'Excluir Selecionados',
      message: `Tem certeza que deseja excluir ${ids.length} leads selecionados?`,
      onConfirm: () => {
        socket.emit('delete_selected_leads', { ids });
        setSelectedLeads(new Set());
        addNotification('Leads selecionados removidos!', 'success');
      }
    });
  };

  const handleClearAllLeads = () => {
    setModalConfig({
      isOpen: true,
      title: 'Limpar Tudo',
      message: 'Tem certeza que deseja excluir TODOS os leads desta conta? Esta ação não pode ser desfeita.',
      onConfirm: () => {
        socket.emit('clear_all_leads');
        setSelectedLeads(new Set());
        addNotification('Lista de leads limpa com sucesso!', 'success');
      }
    });
  };

  const getFilteredEvents = () => {
    return events.filter(e => {
      if (analysisTimeRange && typeof analysisTimeRange === 'object' && analysisTimeRange.type === 'custom') {
        return e.timestamp >= analysisTimeRange.from && e.timestamp <= analysisTimeRange.to;
      } else if (typeof analysisTimeRange === 'number') {
        return e.timestamp > Date.now() - analysisTimeRange;
      } else if (typeof analysisTimeRange === 'string' && analysisTimeRange.startsWith('month-')) {
        const parts = analysisTimeRange.split('-');
        const year = parseInt(parts[1]);
        const month = parseInt(parts[2]);
        const start = new Date(year, month, 1).getTime();
        const end = new Date(year, month + 1, 1).getTime();
        return e.timestamp >= start && e.timestamp < end;
      }
      return true;
    });
  };

  const getDailyStats = () => {
    const periodEvents = getFilteredEvents();
    const statsByDay = {};

    // Garante que o dia de hoje sempre apareça se estiver no range
    const todayStr = new Date().toLocaleDateString();
    statsByDay[todayStr] = { date: t('analysis.timeRange.today'), join: 0, leave: 0, growth: 0, timestamp: Date.now() };

    periodEvents.forEach(e => {
      const d = new Date(e.timestamp);
      const day = d.toLocaleDateString();
      const label = day === todayStr ? t('analysis.timeRange.today') : day;

      if (!statsByDay[day]) {
        statsByDay[day] = { date: label, join: 0, leave: 0, growth: 0, timestamp: e.timestamp };
      }
      if (e.type === 'join') statsByDay[day].join++;
      if (e.type === 'leave') statsByDay[day].leave++;
      statsByDay[day].growth = statsByDay[day].join - statsByDay[day].leave;
    });

    return Object.values(statsByDay).sort((a, b) => a.timestamp - b.timestamp);
  };

  const downloadAnalysisCSV = () => {
    const dailyStats = getDailyStats();
    if (dailyStats.length === 0) {
      addNotification(t('toast.noAnalysisData'), 'error');
      return;
    }

    const headers = [
      t('analysis.headers.date') || 'Data',
      t('analysis.stats.entries') || 'Entradas',
      t('analysis.stats.exits') || 'Saídas',
      t('analysis.stats.balance') || 'Saldo'
    ];
    const rows = dailyStats.map(d => [
      d.date,
      d.join,
      d.leave,
      d.growth
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `analise_crescimento_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification(t('toast.analysisExported'), 'success');
  };

  const handleSendRemarketingMessage = () => {
    if (!remarketingModal.lead || !remarketingModal.text) return;
    socket.emit('send_private_message', {
      number: remarketingModal.lead.number,
      text: remarketingModal.text
    });
  };

  const handleBulkRemarketingMessage = () => {
    if (selectedLeads.size === 0 || !bulkRemarketingModal.text) return;
    const selectedLeadsList = leads.filter(l => selectedLeads.has(l.number));
    selectedLeadsList.forEach(lead => {
      socket.emit('send_private_message', { number: lead.number, text: bulkRemarketingModal.text });
    });
    setBulkRemarketingModal({ isOpen: false, text: '' });
    setSelectedLeads(new Set());
    addNotification(`Mensagem enviada para ${selectedLeadsList.length} leads!`, 'success');
  };

  const toggleLeadSelection = (number) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(l => l.number)));
    }
  };

  let menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('menu.dashboard') },
    { id: 'groups', icon: Users, label: t('menu.groups') },
    { id: 'analysis', icon: BarChart3, label: t('menu.analysis') },
    { id: 'remarketing', icon: Target, label: t('menu.remarketing') },
    { id: 'automation', icon: Settings, label: t('menu.automation') },
    { id: 'chatbot', icon: MessageSquare, label: t('menu.chatbot') },
    { id: 'mercadolivre', icon: ShoppingBag, label: 'Mercado Livre' },
    { id: 'config', icon: Settings, label: t('menu.config') },
  ];

  // Restrição de Plano Básico
  const isBasicPlan = userPlan && (userPlan.toLowerCase() === 'basic' || userPlan.toLowerCase() === 'teste');

  if (isBasicPlan) {
    menuItems = menuItems.filter(item =>
      !['analysis', 'remarketing', 'mercadolivre', 'chatbot'].includes(item.id)
    );
  }

  if (userRole === 'admin' || userRole === 'super_admin') {
    menuItems.splice(menuItems.length - 1, 0, { id: 'admin', icon: ShieldCheck, label: 'Administração' });
  }

  if (!isAuthenticated) {
    if (showAuth) {
      return <AuthPage onLogin={(user) => {
        setIsAuthenticated(true);
        setUserEmail(user.email);
        setUserRole(user.role);
        setUserPlan(user.plan);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('userPlan', user.plan);
      }} />;
    }
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden text-slate-200" style={{ background: 'var(--bg-base)' }}>
      {/* Sidebar - Hidden on mobile */}
      <aside className="w-64 flex-col p-5 z-10 hidden lg:flex" style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-8 px-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
            <MessageSquare size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text-primary)' }}>
            OffeHub
          </h1>
        </div>

        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--text-muted)' }}>{t('app.activeAccount')}</p>
          <AccountSwitcher
            accounts={accounts}
            activeAccountId={activeAccountId}
            onSwitch={handleSwitchAccount}
            onAdd={handleAddAccount}
            onRename={handleRenameAccount}
            onRemove={handleRemoveAccount}
          />
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="nav-item w-full"
              style={activeTab === item.id ? { background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--text-primary)' } : {}}
            >
              <item.icon size={16} style={{ color: activeTab === item.id ? 'var(--accent)' : 'inherit' }} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bell button for broadcasts */}
        <button
          onClick={() => {
            setIsBroadcastOpen(true);
            setUnreadBroadcasts(0);
          }}
          className="relative flex items-center gap-2.5 px-3 py-2 rounded-xl w-full transition-colors hover:bg-white/5"
          style={{ color: unreadBroadcasts > 0 ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill={unreadBroadcasts > 0 ? 'var(--accent)' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadBroadcasts > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white animate-bounce"
                style={{ background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.7)' }}>
                {unreadBroadcasts > 9 ? '9+' : unreadBroadcasts}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold">{unreadBroadcasts > 0 ? 'Avisos novos!' : 'Avisos'}</span>
        </button>

        <div className="mt-auto pt-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex flex-col gap-1 px-3 py-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('app.subscription')}:</span>
              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${userPlan === 'pro' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                userPlan === 'basic' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                {userPlan === 'pro' ? 'PRO' :
                  userPlan === 'intermediario' ? 'INTERMEDIÁRIO' :
                    userPlan === 'basic' ? 'BASIC' : 'TRIAL'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              const langs = ['pt', 'en', 'es'];
              const next = langs[(langs.indexOf(i18n.language) + 1) % langs.length];
              i18n.changeLanguage(next);
            }}
            className="nav-item w-full"
          >
            <Globe size={15} style={{ color: 'var(--accent)' }} />
            <span>
              {i18n.language === 'pt' ? 'Português' :
                i18n.language === 'en' ? 'English' : 'Español'}
            </span>
          </button>

          <div className="flex items-center gap-2.5 px-3 py-2">
            <span className="glow-dot" style={{ background: status === 'Conectado' ? 'var(--success)' : 'var(--danger)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {status === 'Conectado' ? t('app.online') : t('app.offline')}
            </span>
          </div>

          <button
            onClick={handleSystemLogout}
            className="nav-item w-full text-red-400 hover:bg-red-500/10 mt-1"
          >
            <LogOut size={15} />
            <span>{t('app.logout') || 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile: account strip + bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden">
        {/* Thin account indicator */}
        <div className="flex items-center justify-between px-4 py-1.5" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold uppercase" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              {accounts.find(a => a.id === activeAccountId)?.name?.substring(0, 2) || '??'}
            </div>
            <span className="text-[10px] font-medium truncate max-w-[120px]" style={{ color: 'var(--text-secondary)' }}>
              {accounts.find(a => a.id === activeAccountId)?.name || t('app.account')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="glow-dot w-1.5 h-1.5" style={{ background: status === 'Conectado' ? 'var(--success)' : 'var(--danger)' }} />
            <span className="text-[9px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>{status === 'Conectado' ? t('app.online') : t('app.offline')}</span>
          </div>
        </div>
        {/* Nav bar */}
        <nav className="h-16 flex items-center justify-around px-2" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center gap-1 min-w-[44px] transition-all duration-200"
              style={{ color: activeTab === item.id ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              <item.icon size={18} />
              <span className="text-[9px] font-semibold uppercase tracking-tighter">
                {item.id === 'dashboard' ? t('app.dash') : item.label.substring(0, 6)}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative pb-24 lg:pb-8">
        {/* Blobs de fundo sutis */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] -z-10" style={{ background: 'radial-gradient(circle, rgba(124,111,255,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] -z-10" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Wrapper com max-width para o conteúdo */}
        <div className="max-w-6xl mx-auto w-full">

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto space-y-6"
              >
                <header className="mb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>{t('menu.dashboard')}</p>
                  <h2 className="text-2xl md:text-3xl font-bold heading-lg" style={{ color: 'var(--text-primary)' }}>{t('dashboard.welcome')}</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.subtitle')}</p>
                </header>

                {/* Connection Status Banner */}
                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${status === 'Conectado'
                  ? 'bg-[var(--mint-soft)] border-[var(--mint)]/30 text-[var(--mint)]'
                  : 'bg-red-500/5 border-red-500/20 text-red-400'
                  }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status === 'Conectado' ? 'bg-[var(--mint-soft)] border border-[var(--mint)]/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]' : 'bg-red-500/10'}`}>
                      {status === 'Conectado' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{status === 'Conectado' ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}</h3>
                      <p className="text-xs opacity-80">
                        {status === 'Conectado'
                          ? 'Seu sistema está operando normalmente.'
                          : 'Conecte seu WhatsApp para habilitar o envio de mensagens.'}
                      </p>
                    </div>
                  </div>
                  {status !== 'Conectado' && (
                    <button
                      onClick={() => setActiveTab('config')}
                      className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Conectar Agora
                    </button>
                  )}
                </div>

                {/* Stats Grid — 4 cards compactos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="stat-card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
                        <Users size={16} style={{ color: 'var(--accent)' }} />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('dashboard.totalGroups')}</span>
                    </div>
                    <div className="text-2xl font-bold heading-lg" style={{ color: 'var(--text-primary)' }}>{groups.length}</div>
                    <div className="text-[11px] mt-1 font-medium" style={{ color: 'var(--accent)' }}>{t('dashboard.synced')}</div>
                  </div>

                  <div className="stat-card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--mint-soft)' }}>
                        <UserPlus size={16} style={{ color: 'var(--mint)' }} />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('dashboard.totalMembers')}</span>
                    </div>
                    <div className="text-2xl font-bold heading-lg" style={{ color: 'var(--text-primary)' }}>
                      {groups.reduce((acc, g) => acc + (g.participants || 0), 0)}
                    </div>
                    <div className="text-[11px] mt-1 font-medium" style={{ color: 'var(--mint)' }}>{t('dashboard.inAllGroups')}</div>
                  </div>

                  <div className="stat-card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.1)' }}>
                        <ShieldCheck size={16} style={{ color: '#a855f7' }} />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('dashboard.status')}</span>
                    </div>
                    <div className="text-2xl font-bold heading-lg" style={{ color: 'var(--text-primary)' }}>{status === 'Conectado' ? t('dashboard.active') : t('dashboard.off')}</div>
                    <div className={`text-[11px] mt-1 font-medium ${status === 'Conectado' ? '' : 'text-red-400'}`} style={status === 'Conectado' ? { color: '#a855f7' } : {}}>{t('dashboard.botEngine')}</div>
                  </div>

                  {/* Mercado Livre Status Card */}
                  {userPlan !== 'basic' && (
                    <div
                      className="stat-card cursor-pointer"
                      onClick={() => setActiveTab('mercadolivre')}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: autoConfig?.mercadolivre?.accessToken ? 'rgba(234,179,8,0.1)' : 'var(--bg-hover)' }}>
                          <ShoppingBag size={16} style={{ color: autoConfig?.mercadolivre?.accessToken ? '#eab308' : 'var(--text-muted)' }} />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Mercado Livre</span>
                      </div>
                      <div className="text-lg font-bold heading-lg" style={{ color: autoConfig?.mercadolivre?.accessToken ? '#eab308' : 'var(--text-muted)' }}>
                        {autoConfig?.mercadolivre?.accessToken ? 'Vinculado' : 'Não vinculado'}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="glow-dot w-1.5 h-1.5" style={{ background: autoConfig?.mercadolivre?.accessToken ? '#eab308' : 'var(--text-muted)', animation: autoConfig?.mercadolivre?.accessToken ? undefined : 'none' }} />
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{autoConfig?.mercadolivre?.accessToken ? 'API conectada' : 'Clique para configurar'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Section: Status + Grupos Recentes */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  {/* Status do Motor — menor */}
                  <div className="glass-card lg:col-span-2">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <ShieldCheck size={16} style={{ color: '#a855f7' }} />
                      {t('dashboard.engineStatus')}
                    </h3>
                    <div className="flex items-center gap-4 py-3">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${status === 'Conectado' ? '' : ''}`} style={{ background: status === 'Conectado' ? 'rgba(168,85,247,0.12)' : 'rgba(248,113,113,0.12)' }}>
                        {status === 'Conectado'
                          ? <CheckCircle2 size={28} style={{ color: '#a855f7' }} />
                          : <AlertCircle size={28} style={{ color: 'var(--danger)' }} />}
                      </div>
                      <div>
                        <p className="font-bold text-base heading-lg" style={{ color: 'var(--text-primary)' }}>{status === 'Conectado' ? t('dashboard.operational') : t('dashboard.disconnected')}</p>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {t('dashboard.engineDesc1')}<span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('dashboard.engineDesc2')}</span>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Grupos Recentes — maior */}
                  <div className="glass-card lg:col-span-3">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Users size={16} style={{ color: 'var(--accent)' }} />
                      {t('dashboard.recentGroups')}
                    </h3>
                    <div className="space-y-2">
                      {groups.slice(0, 5).map((group) => (
                        <div key={group.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold uppercase shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                            {group.name.substring(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{group.name}</h4>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{group.participants} {t('dashboard.members')}</p>
                          </div>
                        </div>
                      ))}
                      {groups.length === 0 && <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>{t('dashboard.noGroups')}</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Removed ProfileTab as per instruction */}

            {activeTab === 'chatbot' && !isBasicPlan && (
              <ChatbotTab socket={socket} status={status} />
            )}

            {activeTab === 'mercadolivre' && (
              <MercadoLivreTab
                config={autoConfig}
                onSaveConfig={(newConfig) => {
                  socket.emit('update_config', { ...newConfig, imageData: imagePreview });
                  addNotification('Configurações salvas!', 'success');
                }}
                addNotification={addNotification}
              />
            )}

            {activeTab === 'config' && (
              <SettingsTab
                status={status}
                qrCode={qrCode}
                handleLogout={handleLogout}
                userPlan={userPlan}
              />
            )}

            {activeTab === 'groups' && (
              <GroupsTab
                groups={groups}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                autoConfig={autoConfig}
                setAutoConfig={setAutoConfig}
                imagePreview={imagePreview}
                handleFileChange={handleFileChange}
                handleSaveConfig={handleSaveConfig}
                savedConfig={savedConfig}
                stats={stats}
                handleDeleteGroup={handleDeleteGroup}
                handleCreateManualGroup={handleCreateManualGroup}
                onRefreshViews={() => socket.emit('refresh_views')}
                socket={socket}
                userPlan={userPlan}
              />
            )}

            {activeTab === 'analysis' && (
              <AnalysisTab
                analysisTimeRange={analysisTimeRange}
                setAnalysisTimeRange={setAnalysisTimeRange}
                events={events}
                getFilteredEvents={getFilteredEvents}
                getDailyStats={getDailyStats}
                downloadAnalysisCSV={downloadAnalysisCSV}
                groups={groups}
                stats={stats}
                onRefresh={() => {
                  socket.emit('refresh_views');
                  socket.emit('request_data_refresh');
                }}
                config={autoConfig}
              />
            )}

            {activeTab === 'admin' && (userRole === 'admin' || userRole === 'super_admin') && (
              <AdminTab
                userEmail={userEmail}
                userRole={userRole}
                addNotification={addNotification}
                socket={socket}
              />
            )}

            {activeTab === 'automation' && (
              <AutomationTab
                groups={groups}
                scheduledMessages={scheduledMessages}
                onAddScheduled={handleAddScheduled}
                onEditScheduled={handleEditScheduled}
                onDeleteScheduled={handleDeleteScheduled}
                socket={socket}
                autoConfig={autoConfig}
                setAutoConfig={setAutoConfig}
                handleSaveConfig={handleSaveConfig}
                userPlan={userPlan}
                API_URL={API_URL}
                userEmail={userEmail}
                addNotification={addNotification}
                savedConfig={savedConfig}
              />
            )}

            {activeTab === 'remarketing' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="max-w-6xl mx-auto space-y-6"
              >
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>{t('menu.remarketing')}</p>
                    <h2 className="text-2xl font-bold heading-lg" style={{ color: 'var(--text-primary)' }}>{t('remarketing.title')}</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('remarketing.subtitle', { count: leads.length })}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {selectedLeads.size > 0 && (
                      <button
                        onClick={() => setBulkRemarketingModal({ isOpen: true, text: '' })}
                        className="flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-xl transition-all text-sm"
                        style={{ background: 'var(--mint)', border: '1px solid rgba(52,211,153,0.3)' }}
                      >
                        <MessageSquare size={15} />
                        Enviar para {selectedLeads.size}
                      </button>
                    )}
                    {selectedLeads.size > 0 && (
                      <button
                        onClick={handleDeleteSelectedLeads}
                        className="flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition-all text-sm bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                      >
                        <Trash2 size={15} />
                        Excluir Selecionados ({selectedLeads.size})
                      </button>
                    )}
                    <button
                      onClick={handleClearAllLeads}
                      className="flex items-center gap-2 font-semibold px-4 py-2 rounded-xl transition-all text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                    >
                      <Trash2 size={15} />
                      Limpar Tudo
                    </button>
                    <button
                      onClick={downloadLeads}
                      className="flex items-center gap-2 font-semibold px-4 py-2 rounded-xl transition-all text-sm btn-ghost"
                    >
                      <Download size={15} />
                      {t('remarketing.exportBtn')}
                    </button>
                  </div>
                </header>

                <div className="glass-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={leads.length > 0 && selectedLeads.size === leads.length}
                              onChange={toggleSelectAll}
                              className="w-4 h-4 accent-whatsapp cursor-pointer"
                            />
                          </th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{t('remarketing.headers.date')}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{t('remarketing.headers.name')}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{t('remarketing.headers.number')}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{t('remarketing.headers.originGroup')}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {leads.map((lead, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedLeads.has(lead.number) ? 'bg-whatsapp/5' : ''
                              }`}
                            onClick={() => toggleLeadSelection(lead.number)}
                          >
                            <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedLeads.has(lead.number)}
                                onChange={() => toggleLeadSelection(lead.number)}
                                className="w-4 h-4 accent-whatsapp cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-300">{new Date(lead.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-sm font-medium text-white">{lead.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-300">{lead.number}</td>
                            <td className="px-6 py-4 text-sm text-slate-400 italic">{lead.groupName}</td>
                            <td className="px-6 py-4 text-sm text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setRemarketingModal({ isOpen: true, lead, text: '' })}
                                  className="px-3 py-1.5 bg-whatsapp/10 hover:bg-whatsapp/20 text-whatsapp rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                                >
                                  <MessageSquare size={14} />
                                  Enviar
                                </button>
                                <button
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                  title="Excluir Lead"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {leads.length === 0 && (
                          <tr>
                            <td colSpan="6" className="px-6 py-20 text-center text-slate-500">
                              {t('remarketing.empty')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-4">
                  <Target className="text-amber-400 shrink-0" size={24} />
                  <div className="text-sm text-amber-200/80 leading-relaxed">
                    <strong>{t('remarketing.strategyTitle')}</strong> {t('remarketing.strategyDesc')}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Remarketing Modal */}
          <AnimatePresence>
            {remarketingModal.isOpen && (
              <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setRemarketingModal({ isOpen: false, lead: null, text: '' })}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative z-10 glass-card w-full max-w-lg border-white/20 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <MessageSquare className="text-whatsapp" size={24} />
                      Enviar Mensagem Privada
                    </h3>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl mb-6 border border-white/10">
                    <p className="text-sm text-slate-400">Para: <strong className="text-white">{remarketingModal.lead?.name}</strong></p>
                    <p className="text-xs text-slate-500 mt-1">{remarketingModal.lead?.number}</p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <label className="text-sm font-medium text-slate-400">Mensagem:</label>
                    <textarea
                      value={remarketingModal.text}
                      onChange={(e) => setRemarketingModal({ ...remarketingModal, text: e.target.value })}
                      placeholder="Olá, vi que você saiu do grupo..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-whatsapp/50 transition-colors h-32 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setRemarketingModal({ isOpen: false, lead: null, text: '' })}
                      className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/10 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSendRemarketingMessage}
                      disabled={!remarketingModal.text}
                      className="px-6 py-2 rounded-xl font-bold bg-whatsapp hover:bg-whatsapp-dark text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Enviar
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Bulk Remarketing Modal */}
          <AnimatePresence>
            {bulkRemarketingModal.isOpen && (
              <div className="fixed inset-0 z-[165] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setBulkRemarketingModal({ isOpen: false, text: '' })}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative z-10 glass-card w-full max-w-lg border-white/20 p-6"
                >
                  <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                    <MessageSquare className="text-whatsapp" size={24} />
                    Enviar Mensagem em Massa
                  </h3>
                  <p className="text-sm text-slate-400 mb-6">
                    A mensagem será enviada para <strong className="text-white">{selectedLeads.size} leads</strong> selecionados.
                  </p>
                  <div className="space-y-2 mb-6">
                    <label className="text-sm font-medium text-slate-400">Mensagem:</label>
                    <textarea
                      value={bulkRemarketingModal.text}
                      onChange={(e) => setBulkRemarketingModal({ ...bulkRemarketingModal, text: e.target.value })}
                      placeholder="Olá! Gostaríamos de convidar você de volta..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-whatsapp/50 transition-colors h-32 resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setBulkRemarketingModal({ isOpen: false, text: '' })}
                      className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/10 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleBulkRemarketingMessage}
                      disabled={!bulkRemarketingModal.text}
                      className="px-6 py-2 rounded-xl font-bold bg-whatsapp hover:bg-whatsapp-dark text-white shadow-lg disabled:opacity-50"
                    >
                      Enviar para {selectedLeads.size} leads
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div> {/* end max-w-6xl wrapper */}
      </main>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />

      <div className="fixed bottom-20 lg:bottom-8 right-4 md:right-8 z-[120] flex flex-col gap-3">
        <AnimatePresence>
          {notifications.map(n => (
            <Toast
              key={n.id}
              message={n.message}
              type={n.type}
              onClose={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))}
            />
          ))}
        </AnimatePresence>
      </div>

      {isAuthenticated && socket && (
        <SupportBubble
          socket={socket}
          addNotification={addNotification}
          userPlan={userPlan}
          userEmail={userEmail}
          userName={localStorage.getItem('userName') || userEmail}
        />
      )}

      {/* Broadcast Modal */}
      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        broadcasts={broadcasts}
        userEmail={userEmail}
        socket={socket}
      />
    </div>
  );
}

export default App;
