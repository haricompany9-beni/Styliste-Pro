
import React, { useState, useEffect, useMemo } from 'react';
import { Client, Order, Permission } from '../types';
import { supabase } from '../supabaseClient';
import { 
  Plus, Search, MessageCircle, Printer, CreditCard, 
  Clock, X, Sparkles, AlertTriangle, Calendar, Trash2, MoreVertical, Loader2, Download, CheckCheck, Send, UserCheck, ShieldCheck,
  Phone
} from 'lucide-react';

interface OrderManagerProps {
  orders: Order[];
  clients: Client[];
  refreshData: () => void;
  permissions: Permission[];
  ownerId: string;
  shopLogo?: string;
  shopIfu?: string;
  shopPhone?: string;
  shopOwnerName?: string;
  isPro?: boolean;
  webhookUrl?: string;
}

const statusConfig = {
  'Pending': { color: 'bg-slate-100 text-slate-600', label: 'Attente' },
  'In Progress': { color: 'bg-blue-100 text-blue-700', label: 'En cours' },
  'Ready': { color: 'bg-orange-100 text-orange-700', label: 'Prêt' },
  'Delivered': { color: 'bg-green-100 text-green-700', label: 'Livré' }
};

export default function OrderManager({ orders, clients, refreshData, permissions, ownerId, shopLogo, shopIfu, shopPhone, shopOwnerName, isPro = false, webhookUrl }: OrderManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [currentUserName, setCurrentUserName] = useState<string>('');

  useEffect(() => { 
      fetchPaymentMethods();
      getCurrentUser();
  }, [ownerId]);

  const getCurrentUser = async () => {
      const storedStaff = localStorage.getItem('stylistepro_staff');
      if (storedStaff) {
          const staff = JSON.parse(storedStaff);
          setCurrentUserName(staff.full_name);
      } else if (shopOwnerName) {
          setCurrentUserName(shopOwnerName);
      } else {
          setCurrentUserName("Responsable d'Atelier");
      }
  };

  const fetchPaymentMethods = async () => {
      if(!ownerId) return;
      if (ownerId === 'guest-user-id') {
        const localProfile = localStorage.getItem('stylistepro_guest_profile');
        if (localProfile) {
          const prof = JSON.parse(localProfile);
          if (prof.payment_methods) setPaymentMethods(prof.payment_methods);
        }
        return;
      }
      const { data } = await supabase.from('profiles').select('payment_methods').eq('id', ownerId).maybeSingle();
      if(data?.payment_methods) setPaymentMethods(data.payment_methods);
  };

  const filtered = orders.filter(o => 
    (o.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.model_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.clients?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusUpdate = async (order: Order, newStatus: string) => {
    try {
      if (ownerId === 'guest-user-id') {
        const storedOrders = localStorage.getItem('stylistepro_guest_orders');
        const localOrders = storedOrders ? JSON.parse(storedOrders) : [];
        const updated = localOrders.map((o: any) => o.id === order.id ? { ...o, status: newStatus } : o);
        localStorage.setItem('stylistepro_guest_orders', JSON.stringify(updated));
        refreshData();
        return;
      }
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
      if (error) throw error;
      refreshData();
    } catch (e: any) { alert("Erreur"); }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col pb-40 px-1">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Commandes</h2>
          <p className="text-slate-500 text-sm">Suivi des confections</p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black shadow-lg uppercase tracking-widest text-xs active:scale-95 transition-all">
          <Plus size={14} className="mr-2 inline"/> Nouvelle Commande
        </button>
      </div>

      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-3 items-center">
        <Search className="text-slate-400" size={18} />
        <input type="text" placeholder="Rechercher..." className="w-full outline-none text-sm font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(order => (
          <div key={order.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col relative group">
            <div className="flex justify-between items-start mb-4">
              <div className="min-w-0">
                <h3 className="font-black text-slate-900 text-base truncate">{order.model_name || "Confection Standard"}</h3>
                <span className="text-pink-600 font-bold text-xs uppercase tracking-wider">{order.clients?.name}</span>
              </div>
              <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${statusConfig[order.status].color}`}>
                {statusConfig[order.status].label}
              </div>
            </div>
            
            <p className="text-slate-500 text-xs line-clamp-2 mb-6 h-8 font-medium italic">
              {order.description || "Aucun détail saisi."}
            </p>

            <div className="mt-auto">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Avancement</span>
                <span className="font-black text-slate-900 text-sm">{order.price.toLocaleString()} F</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-pink-600 rounded-full transition-all" style={{ width: `${(order.total_paid / order.price) * 100}%` }} />
              </div>
              
              <div className="flex gap-2">
                <select 
                  value={order.status} 
                  onChange={(e) => handleStatusUpdate(order, e.target.value)} 
                  className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest rounded-xl px-3 py-2 flex-1 outline-none"
                > 
                  {Object.keys(statusConfig).map(s => <option key={s} value={s}>{statusConfig[s as keyof typeof statusConfig].label}</option>)} 
                </select>
                <button onClick={() => setSelectedOrder(order)} className="p-2.5 bg-slate-900 text-white rounded-xl active:scale-95 transition-all"><Printer size={18}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && <OrderForm clients={clients} onClose={() => setIsFormOpen(false)} onSuccess={() => { setIsFormOpen(false); refreshData(); }} ownerId={ownerId} />}
      {selectedOrder && (
        <InvoiceModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          shopLogo={shopLogo} 
          shopIfu={shopIfu} 
          shopPhone={shopPhone} 
          shopOwnerName={shopOwnerName}
          currentUser={currentUserName}
          paymentMethods={paymentMethods}
        />
      )}
    </div>
  );
}

export function InvoiceModal({ order, onClose, shopLogo, shopIfu, shopPhone, shopOwnerName, currentUser, paymentMethods = [] }: any) {
    const printInvoice = () => {
        const content = document.getElementById('invoice-content');
        if (!content) return;
        const win = window.open('', '', 'height=1000,width=800');
        if(win) {
            win.document.write('<html><head><title>Facture Prestige</title><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet"><style>body{font-family:"Montserrat", sans-serif; -webkit-print-color-adjust: exact;}</style></head><body>');
            win.document.write(content.innerHTML);
            win.document.write('</body></html>');
            win.document.close();
            setTimeout(() => win.print(), 800);
        }
    };

    const remaining = (order.price || 0) - (order.total_paid || 0);

    return (
        <div className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-0 md:p-6 animate-fade-in">
          <div className="bg-white w-full max-w-4xl h-full md:h-[95vh] flex flex-col md:rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-pink-600 rounded-xl text-white shadow-lg"><Printer size={22}/></div>
                 <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Facturation Prestige</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={printInvoice} className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black rounded-xl flex items-center gap-2 active:scale-95 shadow-lg tracking-widest">IMPRIMER</button>
                <button onClick={onClose} className="p-2.5 hover:bg-slate-200 rounded-full text-slate-400 active:scale-90"><X size={24}/></button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-100 p-2 md:p-12 flex justify-center no-scrollbar">
              <div id="invoice-content" className="bg-white w-full max-w-[210mm] p-12 md:p-16 shadow-2xl text-slate-800 min-h-[297mm] flex flex-col relative font-sans">
                {/* Filigrane Couture */}
                <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none opacity-[0.02] select-none overflow-hidden">
                    <div className="transform -rotate-45 text-[150px] font-black uppercase whitespace-nowrap text-slate-900">{shopOwnerName || "Prestige"}</div>
                </div>

                <div className="relative z-10 w-full h-full flex flex-col">
                    {/* Header - Identité Atelier */}
                    <div className="flex justify-between items-start mb-16 border-b-2 border-slate-900 pb-12">
                        <div>
                            {shopLogo ? (
                                <img src={shopLogo} alt="Logo" className="h-24 w-auto object-contain mb-6 drop-shadow-md" />
                            ) : (
                                <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-pink-600">{shopOwnerName || "Atelier Prestige"}</h1>
                            )}
                            <div className="space-y-1">
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{shopOwnerName || "Mon Atelier Haute Couture"}</p>
                                <p className="text-xs text-slate-500 font-bold">{shopPhone}</p>
                                <p className="text-[10px] text-slate-400 font-medium italic">{order.user_address || "Service de Confection Sur-Mesure"}</p>
                                {shopIfu && <p className="text-[9px] text-slate-400 font-mono mt-1">IFU: {shopIfu}</p>}
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">FACTURE</h2>
                            <div className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] inline-block mb-3">N° {order.id?.slice(-8).toUpperCase()}</div>
                            <div className="text-[11px] text-slate-400 font-black uppercase tracking-widest block">{new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                        </div>
                    </div>

                    {/* Bloc Destinataire */}
                    <div className="grid grid-cols-2 gap-12 mb-16">
                        <div className="bg-slate-50/80 p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Facturé à</h4>
                            <div className="text-2xl font-black text-slate-900 mb-2">{order.clients?.name}</div>
                            <div className="text-sm font-bold text-slate-500 flex items-center gap-2"><Phone size={14}/> {order.clients?.phone}</div>
                        </div>
                        <div className="flex flex-col justify-center text-right pr-6">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Engagement Livraison</h4>
                            <div className="text-xl font-black text-pink-600 uppercase italic tracking-tight">{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'À confirmer'}</div>
                        </div>
                    </div>

                    {/* Tableau Prestations */}
                    <div className="flex-1 mb-16">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="py-5 px-8 text-[11px] uppercase font-black tracking-widest rounded-tl-2xl">Article & Confection</th>
                                    <th className="py-5 px-8 text-[11px] uppercase font-black tracking-widest text-right rounded-tr-2xl">Montant Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 border-x border-b border-slate-100 rounded-b-2xl">
                                <tr>
                                    <td className="py-10 px-8">
                                        <div className="font-black text-slate-900 text-xl mb-2">{order.model_name || "Modèle sur Mesure"}</div>
                                        <div className="text-[11px] text-slate-500 font-medium leading-relaxed italic max-w-md">{order.description || "Confection artisanale de haute précision selon les mesures du client."}</div>
                                    </td>
                                    <td className="py-10 px-8 text-right font-black text-slate-900 text-2xl">{order.price?.toLocaleString()} F</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Paiements & Totaux */}
                    <div className="grid grid-cols-2 gap-16 pt-12 border-t-2 border-slate-900">
                        <div>
                            {paymentMethods && paymentMethods.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Transferts autorisés</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {paymentMethods.map((pm: any) => (
                                            <div key={pm.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-[11px] font-black">{pm.network.charAt(0)}</div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-900">{pm.number}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{pm.network} • {pm.name}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center text-[12px] font-black text-slate-400 uppercase tracking-widest">
                                <span>TOTAL DEVIS</span>
                                <span>{order.price?.toLocaleString()} F</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-black text-green-600 uppercase italic">
                                <span>ACOMPTES REÇUS</span>
                                <span>- {order.total_paid?.toLocaleString()} F</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-3xl shadow-2xl transform scale-105">
                                <span className="text-[11px] font-black uppercase tracking-[0.3em]">RESTE À RÉGLER</span>
                                <span className="text-3xl font-black">{remaining.toLocaleString()} F</span>
                            </div>
                        </div>
                    </div>

                    {/* Zone Signature - Dynamique */}
                    <div className="mt-24 flex justify-between items-end border-t border-slate-100 pt-12">
                        <div className="max-w-[220px]">
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Conditions</p>
                            <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed">Cette facture certifie la validité de la commande. <br/> Merci de nous faire confiance.</p>
                        </div>
                        <div className="text-center w-64">
                            <p className="text-[10px] font-black uppercase text-slate-900 mb-2 tracking-[0.2em]">Signature</p>
                            <p className="text-[13px] font-black text-pink-600 mb-12 italic">{currentUser}</p>
                            <div className="w-full h-[1.5px] bg-slate-900 mb-3"></div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Cachet & Signature de l'Atelier</p>
                        </div>
                    </div>

                    <div className="mt-auto pt-12 text-center border-t border-slate-50">
                        <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.4em]">STYLÏSTEPRÖ • L'EXCELLENCE DE LA COUTURE CONNECTÉE</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
}

function OrderForm({ clients, onClose, onSuccess, ownerId }: any) {
  const [formData, setFormData] = useState({ client_id: '', model_name: '', description: '', price: '', deposit: '', delivery_date: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const price = parseFloat(formData.price);
    const deposit = parseFloat(formData.deposit) || 0;
    try {
      if (ownerId === 'guest-user-id') {
        const storedOrders = localStorage.getItem('stylistepro_guest_orders');
        const localOrders = storedOrders ? JSON.parse(storedOrders) : [];
        const newOrder = {
          id: 'order_' + Math.random().toString(36).substr(2, 9),
          user_id: ownerId,
          client_id: formData.client_id,
          model_name: formData.model_name,
          description: formData.description,
          price: price,
          total_paid: deposit,
          status: deposit > 0 ? 'In Progress' : 'Pending',
          delivery_date: formData.delivery_date || null,
          payments: deposit > 0 ? [{ amount: deposit, date: new Date().toISOString() }] : [],
          created_at: new Date().toISOString()
        };
        localOrders.push(newOrder);
        localStorage.setItem('stylistepro_guest_orders', JSON.stringify(localOrders));
        onSuccess();
        return;
      }
      const { error } = await supabase.from('orders').insert([{ 
          user_id: ownerId, 
          client_id: formData.client_id, 
          model_name: formData.model_name,
          description: formData.description, 
          price: price, 
          total_paid: deposit, 
          status: deposit > 0 ? 'In Progress' : 'Pending', 
          delivery_date: formData.delivery_date || null, 
          payments: deposit > 0 ? [{ amount: deposit, date: new Date().toISOString() }] : [] 
      }]);
      if (error) throw error;
      onSuccess();
    } catch(e: any) { alert("Erreur."); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-lg">Nouvelle Confection</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div> 
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Client</label> 
            <select required className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}> 
              <option value="">Choisir un client...</option> 
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)} 
            </select> 
          </div>
          <div>
             <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Modèle</label>
             <input required className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="Ex: Robe de Soirée Bazin" value={formData.model_name} onChange={e => setFormData({...formData, model_name: e.target.value})} />
          </div>
          <div> 
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Description</label> 
            <textarea className="w-full p-4 bg-slate-50 border-none rounded-2xl h-24 font-bold" placeholder="Tissu, accessoires..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /> 
          </div>
          <div className="grid grid-cols-2 gap-4"> 
            <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Prix Total</label><input required type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div> 
            <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Acompte</label><input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black" value={formData.deposit} onChange={e => setFormData({...formData, deposit: e.target.value})} /></div> 
          </div>
          <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Date Livraison</label><input type="date" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={formData.delivery_date} onChange={e => setFormData({...formData, delivery_date: e.target.value})} /></div>
          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest mt-4">
            {loading ? 'Enregistrement...' : 'Valider la commande'}
          </button>
        </form>
      </div>
    </div>
  );
}
