
import React, { useState, useEffect } from 'react';
import { UserProfile, TeamMember } from '../types';
import { supabase } from '../supabaseClient';
import { Store, Save, Loader2, Image as ImageIcon, CreditCard, X, CheckCircle, Zap, Printer, Plus, Trash2, FileText, Crown, LogOut } from 'lucide-react';
import { InvoiceModal } from './OrderManager';

interface ProfileManagerProps {
  userProfile: UserProfile | null;
  refreshProfile: () => void;
  isStaff: boolean;
  staffProfile: TeamMember | null;
  onStaffUpdate: (s: TeamMember) => void;
  onLogout?: () => void;
}

const GSM_NETWORKS = [
    { name: 'MTN Money', color: 'bg-yellow-400', icon: 'M' },
    { name: 'Moov Money', color: 'bg-blue-600', icon: 'Mo' },
    { name: 'Orange Money', color: 'bg-orange-500', icon: 'O' },
    { name: 'Wave', color: 'bg-cyan-400', icon: 'W' },
    { name: 'Celtiis Cash', color: 'bg-red-600', icon: 'C' },
    { name: 'Autre', color: 'bg-slate-400', icon: '?' },
];

export default function ProfileManager({ userProfile, refreshProfile, isStaff, staffProfile, onStaffUpdate, onLogout }: ProfileManagerProps) {
  const [shopData, setShopData] = useState<UserProfile>({ id: '', shop_name: '', owner_full_name: '', phone: '', address: '', avatar_data: '', shop_logo_data: '', ifu_number: '', payment_methods: [], subscription_plan: 'free' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [activeSection, setActiveSection] = useState<'info' | 'payments' | 'invoice-gen' | 'subscription'>('info');

  const [manualInvoice, setManualInvoice] = useState({
      id: 'MANUAL-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      clients: { name: '', phone: '' },
      model_name: '',
      description: '',
      price: 0,
      total_paid: 0,
      payments: [] as any[],
      created_at: new Date().toISOString()
  });
  const [showManualPreview, setShowManualPreview] = useState(false);

  useEffect(() => {
    if (!isStaff && userProfile) { 
        setShopData({ ...userProfile, payment_methods: userProfile.payment_methods || [] }); 
    } 
  }, [userProfile, isStaff]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image(); img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setShopData(prev => ({...prev, shop_logo_data: dataUrl}));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveShop = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");
      const updates = { ...shopData, id: user.id, updated_at: new Date().toISOString() };
      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Paramètres enregistrés !' });
      refreshProfile();
    } catch (error: any) {
      setMessage({ type: 'error', text: String(error.message) });
    } finally { setSaving(false); }
  };

  const userName = isStaff ? staffProfile?.full_name : (userProfile?.owner_full_name || "Gérant");

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 px-4 font-sans">
      <div className="mb-8">
         <h2 className="text-3xl font-black text-slate-900 tracking-tight text-display">{isStaff ? 'Mon Profil' : 'Réglages Atelier'}</h2>
         {!isStaff && (
            <div className="flex gap-4 mt-6 border-b border-slate-200 overflow-x-auto no-scrollbar mask-gradient">
                <button onClick={() => setActiveSection('info')} className={`pb-3 text-sm font-bold transition-all px-2 whitespace-nowrap flex items-center gap-2 ${activeSection === 'info' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-slate-400'}`}><Store size={16}/> Infos Boutique</button>
                <button onClick={() => setActiveSection('payments')} className={`pb-3 text-sm font-bold transition-all px-2 whitespace-nowrap flex items-center gap-2 ${activeSection === 'payments' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-slate-400'}`}><CreditCard size={16}/> Paiements GSM</button>
                <button onClick={() => setActiveSection('invoice-gen')} className={`pb-3 text-sm font-bold transition-all px-2 whitespace-nowrap flex items-center gap-2 ${activeSection === 'invoice-gen' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-slate-400'}`}><Printer size={16}/> Facture Libre</button>
                <button onClick={() => setActiveSection('subscription')} className={`pb-3 text-sm font-bold transition-all px-2 whitespace-nowrap flex items-center gap-2 ${activeSection === 'subscription' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-slate-400'}`}><Zap size={16}/> Abonnement</button>
            </div>
         )}
      </div>

      {message && (
         <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-fade-in ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            <CheckCircle size={20}/>
            <span className="text-sm font-bold">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto opacity-50"><X size={16}/></button>
         </div>
      )}

      {activeSection === 'info' || isStaff ? (
        <div className="space-y-6 animate-fade-in">
            <form onSubmit={handleSaveShop} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 space-y-8">
                <div className="flex flex-col md:flex-row gap-12 items-center justify-center">
                    <div className="text-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Logo Atelier</label>
                        <div className="w-32 h-32 bg-slate-50 rounded-3xl overflow-hidden border-2 border-slate-200 relative group shadow-inner">
                            {shopData.shop_logo_data ? <img src={shopData.shop_logo_data} className="w-full h-full object-cover"/> : <ImageIcon className="w-10 h-10 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Nom de l'Atelier</label>
                        <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={shopData.shop_name} onChange={e => setShopData({...shopData, shop_name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Responsable</label>
                        <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={shopData.owner_full_name || ''} onChange={e => setShopData({...shopData, owner_full_name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Téléphone</label>
                        <input type="tel" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={shopData.phone || ''} onChange={e => setShopData({...shopData, phone: e.target.value})} />
                    </div>
                    
                    {/* CHAMP IFU */}
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Numéro IFU</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pink-500 transition-colors">
                                <FileText size={20}/>
                            </div>
                            <input 
                              type="text" 
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-pink-500/20 transition-all" 
                              value={shopData.ifu_number || ''} 
                              onChange={e => setShopData({...shopData, ifu_number: e.target.value})} 
                              placeholder="Identifiant Fiscal Unique" 
                            />
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400 font-medium italic">Ce numéro apparaîtra sur vos factures officielles.</p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Adresse Physique</label>
                        <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={shopData.address || ''} onChange={e => setShopData({...shopData, address: e.target.value})} />
                    </div>
                </div>
                <button type="submit" disabled={saving} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-900/10 uppercase tracking-widest text-xs">
                    {saving ? <Loader2 className="animate-spin"/> : <Save size={20}/>} Enregistrer l'Atelier
                </button>
            </form>

            <button 
                onClick={onLogout} 
                className="w-full py-4 bg-red-50 text-red-600 font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-red-100 transition-colors border border-red-100 mt-4 active:scale-95 uppercase tracking-widest text-xs"
            >
                <LogOut size={20}/> Se déconnecter
            </button>
        </div>
      ) : activeSection === 'payments' ? (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 text-display">Moyens de Paiement GSM</h3>
                        <p className="text-slate-500 text-sm">Configurez vos numéros de transfert pour les factures.</p>
                    </div>
                    <button onClick={() => setShopData(prev => ({...prev, payment_methods: [...(prev.payment_methods || []), { id: Math.random().toString(36).substr(2, 9), network: 'MTN Money', number: '', name: '' }]}))} className="p-3 bg-pink-600 text-white rounded-xl shadow-lg shadow-pink-600/20 active:scale-90 transition-all"><Plus/></button>
                </div>

                <div className="space-y-4">
                    {shopData.payment_methods?.map((method) => (
                        <div key={method.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-end">
                            <div className="w-full md:w-48">
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block">Réseau</label>
                                <select className="w-full p-3 bg-white rounded-xl font-bold text-sm outline-none border border-slate-200" value={method.network} onChange={(e) => setShopData(prev => ({...prev, payment_methods: prev.payment_methods?.map(m => m.id === method.id ? {...m, network: e.target.value} : m)}))}>
                                    {GSM_NETWORKS.map(n => <option key={n.name} value={n.name}>{n.name}</option>)}
                                </select>
                            </div>
                            <div className="flex-1 w-full">
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block">Numéro</label>
                                <input type="tel" className="w-full p-3 bg-white rounded-xl font-bold text-sm outline-none border border-slate-200" placeholder="00 00 00 00" value={method.number} onChange={(e) => setShopData(prev => ({...prev, payment_methods: prev.payment_methods?.map(m => m.id === method.id ? {...m, number: e.target.value} : m)}))} />
                            </div>
                            <div className="flex-1 w-full">
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block">Titulaire</label>
                                <input type="text" className="w-full p-3 bg-white rounded-xl font-bold text-sm outline-none border border-slate-200" placeholder="Nom complet" value={method.name || ''} onChange={(e) => setShopData(prev => ({...prev, payment_methods: prev.payment_methods?.map(m => m.id === method.id ? {...m, name: e.target.value} : m)}))} />
                            </div>
                            <button onClick={() => setShopData(prev => ({...prev, payment_methods: prev.payment_methods?.filter(m => m.id !== method.id)}))} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={20}/></button>
                        </div>
                    ))}
                </div>
                <div className="mt-8">
                    <button onClick={() => handleSaveShop()} disabled={saving} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10 uppercase tracking-widest text-xs">
                        {saving ? <Loader2 className="animate-spin"/> : <Save size={20}/>} Enregistrer les paiements
                    </button>
                </div>
            </div>
        </div>
      ) : activeSection === 'invoice-gen' ? (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                <div className="mb-8">
                    <h3 className="text-xl font-black text-slate-900 text-display">Générateur Manuel</h3>
                    <p className="text-slate-500 text-sm">Créez une facture "Prestige" instantanée.</p>
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Nom du Client</label>
                            <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={manualInvoice.clients.name} onChange={(e) => setManualInvoice({...manualInvoice, clients: {...manualInvoice.clients, name: e.target.value}})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Nom du Modèle</label>
                            <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={manualInvoice.model_name} onChange={(e) => setManualInvoice({...manualInvoice, model_name: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Détails de la confection</label>
                            <textarea className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold h-20" value={manualInvoice.description} onChange={(e) => setManualInvoice({...manualInvoice, description: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Prix Devis</label>
                            <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={manualInvoice.price} onChange={(e) => setManualInvoice({...manualInvoice, price: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Avance déjà perçue</label>
                            <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" value={manualInvoice.total_paid} onChange={(e) => setManualInvoice({...manualInvoice, total_paid: parseFloat(e.target.value) || 0})} />
                        </div>
                    </div>
                    <button onClick={() => setShowManualPreview(true)} className="w-full py-5 bg-pink-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest text-sm">
                        <Printer size={20}/> Éditer la Facture Prestige
                    </button>
                </div>
            </div>

            {showManualPreview && (
                <InvoiceModal 
                    order={{...manualInvoice, user_id: shopData.id, payments: manualInvoice.total_paid > 0 ? [{amount: manualInvoice.total_paid, date: new Date().toISOString()}] : []}} 
                    onClose={() => setShowManualPreview(false)}
                    shopLogo={shopData.shop_logo_data}
                    shopIfu={shopData.ifu_number}
                    shopPhone={shopData.phone}
                    shopOwnerName={shopData.shop_name}
                    currentUser={userName}
                    paymentMethods={shopData.payment_methods}
                />
            )}
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-600 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                    <h3 className="text-4xl font-black mb-2 tracking-tighter text-display uppercase">Abonnement {shopData.subscription_plan?.toUpperCase()}</h3>
                    <p className="opacity-60 text-sm font-medium">Accédez à toute la puissance de l'IA et de la gestion avancée.</p>
                    
                    <div className="mt-12 text-center">
                        <button 
                            onClick={() => window.location.href = '#pricing'}
                            className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all uppercase tracking-widest text-sm"
                        >
                            <Crown size={20} className="text-yellow-500 fill-yellow-500"/> Découvrir nos Formules & Tarifs
                        </button>
                        <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Une solution adaptée à la taille de votre atelier.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
