
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Scissors, 
  CreditCard, 
  FileText,
  Menu,
  X,
  Database,
  Copy,
  Check,
  BookOpen,
  Settings,
  Bell,
  Mail,
  User,
  LogOut,
  Store,
  ChevronDown,
  Home,
  Briefcase,
  Camera,
  MessageCircle,
  WifiOff,
  Wifi,
  Sparkles,
  Lock,
  Crown,
  ShieldAlert,
  Loader2,
  Headphones,
  ChevronLeft,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Client, Order, CatalogItem, Tab, UserProfile, TeamMember, Permission, SQL_SETUP_SCRIPT } from './types';

// Components
import Dashboard from './components/Dashboard';
import ClientManager from './components/ClientManager';
import OrderManager from './components/OrderManager';
import FinanceView from './components/FinanceView';
import CatalogueManager from './components/CatalogueManager';
import ProfileManager from './components/ProfileManager';
import TeamManager from './components/TeamManager';
import Auth from './components/Auth';
import VoiceClientAdder from './components/VoiceClientAdder';
import SuperAdmin from './components/SuperAdmin';
import LandingPage from './components/LandingPage'; 
import SupportMessaging from './components/SupportMessaging';
import Documentation from './components/Documentation';

const getErrorMessage = (err: any): string => {
    if (!err) return "Erreur inconnue";
    const msg = typeof err === 'string' ? err : err.message || String(err);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('TypeError')) {
        return "Connexion au serveur impossible. Vérifiez votre connexion internet.";
    }
    return msg;
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [isStaffSession, setIsStaffSession] = useState(false);
  const [staffProfile, setStaffProfile] = useState<TeamMember | null>(null);
  const [showLanding, setShowLanding] = useState(true); 
  const [isAdminPortal, setIsAdminPortal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [activeSupportTicketId, setActiveSupportTicketId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [unreadSupportMessages, setUnreadSupportMessages] = useState(0);
  
  // UI states
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('portal') === 'admin') {
        setIsAdminPortal(true);
        setShowLanding(false);
    }

    const handleOnline = () => { setIsOffline(false); setError(null); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const init = async () => {
        try {
            if (!isSupabaseConfigured()) {
              setError("Configuration Supabase manquante.");
              setLoading(false);
              return;
            }

            const isGuestSession = localStorage.getItem('stylistepro_guest_session') === 'true';
            if (isGuestSession) {
                const guestSession = { user: { id: 'guest-user-id', email: 'invite@stylistepro.com' }, isGuest: true };
                setSession(guestSession);
                setShowLanding(false);
                await fetchUserProfile('guest-user-id', guestSession);
                await fetchData('guest-user-id', false);
                return;
            }

            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;

            if (currentSession) {
                setSession(currentSession);
                setShowLanding(false);
                await fetchUserProfile(currentSession.user.id, currentSession);
                await fetchData(currentSession.user.id, false);
            } else {
                const storedStaff = localStorage.getItem('stylistepro_staff');
                if (storedStaff) {
                    try {
                        const staff = JSON.parse(storedStaff);
                        handleStaffLoginSuccess(staff);
                        setShowLanding(false);
                    } catch (e) {
                        localStorage.removeItem('stylistepro_staff');
                        setLoading(false);
                    }
                } else {
                    setLoading(false);
                }
            }
        } catch (e: any) {
            console.error("Init error", e);
            setError(getErrorMessage(e));
            setLoading(false);
        }
    };
    init();

    const notifInterval = setInterval(() => {
        const ownerId = isStaffSession ? staffProfile?.owner_id : session?.user?.id;
        if (ownerId && ownerId !== 'guest-user-id' && navigator.onLine) {
            checkUnreadSupport(ownerId);
        }
    }, 30000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      const isGuestSession = localStorage.getItem('stylistepro_guest_session') === 'true';
      if (currentSession) {
        localStorage.removeItem('stylistepro_guest_session'); // Clear guest mode if logged in with real account
        setSession(currentSession);
        setIsStaffSession(false);
        setStaffProfile(null);
        fetchUserProfile(currentSession.user.id, currentSession);
        fetchData(currentSession.user.id, true); 
        setShowLanding(false);
      } else if (!isStaffSession && !isGuestSession) {
        setSession(null);
        setClients([]);
        setOrders([]);
        setCatalog([]);
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(notifInterval);
    };
  }, [session?.user?.id, isStaffSession]);

  const checkUnreadSupport = async (ownerId: string | undefined) => {
      if (!ownerId || !navigator.onLine) return;
      try {
          const { data: tickets } = await supabase.from('support_messages').select('id').eq('user_id', ownerId);
          if (tickets && tickets.length > 0) {
              const ticketIds = tickets.map(t => t.id);
              const { count, error } = await supabase
                .from('support_replies')
                .select('*', { count: 'exact', head: true })
                .in('ticket_id', ticketIds)
                .eq('is_admin', true)
                .is('read_at', null);
              
              if (!error) setUnreadSupportMessages(count || 0);
          } else {
              setUnreadSupportMessages(0);
          }
      } catch (e) { /* Silent */ }
  };

  const handleStaffLoginSuccess = (teamMember: TeamMember) => {
    setIsStaffSession(true);
    setStaffProfile(teamMember);
    setSession({ user: { id: teamMember.id, email: teamMember.email } });
    fetchUserProfile(teamMember.owner_id);
    fetchData(teamMember.owner_id, false);
    setShowLanding(false);
  };

  const handleStaffUpdate = (updatedStaff: TeamMember) => {
    setStaffProfile(updatedStaff);
    localStorage.setItem('stylistepro_staff', JSON.stringify(updatedStaff));
  };

  const fetchUserProfile = async (userId: string, sessionUser?: any) => {
    if (userId === 'guest-user-id' || (sessionUser && sessionUser.isGuest)) {
      const localProfile = localStorage.getItem('stylistepro_guest_profile');
      if (localProfile) {
        setUserProfile(JSON.parse(localProfile));
      } else {
        const defaultProfile = {
          id: 'guest-user-id',
          shop_name: "Atelier Mode & Style (Démo)",
          owner_full_name: "Patron Invité",
          phone: "+229 97 00 11 22",
          subscription_plan: 'pro',
          updated_at: new Date().toISOString()
        };
        localStorage.setItem('stylistepro_guest_profile', JSON.stringify(defaultProfile));
        setUserProfile(defaultProfile as any);
      }
      return;
    }
    if (!navigator.onLine) return;
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (data) {
          setUserProfile(data);
        } else if (sessionUser) {
          // Si le profil n'existe pas encore (ex: après inscription), on le crée ici avec les métadonnées de session
          const rawShopName = sessionUser.user_metadata?.shop_name || "Mon Atelier";
          const { data: newProfile, error: insertError } = await supabase.from('profiles').insert({
            id: userId,
            shop_name: rawShopName,
            updated_at: new Date().toISOString()
          }).select().maybeSingle();
          
          if (newProfile) {
            setUserProfile(newProfile);
          }
        }
    } catch (e) { console.warn('Profile fetch error', e); }
  };

  const fetchData = async (ownerId: string, isSilent = true) => {
    if (!ownerId) return;

    // Mode invité / démo local
    if (ownerId === 'guest-user-id' || session?.isGuest) {
      if (!isSilent) setLoading(true);
      try {
        const storedClients = localStorage.getItem('stylistepro_guest_clients');
        const storedOrders = localStorage.getItem('stylistepro_guest_orders');
        const storedCatalog = localStorage.getItem('stylistepro_guest_catalog');
        
        const localClients = storedClients ? JSON.parse(storedClients) : [
          { id: 'c1', user_id: 'guest-user-id', name: 'Mme. Amoussou', phone: '+229 97 00 11 22', measurements: { epaule: '40', poitrine: '92', taille: '78', hanches: '102' } },
          { id: 'c2', user_id: 'guest-user-id', name: 'M. Touré', phone: '+229 95 33 44 55', measurements: { epaule: '46', poitrine: '104', longueurHaut: '75' } }
        ];
        
        const localOrders = storedOrders ? JSON.parse(storedOrders) : [
          { id: 'o1', user_id: 'guest-user-id', client_id: 'c1', description: 'Robe de soirée en pagne Wax', status: 'In Progress', price: 25000, total_paid: 15000, payments: [{ amount: 15000, date: '2026-07-01' }], created_at: new Date().toISOString() },
          { id: 'o2', user_id: 'guest-user-id', client_id: 'c2', description: 'Tunique traditionnelle Brodé', status: 'Ready', price: 35000, total_paid: 35000, payments: [{ amount: 35000, date: '2026-07-03' }], created_at: new Date().toISOString() }
        ];
        
        const localCatalog = storedCatalog ? JSON.parse(storedCatalog) : [
          { id: 'cat1', user_id: 'guest-user-id', title: 'Robe Bazin Chic', description: 'Superbe robe longue brodée de fils dorés', price: 45000, image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60', category: 'Femme' }
        ];
        
        if (!storedClients) localStorage.setItem('stylistepro_guest_clients', JSON.stringify(localClients));
        if (!storedOrders) localStorage.setItem('stylistepro_guest_orders', JSON.stringify(localOrders));
        if (!storedCatalog) localStorage.setItem('stylistepro_guest_catalog', JSON.stringify(localCatalog));
        
        const enrichedOrders = localOrders.map((order: any) => ({
          ...order,
          clients: localClients.find((c: any) => c.id === order.client_id)
        }));
        
        setClients(localClients);
        setOrders(enrichedOrders);
        setCatalog(localCatalog);
      } catch (err) {
        console.error("Local data load error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
      return;
    }

    if (!navigator.onLine) {
        setError("Vous êtes hors-ligne.");
        return;
    }
    try {
      if (!isSilent) {
          if (clients.length === 0 && orders.length === 0) setLoading(true);
          else setRefreshing(true);
      }
      
      setError(null);
      const [clientRes, orderRes, catalogRes] = await Promise.all([
          supabase.from('clients').select('*').eq('user_id', ownerId).order('name'),
          supabase.from('orders').select('*').eq('user_id', ownerId).order('created_at', { ascending: false }),
          supabase.from('catalog').select('*').eq('user_id', ownerId).order('created_at', { ascending: false })
      ]);
      
      if (clientRes.error) throw clientRes.error;
      if (orderRes.error) throw orderRes.error;
      if (catalogRes.error) throw catalogRes.error;
      
      const loadedClients = clientRes.data || [];
      const enrichedOrders = (orderRes.data || []).map(order => ({ 
          ...order, 
          clients: loadedClients.find(c => c.id === order.client_id) 
      }));
      
      setClients(loadedClients);
      setOrders(enrichedOrders);
      setCatalog(catalogRes.data || []);
      await checkUnreadSupport(ownerId);
    } catch (err: any) {
      console.error("Fetch Data Error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (localStorage.getItem('stylistepro_guest_session') === 'true') {
        localStorage.removeItem('stylistepro_guest_session');
        setSession(null);
        setClients([]);
        setOrders([]);
        setCatalog([]);
        setUserProfile(null);
      } else if (isStaffSession) {
        setIsStaffSession(false);
        setStaffProfile(null);
        setSession(null);
        localStorage.removeItem('stylistepro_staff');
      } else {
        await supabase.auth.signOut();
      }
      setShowLanding(true);
      setActiveTab('dashboard');
    } catch (e) { console.error("Logout error", e); }
  };

  const currentOwnerId = isStaffSession && staffProfile ? staffProfile.owner_id : session?.user?.id;
  const currentUserId = isStaffSession && staffProfile ? staffProfile.id : session?.user?.id;
  const userPermissions: Permission[] = isStaffSession && staffProfile ? (staffProfile.permissions || []) : ['manage_clients', 'manage_orders', 'manage_catalog', 'view_finance', 'delete_data', 'manage_team'];
  const shopName = userProfile?.shop_name || "Mon Atelier";
  const shopLogo = userProfile?.shop_logo_data || userProfile?.avatar_data || userProfile?.logo_url;
  const subscriptionPlan = userProfile?.subscription_plan || 'free';
  const isPro = subscriptionPlan === 'pro';
  const isSuperAdmin = !!userProfile?.is_super_admin;

  const readyOrdersCount = orders.filter(o => o.status === 'Ready').length;
  const totalNotifs = unreadSupportMessages + readyOrdersCount;

  if (isAdminPortal) return <SuperAdmin onExit={() => setIsAdminPortal(false)} />;
  if (loading) return null;
  if (!session && showLanding) return <LandingPage onStart={() => setShowLanding(false)} />;
  if (!session) return <Auth onStaffLogin={handleStaffLoginSuccess} />;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-white shadow-2xl z-30">
        <div onClick={() => { setActiveTab('dashboard'); }} className="h-24 flex items-center px-6 gap-4 cursor-pointer hover:bg-slate-800/50 transition-colors">
          <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-700 shadow-lg">
             {shopLogo ? <img src={shopLogo} alt="Logo" className="w-full h-full object-cover"/> : <Store className="text-pink-500" size={24} />}
          </div>
          <div className="overflow-hidden">
             <h1 className="text-lg font-bold tracking-tight truncate text-white">{shopName}</h1>
             <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 mt-1 w-fit uppercase ${isPro ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                 {isPro ? <Crown size={10}/> : <Lock size={10}/>} {isPro ? 'PRO' : 'Standard'}
             </div>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 px-4 pt-4 overflow-y-auto no-scrollbar">
          <SidebarItem id="dashboard" label="Tableau de bord" icon={LayoutDashboard} activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarItem id="clients" label="Clients & Mesures" icon={Users} activeTab={activeTab} setActiveTab={setActiveTab} permissions={userPermissions} requiredPermission="manage_clients" />
          <SidebarItem id="orders" label="Commandes" icon={FileText} activeTab={activeTab} setActiveTab={setActiveTab} permissions={userPermissions} requiredPermission="manage_orders" />
          <SidebarItem id="catalogue" label="Catalogue" icon={BookOpen} activeTab={activeTab} setActiveTab={setActiveTab} permissions={userPermissions} requiredPermission="manage_catalog" />
          <SidebarItem id="finance" label="Finances" icon={CreditCard} activeTab={activeTab} setActiveTab={setActiveTab} permissions={userPermissions} requiredPermission="view_finance" />
          <SidebarItem id="team" label="Personnel" icon={Briefcase} activeTab={activeTab} setActiveTab={setActiveTab} permissions={userPermissions} requiredPermission="manage_team" />
          
          <div className="pt-4 mt-4 border-t border-slate-800">
            <SidebarItem id="documentation" label="Guide d'utilisation" icon={HelpCircle} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </nav>

        {isSuperAdmin && (
             <div className="px-4 mb-4">
                 <button onClick={() => setIsAdminPortal(true)} className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:border-pink-600 hover:text-white hover:bg-pink-600/10 font-bold flex items-center justify-center gap-2 transition-all text-xs">
                     <ShieldAlert size={16}/> Backoffice Master
                 </button>
             </div>
        )}

        <div className="p-6 mt-auto">
           <div className="flex items-center gap-2 opacity-50 mb-1">
             <Scissors className="text-pink-500" size={14} />
             <span className="font-bold text-lg tracking-tight">Styliste<span className="text-pink-500">Pro</span></span>
           </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 md:h-20 bg-white/70 backdrop-blur-lg border-b border-slate-200/40 flex items-center justify-between px-4 md:px-10 z-20 shrink-0">
          <div className="flex-1 flex items-center gap-2 md:gap-4 overflow-hidden min-w-0">
             {activeTab !== 'dashboard' && (
                <button onClick={() => setActiveTab('dashboard')} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all active:scale-90 flex items-center justify-center shrink-0" title="Retour">
                    <ChevronLeft size={24} />
                </button>
             )}
             <div className="flex items-center gap-2 md:gap-3 md:hidden min-w-0 overflow-hidden">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden shadow-sm border border-slate-100">
                    {shopLogo ? <img src={shopLogo} alt="Logo" className="w-full h-full object-cover"/> : <Store className="text-pink-500" size={18} />}
                </div>
                <div className="flex flex-col min-w-0 text-left">
                    <h2 className="font-bold text-slate-900 text-[10px] leading-tight truncate tracking-tight uppercase">{shopName}</h2>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 relative" ref={notifRef}>
             <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`p-2.5 md:p-3 rounded-xl transition-all active:scale-90 relative ${showNotifDropdown ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}
                title="Notifications"
             >
                <Bell size={20} className="md:w-[22px] md:h-[22px]" />
                {totalNotifs > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 md:w-4.5 md:h-4.5 bg-pink-600 text-white text-[8px] md:text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-lg animate-pulse">
                    {totalNotifs}
                  </span>
                )}
             </button>

             {showNotifDropdown && (
               <div className="absolute top-full right-0 mt-2 w-72 md:w-80 bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden animate-fade-in-up z-50">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Notifications</h4>
                    {totalNotifs > 0 && <span className="text-[9px] bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full font-black uppercase">{totalNotifs} Alertes</span>}
                  </div>
                  <div className="max-h-96 overflow-y-auto no-scrollbar">
                    {unreadSupportMessages > 0 && (
                      <button 
                        onClick={() => { setActiveTab('support'); setShowNotifDropdown(false); }}
                        className="w-full p-4 hover:bg-pink-50 text-left border-b border-slate-50 flex gap-3 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                          <MessageSquare size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                             <p className="text-xs font-black text-slate-900">Nouveaux Messages</p>
                             <span className="bg-pink-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">{unreadSupportMessages}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">L'administrateur vous a répondu.</p>
                        </div>
                      </button>
                    )}
                    {readyOrdersCount > 0 && (
                      <button 
                        onClick={() => { setActiveTab('orders'); setShowNotifDropdown(false); }}
                        className="w-full p-4 hover:bg-green-50 text-left border-b border-slate-50 flex gap-3 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                          <CheckCircle size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">Commandes Prêtes</p>
                          <p className="text-[10px] text-slate-500 font-medium">{readyOrdersCount} tenue{readyOrdersCount > 1 ? 's' : ''} attend{readyOrdersCount > 1 ? 'ent' : ''} d'être livrée{readyOrdersCount > 1 ? 's' : ''}.</p>
                        </div>
                      </button>
                    )}
                    {totalNotifs === 0 && (
                      <div className="p-10 text-center text-slate-400">
                        <Sparkles size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="text-xs font-bold">Aucune alerte.</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 flex justify-center border-t border-slate-100">
                    <button onClick={() => setShowNotifDropdown(false)} className="text-[9px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors">Fermer</button>
                  </div>
               </div>
             )}

             <button 
                onClick={() => setActiveTab('support')} 
                className={`hidden md:flex relative p-2 md:p-3 rounded-full transition-all active:scale-90 ${activeTab === 'support' ? 'bg-pink-50 text-pink-600' : 'text-slate-400 hover:bg-slate-50'}`}
                title="Support"
             >
                <MessageSquare size={20} className="md:w-[22px] md:h-[22px]" />
                {unreadSupportMessages > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-pink-600 text-white text-[8px] md:text-[9px] font-bold rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                        {unreadSupportMessages}
                    </span>
                )}
             </button>

             <button 
                onClick={() => setActiveTab('profile')} 
                className={`hidden md:flex p-2 md:p-3 rounded-full transition-all active:scale-90 ${activeTab === 'profile' ? 'bg-pink-50 text-pink-600' : 'text-slate-400 hover:bg-slate-50'}`}
                title="Réglages"
             >
                <Settings size={20} className="md:w-[22px] md:h-[22px]" />
             </button>
          </div>
        </header>

        <main className={`flex-1 overflow-auto bg-white ${activeTab === 'support' ? 'p-0 pb-0' : (activeTab === 'documentation' ? 'p-0 pb-40' : 'p-3 md:p-10 pb-40')}`}>
           {error && (
             <div className="max-w-7xl mx-auto mb-6 p-4 bg-red-50 border-2 border-red-100 text-red-600 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
               <div className="flex items-center gap-4 text-center md:text-left">
                 <AlertCircle size={24} className="shrink-0"/>
                 <div>
                    <span className="text-[9px] font-black uppercase tracking-widest block mb-0.5">Erreur réseau</span>
                    <span className="text-[10px] font-medium opacity-80">{error}</span>
                 </div>
               </div>
               <button onClick={() => currentOwnerId ? fetchData(currentOwnerId, false) : window.location.reload()} className="text-[9px] font-black uppercase tracking-widest bg-white text-slate-900 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all border border-red-200 flex items-center gap-2">
                 <RefreshCw size={12}/> Réessayer
               </button>
             </div>
           )}
           
           {!error && activeTab === 'dashboard' && <Dashboard clients={clients} orders={orders} onNavigate={setActiveTab} permissions={userPermissions} onOpenSupport={() => setActiveTab('support')} />}
           {!error && activeTab === 'clients' && <ClientManager clients={clients} refreshData={() => fetchData(currentOwnerId!, true)} permissions={userPermissions} ownerId={currentOwnerId!} />}
           {!error && activeTab === 'orders' && <OrderManager orders={orders} clients={clients} refreshData={() => fetchData(currentOwnerId!, true)} permissions={userPermissions} ownerId={currentOwnerId!} isPro={isPro} shopOwnerName={userProfile?.owner_full_name} webhookUrl={userProfile?.whatsapp_webhook_url} shopLogo={shopLogo} shopIfu={userProfile?.ifu_number} shopPhone={userProfile?.phone} />}
           {!error && activeTab === 'finance' && <FinanceView orders={orders} />}
           {!error && activeTab === 'catalogue' && <CatalogueManager catalog={catalog} refreshData={() => fetchData(currentOwnerId!, true)} permissions={userPermissions} ownerId={currentOwnerId!} />}
           {!error && activeTab === 'team' && <TeamManager ownerId={currentOwnerId!} shopName={shopName} userProfile={userProfile} />}
           {!error && activeTab === 'profile' && <ProfileManager userProfile={userProfile} refreshProfile={() => fetchUserProfile(currentOwnerId!)} isStaff={isStaffSession} staffProfile={staffProfile} onStaffUpdate={handleStaffUpdate} onLogout={handleLogout} />}
           {!error && activeTab === 'documentation' && <Documentation />}
           {!error && activeTab === 'support' && <SupportMessaging ownerId={currentOwnerId!} currentUserId={currentUserId!} onNotificationRefresh={() => checkUnreadSupport(currentOwnerId!)} persistedTicketId={activeSupportTicketId} onTicketChange={setActiveSupportTicketId} />}
        </main>

        <div className="md:hidden fixed bottom-6 left-4 right-4 bg-white/80 backdrop-blur-xl border border-slate-200/50 px-4 py-2 flex justify-between items-center z-40 rounded-[2.5rem] shadow-2xl shadow-slate-900/10 h-16">
            <MobileNavItem id="dashboard" active={activeTab} onClick={setActiveTab} icon={Home} visible={true} label="Accueil" />
            <MobileNavItem id="clients" active={activeTab} onClick={setActiveTab} icon={Users} visible={userPermissions.includes('manage_clients')} label="Clients" />
            <MobileNavItem id="finance" active={activeTab} onClick={setActiveTab} icon={CreditCard} visible={userPermissions.includes('view_finance')} label="Finance" />
            
            <div className="relative -top-8 px-1">
                <button 
                  onClick={() => setActiveTab('orders')} 
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 border-4 border-white ${activeTab === 'orders' ? 'bg-slate-900 text-white shadow-slate-900/40' : 'bg-pink-600 text-white shadow-pink-600/40'}`}
                >
                    <FileText size={22} />
                </button>
            </div>

            <MobileNavItem id="support" active={activeTab} onClick={setActiveTab} icon={MessageSquare} visible={true} label="Support" badgeCount={unreadSupportMessages} />
            <MobileNavItem id="profile" active={activeTab} onClick={setActiveTab} icon={Settings} visible={true} label="Réglages" />
        </div>

        {currentOwnerId && !isSuperAdmin && !['support', 'documentation'].includes(activeTab) && (
            <VoiceClientAdder ownerId={currentOwnerId} clients={clients} orders={orders} onSuccess={() => fetchData(currentOwnerId, true)} subscriptionPlan={subscriptionPlan} onRequestUpgrade={() => setActiveTab('profile')} />
        )}
      </div>
    </div>
  );
}

function SidebarItem({ id, label, icon: Icon, activeTab, setActiveTab, permissions, requiredPermission }: any) {
    if (requiredPermission && permissions && !permissions.includes(requiredPermission)) return null;
    const isActive = activeTab === id;
    return (
        <button onClick={() => setActiveTab(id)} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${isActive ? 'bg-pink-600 text-white shadow-lg font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Icon size={20} />
            <span className="text-sm">{label}</span>
        </button>
    );
}

function MobileNavItem({ id, active, onClick, icon: Icon, visible, badgeCount, label }: any) {
    if (!visible) return null;
    const isActive = active === id;
    return (
        <button onClick={() => onClick(id)} className={`flex flex-col items-center gap-1 px-1 relative transition-all active:scale-75 ${isActive ? 'text-pink-600' : 'text-slate-400'}`}>
            <div className="relative">
                <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                {badgeCount > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[12px] h-[12px] bg-pink-600 text-white text-[6px] font-black rounded-full flex items-center justify-center border border-white shadow-sm px-0.5 animate-pulse">{badgeCount}</span>}
            </div>
            <span className="text-[6px] font-black uppercase tracking-widest">{label}</span>
        </button>
    )
}
