
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Users, DollarSign, Activity, Search, Shield, 
  Trash2, Lock, Unlock, Crown, AlertTriangle, 
  Database, RefreshCw, ArrowLeft, X, Loader2,
  Paperclip, FileText, User, Send
} from 'lucide-react';

interface SuperAdminProps {
    onExit?: () => void;
}

export default function SuperAdmin({ onExit }: SuperAdminProps) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClients: 0,
    totalOrders: 0,
    totalRevenueVolume: 0,
    mrr: 0, 
    proUsers: 0,
    basicUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // SUPPORT STATE
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGlobalData();
    fetchTickets();
    const interval = setInterval(() => {
        if (navigator.onLine) {
            fetchTickets(false);
            fetchGlobalData(false);
        }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [replies]);

  const formatError = (e: any): string => {
    if (!e) return "Erreur inconnue";
    if (typeof e === 'string') return e;
    const msg = e.message || e.error_description || (e.error && e.error.message) || JSON.stringify(e);
    const hint = e.hint ? `\nConseil : ${e.hint}` : '';
    const details = e.details && typeof e.details === 'string' ? `\nDétails : ${e.details}` : '';
    return `${msg}${hint}${details}`;
  };

  const fetchGlobalData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    if (!navigator.onLine) return;
    try {
      const { data: profilesData, error: pError } = await supabase.from('profiles').select('*');
      if (pError) throw pError;

      const { count: clientsCount } = await supabase.from('clients').select('id', { count: 'exact', head: true });
      const { count: ordersCount } = await supabase.from('orders').select('id', { count: 'exact', head: true });
      
      const proCount = profilesData?.filter(p => p.subscription_plan === 'pro').length || 0;
      const basicCount = profilesData?.filter(p => p.subscription_plan === 'basic').length || 0;
      const mrr = (proCount * 500) + (basicCount * 100);

      const enrichedProfiles = await Promise.all((profilesData || []).map(async (p) => {
          const { count: cCount } = await supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', p.id);
          const { count: oCount } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', p.id);
          return { ...p, client_count: cCount || 0, order_count: oCount || 0 };
      }));

      setProfiles(enrichedProfiles);
      setStats({
        totalUsers: profilesData?.length || 0,
        totalClients: clientsCount || 0,
        totalOrders: ordersCount || 0,
        totalRevenueVolume: 0,
        mrr,
        proUsers: proCount,
        basicUsers: basicCount
      });
    } catch (e) { console.error("Global fetch error:", formatError(e)); }
    finally { if (showLoading) setLoading(false); }
  };

  const fetchTickets = async (showLoading = true) => {
      if (!navigator.onLine) return;
      try {
          // Note : on n'utilise pas support_replies ici donc pas d'ambiguïté PGRST201 directe,
          // mais on garde profiles() pour les infos shop
          const { data, error } = await supabase
            .from('support_messages')
            .select('*, profiles(shop_name, phone, avatar_data)')
            .order('created_at', { ascending: false });
          if (error) throw error;
          if (data) setTickets(data);
      } catch (e) {
          console.error("Tickets fetch error:", formatError(e));
      }
  };

  const openTicket = async (ticket: any) => {
      setActiveTicket(ticket);
      if (!navigator.onLine) return;
      try {
          const { data, error } = await supabase
            .from('support_replies')
            .select('*')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: true });
          
          if (error) throw error;
          if (data) setReplies(data);
      } catch (e) {
          console.error("Replies fetch error:", formatError(e));
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedFile({ name: file.name, data: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdminReply = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeTicket || (!adminReplyText.trim() && !attachedFile)) return;
      setSendingReply(true);
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          const payload = {
              ticket_id: activeTicket.id,
              sender_id: user.id,
              message: adminReplyText,
              is_admin: true,
              file_data: attachedFile?.data || null,
              file_name: attachedFile?.name || null
          };

          const { data, error } = await supabase.from('support_replies').insert([payload]).select().single();

          if (error) throw error;
          
          setReplies(prev => [...prev, data]);
          setAdminReplyText('');
          setAttachedFile(null);
          
          await supabase.from('support_messages').update({ status: 'open' }).eq('id', activeTicket.id);
      } catch (e: any) { 
          console.error("Admin reply error:", formatError(e));
          alert("Erreur admin : " + formatError(e));
      }
      finally { setSendingReply(false); }
  };

  const toggleSubscription = async (userId: string, currentPlan: string) => {
      setIsUpdating(userId);
      const newPlan = currentPlan === 'pro' ? 'free' : 'pro';
      try {
          const { error } = await supabase.from('profiles').update({ 
              subscription_plan: newPlan,
              subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          }).eq('id', userId);
          if (error) throw error;
          fetchGlobalData(false);
      } catch (e) { 
          console.error("Toggle sub error:", formatError(e));
          alert("Erreur : " + formatError(e));
      } 
      finally { setIsUpdating(null); }
  };

  const deleteUser = async (userId: string) => {
      if(!window.confirm("Confirmer la suppression de cet atelier ?")) return;
      setIsUpdating(userId);
      try {
          const { error } = await supabase.from('profiles').delete().eq('id', userId);
          if (error) throw error;
          fetchGlobalData(false);
      } catch (e) { 
          console.error("Delete user error:", formatError(e));
          alert("Erreur : " + formatError(e));
      } 
      finally { setIsUpdating(null); }
  };

  const filteredProfiles = profiles.filter(p => 
      (p.shop_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.owner_full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-pink-500" size={40}/></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans flex flex-col md:flex-row gap-8 overflow-hidden">
        <div className="w-full md:w-72 shrink-0 space-y-4 flex flex-col h-[90vh]">
            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3 mb-6">
                <Shield className="text-pink-600" size={28}/> Master
            </h1>
            <button onClick={() => setActiveTicket(null)} className={`w-full text-left px-5 py-4 rounded-2xl font-black transition-all ${!activeTicket ? 'bg-pink-600 text-white' : 'text-slate-500 hover:bg-slate-900'}`}>Tableau Global</button>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 no-scrollbar">
                <h4 className="text-[10px] font-black text-slate-600 uppercase px-5 mb-4 tracking-widest">Support</h4>
                {tickets.map(t => (
                    <button key={t.id} onClick={() => openTicket(t)} className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${activeTicket?.id === t.id ? 'bg-slate-900 border-pink-500/50' : 'border-transparent hover:bg-slate-900'}`}>
                        <div className="font-bold text-xs text-slate-200 truncate">{t.profiles?.shop_name || 'Sans Nom'}</div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">{t.subject}</div>
                    </button>
                ))}
            </div>
            <button onClick={onExit} className="mt-auto flex items-center gap-3 text-slate-600 hover:text-white px-5 py-4 transition-colors font-black text-xs uppercase tracking-widest">
                <ArrowLeft size={16}/> Fermer Master
            </button>
        </div>

        <div className="flex-1 overflow-hidden">
            {activeTicket ? (
                <div className="h-full bg-slate-900 rounded-[2.5rem] border border-slate-800 flex flex-col overflow-hidden animate-fade-in shadow-2xl">
                    <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-pink-600">
                                {activeTicket.profiles?.avatar_data ? <img src={activeTicket.profiles.avatar_data} className="w-full h-full object-cover"/> : <User className="w-full h-full p-2 bg-slate-800"/>}
                            </div>
                            <h2 className="text-lg font-black text-white">{activeTicket.subject}</h2>
                        </div>
                        <button onClick={() => setActiveTicket(null)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-all"><X size={20}/></button>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                         <div className="flex flex-col items-start max-w-[80%]">
                             <div className="bg-slate-800 text-slate-200 p-5 rounded-2xl rounded-tl-none border border-slate-700/50 text-sm">
                                 {activeTicket.message}
                             </div>
                             <div className="text-[9px] text-slate-600 font-bold mt-2 ml-1">{new Date(activeTicket.created_at).toLocaleString()}</div>
                         </div>

                         {replies.map(r => (
                             <div key={r.id} className={`flex flex-col ${r.is_admin ? 'items-end' : 'items-start'} animate-fade-in`}>
                                 <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-lg ${r.is_admin ? 'bg-pink-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/30'}`}>
                                     {r.message && <p>{r.message}</p>}
                                     {r.file_data && <div className="mt-2 p-2 bg-black/20 rounded-lg flex items-center gap-2 text-[10px] truncate"><FileText size={14}/> {r.file_name}</div>}
                                 </div>
                                 <div className="text-[9px] text-slate-600 font-bold mt-1 mx-1">{new Date(r.created_at).toLocaleTimeString()}</div>
                             </div>
                         ))}
                    </div>

                    <div className="p-6 bg-slate-950 border-t border-slate-800">
                        <form onSubmit={handleAdminReply} className="flex gap-4">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400"><Paperclip size={20}/></button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                            <input className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-pink-600 transition-all font-medium" placeholder="Répondre..." value={adminReplyText} onChange={e => setAdminReplyText(e.target.value)}/>
                            <button disabled={sendingReply || (!adminReplyText.trim() && !attachedFile)} className="bg-pink-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-pink-700 transition-all disabled:opacity-50">
                                {sendingReply ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="h-full overflow-y-auto pr-4 space-y-8 no-scrollbar">
                    <div className="flex justify-between items-center">
                        <h2 className="text-4xl font-black text-white tracking-tighter">Master Dashboard</h2>
                        <button onClick={() => fetchGlobalData()} className="p-4 bg-slate-900 hover:bg-slate-800 rounded-2xl border border-slate-800 text-pink-500 transition-all"><RefreshCw size={24}/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KpiCard title="MRR" value={`${stats.mrr.toLocaleString()} F`} icon={<DollarSign size={24}/>} color="green" />
                        <KpiCard title="Users" value={stats.totalUsers} icon={<Users size={24}/>} color="blue" />
                        <KpiCard title="Clients" value={stats.totalClients} icon={<Database size={24}/>} color="purple" />
                        <KpiCard title="Orders" value={stats.totalOrders} icon={<Activity size={24}/>} color="orange" />
                    </div>
                    <div className="bg-slate-900 rounded-[3rem] border border-slate-800 overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <h3 className="text-xl font-black text-white">Registre Ateliers</h3>
                            <div className="relative w-full sm:w-96">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={18}/>
                                <input type="text" placeholder="Rechercher..." className="w-full pl-14 pr-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-slate-200 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-950/50 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                                        <th className="px-10 py-6">Atelier</th>
                                        <th className="px-10 py-6">Offre</th>
                                        <th className="px-10 py-6 text-center">Stats</th>
                                        <th className="px-10 py-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {filteredProfiles.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-800/20 transition-all">
                                            <td className="px-10 py-7">
                                                <div className="font-black text-slate-100 text-base">{p.shop_name || 'Sans Nom'}</div>
                                                <div className="text-xs text-slate-600 font-bold uppercase">{p.owner_full_name}</div>
                                            </td>
                                            <td className="px-10 py-7">
                                                {p.subscription_plan === 'pro' ? <span className="text-pink-600 text-[10px] font-black uppercase border border-pink-600/20 px-3 py-1 rounded-xl">PRO</span> : <span className="text-slate-500 text-[10px] font-black uppercase">STANDARD</span>}
                                            </td>
                                            <td className="px-10 py-7 text-center">
                                                <div className="font-black text-white">{p.client_count}</div>
                                                <div className="text-[9px] text-slate-600 uppercase font-black">Clients</div>
                                            </td>
                                            <td className="px-10 py-7 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <button onClick={() => toggleSubscription(p.id, p.subscription_plan)} disabled={isUpdating === p.id} className="p-3 bg-slate-800 rounded-xl transition-all">
                                                        {p.subscription_plan === 'pro' ? <Lock size={18}/> : <Unlock size={18} className="text-pink-500"/>}
                                                    </button>
                                                    <button onClick={() => deleteUser(p.id)} className="p-3 bg-slate-900 text-red-600 rounded-xl transition-all"><Trash2 size={18}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}

function KpiCard({ title, value, icon, color }: any) {
    const colors: any = {
        green: 'bg-green-600/10 text-green-500 border-green-500/20',
        blue: 'bg-blue-600/10 text-blue-500 border-blue-500/20',
        purple: 'bg-purple-600/10 text-purple-500 border-purple-500/20',
        orange: 'bg-orange-600/10 text-orange-500 border-orange-500/20',
    };
    return (
        <div className={`p-8 rounded-[2.5rem] border ${colors[color]} bg-slate-900/60 backdrop-blur-xl relative overflow-hidden group hover:scale-[1.03] transition-all duration-500`}>
            <div className="relative z-10">
                <div className="text-3xl font-black text-white mb-2 tracking-tighter">{value}</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</div>
            </div>
            <div className={`absolute bottom-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
                {icon}
            </div>
        </div>
    )
}
