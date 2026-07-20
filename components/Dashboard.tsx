
import React, { useState, useEffect, useRef } from 'react';
import { Client, Order, Tab, Permission, SupportTicket, SupportReply } from '../types';
import { Clock, CheckCircle, Users, AlertCircle, TrendingUp, MessageCircle, Calendar, Headphones, Send, X, Loader2, ArrowRight, ArrowLeft, User, Sparkles, CreditCard, Crown, Zap } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface DashboardProps {
  clients: Client[];
  orders: Order[];
  onNavigate: (tab: Tab) => void;
  permissions: Permission[];
  onOpenSupport?: () => void;
}

export default function Dashboard({ clients, orders, onNavigate, permissions, onOpenSupport }: DashboardProps) {
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('free');

  useEffect(() => {
      const getProfile = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const { data } = await supabase.from('profiles').select('subscription_plan').eq('id', user.id).single();
              if (data) setSubscriptionPlan(data.subscription_plan || 'free');
          }
      }
      getProfile();
  }, []);

  const pendingOrders = orders.filter(o => o.status !== 'Delivered');
  const readyOrders = orders.filter(o => o.status === 'Ready');
  const monthlyRevenue = orders
    .filter(o => {
      const d = new Date(o.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((acc, curr) => acc + (curr.total_paid || 0), 0);

  const canViewFinance = permissions.includes('view_finance');

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fade-in pb-12">
      <header className="mb-2 hidden md:block">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tableau de bord.</h2>
        <p className="text-slate-500 text-sm font-medium">Aperçu global de votre atelier.</p>
      </header>

      {/* Upgrade Banner */}
      {subscriptionPlan === 'free' && (
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-4 md:p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-pink-600/20 group cursor-pointer" onClick={() => onNavigate('profile')}>
              <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform">
                      <Zap size={20} className="fill-white"/>
                  </div>
                  <div>
                      <h4 className="font-black text-sm md:text-base">Passez au niveau supérieur !</h4>
                      <p className="text-[10px] opacity-90 font-bold uppercase tracking-wider">Assistant vocal IA & WhatsApp auto.</p>
                  </div>
              </div>
              <button className="w-full md:w-auto bg-white text-pink-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg group-hover:translate-x-1 transition-transform flex items-center justify-center gap-2">
                  Passer PRO <ArrowRight size={12}/>
              </button>
          </div>
      )}

      <div className={`grid grid-cols-2 ${canViewFinance ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3`}>
        <StatCard title="En cours" value={pendingOrders.length} icon={<Clock className="text-orange-600" size={16} />} bg="bg-orange-50" onClick={() => onNavigate('orders')} />
        <StatCard title="Prêts" value={readyOrders.length} icon={<CheckCircle className="text-green-600" size={16} />} bg="bg-green-50" onClick={() => onNavigate('orders')} />
        <StatCard title="Clients" value={clients.length} icon={<Users className="text-blue-600" size={16} />} bg="bg-blue-50" onClick={() => onNavigate('clients')} />
        {canViewFinance && (
           <StatCard title="Recettes" value={`${monthlyRevenue.toLocaleString()} F`} icon={<TrendingUp className="text-pink-600" size={16} />} bg="bg-pink-50" onClick={() => onNavigate('finance')} />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-white">
                <h3 className="font-black text-xs md:text-sm text-slate-800 uppercase tracking-widest">Activités récentes</h3>
                <button onClick={() => onNavigate('orders')} className="text-[10px] font-black text-pink-600 hover:underline uppercase tracking-widest">Voir tout</button>
            </div>
            <div className="p-2 space-y-1">
                {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px]">{order.clients?.name?.charAt(0)}</div>
                            <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-xs truncate">{order.clients?.name}</div>
                                <div className="text-[9px] text-slate-500 font-medium line-clamp-1">{order.model_name || order.description}</div>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-xs font-black text-slate-900">{order.price.toLocaleString()} F</div>
                            <div className="text-[8px] uppercase font-bold text-slate-400">{new Date(order.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-6 flex flex-col justify-between overflow-hidden relative min-h-[200px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-600 rounded-full blur-[60px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          
          <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-6 relative z-10">Actions rapides</h3>
          <div className="space-y-2 flex-1 relative z-10">
             <button onClick={onOpenSupport} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-3 px-4 transition-all border border-white/5 group">
                  <div className="bg-green-600 p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform"><Headphones size={16} className="text-white"/></div>
                  <div className="text-left">
                      <div className="font-bold text-white text-[11px]">Support client</div>
                      <div className="text-[8px] font-medium text-slate-400 uppercase tracking-wider">Parler à StylistePro</div>
                  </div>
             </button>

             {canViewFinance && (
                <button onClick={() => onNavigate('finance')} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center gap-3 px-4 transition-all border border-white/5 group">
                    <div className="bg-pink-600 p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform"><CreditCard size={16} className="text-white"/></div>
                    <div className="text-left">
                        <div className="font-bold text-white text-[11px]">Mes finances</div>
                        <div className="text-[8px] font-medium text-slate-400 uppercase tracking-wider">Recettes et dettes</div>
                    </div>
                </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bg, onClick }: any) {
  return (
    <button onClick={onClick} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm text-left transition-all hover:shadow-md hover:-translate-y-0.5 group relative overflow-hidden">
       <div className={`absolute top-0 right-0 p-6 ${bg} rounded-bl-full opacity-30 transition-transform group-hover:scale-110`}></div>
       <div className="relative z-10 flex flex-col gap-1">
          <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0 shadow-sm mb-2`}>
             {icon}
          </div>
          <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</div>
          <div className="text-base font-black text-slate-900 tracking-tight">{value}</div>
       </div>
    </button>
  );
}
