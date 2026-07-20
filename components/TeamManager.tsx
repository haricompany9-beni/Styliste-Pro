
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { TeamMember, Permission, PERMISSION_LABELS, UserProfile } from '../types';
import { 
  Plus, Trash2, Shield, User, RefreshCw, Copy, Check, Briefcase, 
  Edit2, X, GraduationCap, Printer, FileText, Banknote, 
  MoreVertical, AlertTriangle, ShieldCheck, Mail, Phone, MapPin, ReceiptText,
  Loader2
} from 'lucide-react';

interface TeamManagerProps {
  ownerId: string;
  shopName?: string;
  userProfile?: UserProfile | null;
}

export default function TeamManager({ ownerId, shopName, userProfile }: TeamManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [contractMember, setContractMember] = useState<TeamMember | null>(null);
  const [paymentMember, setPaymentMember] = useState<TeamMember | null>(null);
  const [invoiceMember, setInvoiceMember] = useState<TeamMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => { fetchTeam(); }, [ownerId]);
  
  const fetchTeam = async () => { 
    setLoading(true); 
    const { data } = await supabase.from('team_members').select('*').eq('owner_id', ownerId).order('created_at'); 
    if (data) setMembers(data); 
    setLoading(false); 
  };

  const confirmDelete = async () => { 
    if (!deleteTarget) return; 
    try { 
      await supabase.from('team_members').delete().eq('id', deleteTarget.id); 
      setDeleteTarget(null); 
      fetchTeam(); 
    } catch (e) { console.error(e); } 
  };

  const openNew = () => { setEditingMember(null); setIsModalOpen(true); }
  const openEdit = (m: TeamMember) => { setEditingMember(m); setIsModalOpen(true); }

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col pb-40">
      <div className="flex justify-between items-center mb-6 px-4 md:px-0">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Personnels.</h2>
          <p className="text-slate-500 text-sm hidden md:block">Gestion de votre équipe et de vos apprentis.</p>
        </div>
        <button onClick={openNew} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-2xl flex items-center gap-2 font-black shadow-xl shadow-slate-900/20 active:scale-95 transition-all shrink-0" > 
          <Plus size={20} /> <span className="hidden sm:inline">Ajouter</span><span className="sm:hidden">Nouveau</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 pb-20 px-2 md:px-0">
           {loading ? (
             <div className="text-center p-10"><RefreshCw className="animate-spin mx-auto text-pink-600"/></div>
           ) : members.length === 0 ? ( 
             <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 text-slate-300"> 
               <Briefcase size={64} className="mx-auto mb-4 opacity-20"/> 
               <p className="text-lg font-bold text-slate-400">Aucun collaborateur.</p> 
             </div> 
           ) : (
             <div className="space-y-3">
               {members.map(member => (
                 <div 
                   key={member.id} 
                   className={`bg-white rounded-[1.5rem] p-4 border flex flex-col shadow-sm hover:shadow-md transition-all relative ${member.is_apprentice ? 'border-blue-100 bg-blue-50/20' : 'border-slate-100'}`} 
                 >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border shrink-0 ${member.is_apprentice ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}> 
                             {member.avatar_data ? <img src={member.avatar_data} className="w-full h-full object-cover" /> : member.is_apprentice ? <GraduationCap size={24}/> : <User size={24}/>} 
                           </div>
                           <div className="min-w-0 flex-1"> 
                             <h3 className="font-black text-slate-900 text-sm md:text-base leading-tight break-words"> {member.full_name} </h3> 
                             <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="font-bold text-pink-600 uppercase tracking-widest text-[9px]">{member.job_title}</span>
                                {member.is_apprentice && <span className="bg-blue-600 text-white text-[7px] px-1.5 py-0.5 rounded-full uppercase font-black tracking-widest">Apprenti</span>}
                             </div>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                             <div className="hidden md:block relative"> 
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenuId(openMenuId === member.id ? null : member.id); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"> 
                                  <MoreVertical size={20} /> 
                                </button> 
                                {openMenuId === member.id && ( 
                                  <> 
                                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}></div> 
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 z-20 py-2 overflow-hidden animate-fade-in"> 
                                      {member.is_apprentice && ( 
                                        <> 
                                          <button onClick={() => { setOpenMenuId(null); setPaymentMember(member); }} className="w-full text-left px-5 py-3 text-sm font-bold text-green-600 hover:bg-green-50 flex items-center gap-3"> <Banknote size={18}/> Encaisser </button> 
                                          <button onClick={() => { setOpenMenuId(null); setInvoiceMember(member); }} className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3"> <ReceiptText size={18}/> Facture </button> 
                                          <button onClick={() => { setOpenMenuId(null); setContractMember(member); }} className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3"> <FileText size={18}/> Contrat </button> 
                                        </> 
                                      )} 
                                      <button onClick={() => { setOpenMenuId(null); openEdit(member); }} className="w-full text-left px-5 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-3"> <Edit2 size={18}/> Modifier </button> 
                                      <button onClick={() => { setOpenMenuId(null); setDeleteTarget(member); }} className="w-full text-left px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 border-t border-slate-50"> <Trash2 size={18}/> Supprimer </button> 
                                    </div> 
                                  </> 
                                )} 
                             </div>
                             <div className="md:hidden flex items-center gap-1.5"> 
                               {member.is_apprentice && ( 
                                 <>
                                    <button onClick={() => setPaymentMember(member)} className="w-9 h-9 flex items-center justify-center bg-green-100 text-green-600 rounded-xl active:scale-90 transition-transform shadow-sm" title="Encaisser"><Banknote size={18} /></button> 
                                    <button onClick={() => setInvoiceMember(member)} className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl active:scale-90 transition-transform shadow-sm" title="Facture"><ReceiptText size={18} /></button> 
                                 </>
                               )} 
                               <button onClick={() => openEdit(member)} className="w-9 h-9 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl active:scale-90 transition-transform border border-slate-100" title="Modifier"><Edit2 size={18} /></button> 
                               <button onClick={() => setDeleteTarget(member)} className="w-9 h-9 flex items-center justify-center text-red-400 bg-red-50 rounded-xl active:scale-90 transition-transform border border-red-50" title="Supprimer"><Trash2 size={18} /></button> 
                             </div>
                        </div>
                    </div>

                    {member.is_apprentice && member.apprentice_data && ( 
                      <div className="mt-3 pt-3 border-t border-blue-100 flex flex-wrap items-center justify-between gap-2"> 
                        <div className="flex items-center gap-2 min-w-0">
                           <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest shrink-0">Tuteur:</span>
                           <span className="text-[10px] text-slate-700 font-bold truncate">{member.apprentice_data.tutor_name}</span>
                        </div> 
                        <div className="text-[9px] font-black px-2 py-1 bg-white border border-blue-100 rounded-lg text-blue-600 shadow-sm whitespace-nowrap">
                          Reste: {(member.apprentice_data.training_cost - (member.apprentice_data.payments?.reduce((a,b) => a+b.amount, 0) || 0)).toLocaleString()} F
                        </div>
                      </div> 
                    )}
                    
                    {!member.is_apprentice && (
                        <div className="mt-2 text-[9px] text-slate-400 truncate font-black uppercase tracking-widest flex items-center gap-2">
                            <Mail size={10}/> <span className="truncate">{member.email}</span>
                        </div>
                    )}
                 </div>
               ))}
             </div>
           )}
      </div>

      {isModalOpen && ( <MemberModal ownerId={ownerId} member={editingMember} onClose={() => setIsModalOpen(false)} onSuccess={(newMember) => { setIsModalOpen(false); fetchTeam(); if(newMember?.is_apprentice) setContractMember(newMember); }} /> )}
      {contractMember && ( <ContractModal member={contractMember} onClose={() => setContractMember(null)} userProfile={userProfile} /> )}
      {paymentMember && ( <ApprenticePaymentModal member={paymentMember} onClose={() => setPaymentMember(null)} onSuccess={() => { setPaymentMember(null); fetchTeam(); }} /> )}
      {invoiceMember && ( <ApprenticeInvoiceModal member={invoiceMember} onClose={() => setInvoiceMember(null)} userProfile={userProfile} /> )}
      
      {deleteTarget && ( 
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"> 
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center"> 
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"> 
                <Trash2 size={32} /> 
              </div> 
              <h3 className="text-xl font-black text-slate-800 mb-2">Supprimer ?</h3> 
              <p className="text-sm text-slate-500 mb-8 leading-relaxed"> {deleteTarget.full_name} n'aura plus accès à son compte StylistePro. </p> 
              <div className="flex gap-3"> 
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-colors"> Annuler </button> 
                <button onClick={confirmDelete} className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"> Confirmer </button> 
              </div> 
          </div> 
        </div> 
      )}
    </div>
  );
}

function MemberModal({ ownerId, member, onClose, onSuccess }: { ownerId: string, member: TeamMember | null, onClose: () => void, onSuccess: (m?: TeamMember) => void }) {
  const [step, setStep] = useState(member ? 1 : 0);
  const [type, setType] = useState<'staff' | 'apprentice'>(member?.is_apprentice ? 'apprentice' : 'staff');
  const [formData, setFormData] = useState({ full_name: member?.full_name || '', email: member?.email || '', job_title: member?.job_title || '', permissions: new Set<Permission>(member?.permissions || []) });
  const [apprenticeData, setApprenticeData] = useState({ tutor_name: member?.apprentice_data?.tutor_name || '', tutor_phone: member?.apprentice_data?.tutor_phone || '', start_date: member?.apprentice_data?.start_date || new Date().toISOString().split('T')[0], duration_months: member?.apprentice_data?.duration_months || 24, training_cost: member?.apprentice_data?.training_cost || 0, patron_name: member?.apprentice_data?.patron_name || '', initial_payment: 0 });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const isEditing = !!member;

  const generatePassword = () => { 
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let pass = ''; 
    for (let i = 0; i < 6; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length)); 
    return pass; 
  };

  const togglePermission = (p: Permission) => { 
    const newSet = new Set(formData.permissions); 
    if (newSet.has(p)) newSet.delete(p); 
    else newSet.add(p); 
    setFormData(prev => ({ ...prev, permissions: newSet })); 
  };

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
        const permissionsArray = Array.from(formData.permissions); 
        const finalPermissions = type === 'apprentice' ? [] : permissionsArray; 
        const finalTitle = type === 'apprentice' ? 'Apprenti' : formData.job_title; 
        
        let finalApprenticeData = member?.apprentice_data || {}; 
        if (type === 'apprentice') { 
            finalApprenticeData = { 
                ...finalApprenticeData, 
                tutor_name: apprenticeData.tutor_name, 
                tutor_phone: apprenticeData.tutor_phone, 
                start_date: apprenticeData.start_date, 
                duration_months: apprenticeData.duration_months, 
                training_cost: apprenticeData.training_cost, 
                patron_name: apprenticeData.patron_name, 
                payments: member ? (member.apprentice_data?.payments || []) : (apprenticeData.initial_payment > 0 ? [{date: new Date().toISOString(), amount: apprenticeData.initial_payment}] : []) 
            }; 
        } 
        
        let resultMember: TeamMember | null = null; 
        if (isEditing && member) { 
            const { error } = await supabase.from('team_members').update({ full_name: formData.full_name, job_title: finalTitle, permissions: finalPermissions, apprentice_data: type === 'apprentice' ? finalApprenticeData : undefined }).eq('id', member.id); 
            if(error) throw error; 
        } else { 
            const password = generatePassword(); 
            setGeneratedPassword(password); 
            const { data, error } = await supabase.from('team_members').insert([{ owner_id: ownerId, full_name: formData.full_name, email: formData.email, job_title: finalTitle, permissions: finalPermissions, password: password, is_apprentice: type === 'apprentice', apprentice_data: type === 'apprentice' ? finalApprenticeData : {} }]).select().single(); 
            if (error) throw error; 
            resultMember = data; 
        } 
        
        if (isEditing) onSuccess(); 
        else if (type === 'apprentice' && resultMember) onSuccess(resultMember); 
        else setStep(2); 
    } catch (e: any) { alert("Erreur: " + String(e.message)); } 
    finally { setLoading(false); } 
  };

  return ( 
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"> 
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]"> 
        {step === 0 ? ( 
          <div className="p-10 text-center"> 
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Nouveau collaborateur.</h3> 
            <div className="grid grid-cols-2 gap-6"> 
              <button onClick={() => { setType('staff'); setStep(1); }} className="p-6 rounded-[1.5rem] border-2 border-slate-100 hover:border-pink-500 hover:bg-pink-50 transition-all group"> 
                <User size={40} className="mx-auto mb-4 text-slate-300 group-hover:text-pink-500 transition-colors" /> 
                <div className="font-black text-slate-700 group-hover:text-pink-600">Personnel.</div> 
                <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Couturiers / Staff</p>
              </button> 
              <button onClick={() => { setType('apprentice'); setStep(1); }} className="p-6 rounded-[1.5rem] border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"> 
                <GraduationCap size={40} className="mx-auto mb-4 text-slate-300 group-hover:text-blue-500 transition-colors" /> 
                <div className="font-black text-slate-700 group-hover:text-blue-600">Apprenti.</div> 
                <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Contrat formation</p>
              </button> 
            </div> 
            <button onClick={onClose} className="mt-8 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors">Annuler</button> 
          </div> 
        ) : step === 1 ? ( 
          <> 
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50"> 
              <h3 className="font-black text-xl text-slate-900 flex items-center gap-3"> 
                {type === 'apprentice' ? <GraduationCap className="text-blue-600"/> : <User className="text-pink-600"/>} 
                {isEditing ? 'Modification' : 'Inscription'} 
              </h3> 
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24}/></button> 
            </div> 
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar"> 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                <div className="md:col-span-2"> 
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nom Complet de l'intéressé</label> 
                  <input required className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-pink-500/20" placeholder="Ex: Moussa Diop" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} /> 
                </div> 
                {!isEditing && ( 
                  <div className="md:col-span-2"> 
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email de connexion</label> 
                    <input required type="email" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-pink-500/20" placeholder="email@atelier.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /> 
                  </div> 
                )} 
                {type === 'staff' && ( 
                  <div className="md:col-span-2"> 
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Poste occupé</label> 
                    <input required type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-pink-500/20" placeholder="Ex: Couturier Principal" value={formData.job_title} onChange={e => setFormData({...formData, job_title: e.target.value})} /> 
                  </div> 
                )} 
              </div> 
              
              {type === 'apprentice' && ( 
                <div className="bg-blue-50/50 p-6 rounded-[1.5rem] border-2 border-blue-100 space-y-4"> 
                  <h4 className="font-black text-blue-800 text-sm flex items-center gap-2 uppercase tracking-widest"><FileText size={18}/> Données du Contrat</h4> 
                  <div> 
                    <label className="block text-[9px] font-black text-blue-400 uppercase mb-2">Nom du Patron (Responsable)</label> 
                    <input required type="text" placeholder="M. Kone" className="w-full p-3 bg-white border border-blue-100 rounded-xl font-bold text-sm" value={apprenticeData.patron_name} onChange={e => setApprenticeData({...apprenticeData, patron_name: e.target.value})} /> 
                  </div> 
                  <div className="grid grid-cols-2 gap-4"> 
                    <div> 
                      <label className="block text-[9px] font-black text-blue-400 uppercase mb-2">Tuteur / Parent</label> 
                      <input required type="text" className="w-full p-3 bg-white border border-blue-100 rounded-xl font-bold text-sm" value={apprenticeData.tutor_name} onChange={e => setApprenticeData({...apprenticeData, tutor_name: e.target.value})} /> 
                    </div> 
                    <div> 
                      <label className="block text-[9px] font-black text-blue-400 uppercase mb-2">Tél. Tuteur</label> 
                      <input required type="tel" className="w-full p-3 bg-white border border-blue-100 rounded-xl font-bold text-sm" value={apprenticeData.tutor_phone} onChange={e => setApprenticeData({...apprenticeData, tutor_phone: e.target.value})} /> 
                    </div> 
                  </div> 
                  <div className="grid grid-cols-2 gap-4"> 
                    <div> 
                      <label className="block text-[9px] font-black text-blue-400 uppercase mb-2">Date de Début</label> 
                      <input required type="date" className="w-full p-3 bg-white border border-blue-100 rounded-xl font-bold text-sm" value={apprenticeData.start_date} onChange={e => setApprenticeData({...apprenticeData, start_date: e.target.value})} /> 
                    </div> 
                    <div> 
                      <label className="block text-[9px] font-black text-blue-400 uppercase mb-2">Durée (Mois)</label> 
                      <input required type="number" className="w-full p-3 bg-white border border-blue-100 rounded-xl font-bold text-sm" value={apprenticeData.duration_months} onChange={e => setApprenticeData({...apprenticeData, duration_months: parseInt(e.target.value)})} /> 
                    </div> 
                  </div> 
                  <div className="pt-4 border-t border-blue-100"> 
                    <label className="block text-sm font-black text-slate-700 mb-3">Coût Total Formation (FCFA)</label> 
                    <input required type="number" className="w-full p-4 bg-white border-2 border-blue-200 rounded-2xl font-black text-xl text-blue-600 outline-none" value={apprenticeData.training_cost} onChange={e => setApprenticeData({...apprenticeData, training_cost: parseInt(e.target.value)})} /> 
                  </div> 
                  {!isEditing && (
                    <div className="pt-2"> 
                      <label className="block text-sm font-black text-green-700 mb-3">Acompte Initial</label> 
                      <input type="number" className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-2xl font-black text-xl text-green-600 outline-none" placeholder="0 F" value={apprenticeData.initial_payment} onChange={e => setApprenticeData({...apprenticeData, initial_payment: parseInt(e.target.value) || 0})} /> 
                    </div>
                  )}
                </div> 
              )} 
              
              {type === 'staff' && ( 
                <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100"> 
                  <h4 className="font-black text-slate-800 text-sm flex items-center gap-3 uppercase tracking-widest mb-6"><ShieldCheck size={20}/> Permissions d'accès</h4> 
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"> 
                    {Object.entries(PERMISSION_LABELS).map(([key, label]) => { 
                      const pKey = key as Permission; 
                      const isChecked = formData.permissions.has(pKey); 
                      return ( 
                        <div key={key} onClick={() => togglePermission(pKey)} className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all ${isChecked ? 'bg-white border-pink-500 shadow-lg shadow-pink-500/5' : 'border-slate-100 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:border-slate-200'}`} > 
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-pink-600 border-pink-600 text-white' : 'bg-white border-slate-300'}`}> 
                            {isChecked && <Check size={14} strokeWidth={4} />} 
                          </div> 
                          <span className={`text-[10px] ${isChecked ? 'font-black text-slate-900' : 'font-bold text-slate-500'}`}>{label}</span> 
                        </div> 
                      ) 
                    })} 
                  </div> 
                </div> 
              )} 
            </form> 
            <div className="p-6 border-t border-slate-50 bg-white"> 
              <button onClick={handleSubmit} disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-[1.2rem] font-black text-base shadow-xl shadow-slate-900/20 active:scale-95 transition-all"> 
                {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Valider l\'inscription'} 
              </button> 
            </div> 
          </> 
        ) : ( 
          <div className="p-10 text-center"> 
            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
               <Check size={40} strokeWidth={3}/>
            </div> 
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Accès configuré.</h3> 
            <p className="text-slate-500 mb-8 font-medium text-sm">Le collaborateur peut désormais se connecter.</p>
            <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 mb-8 text-left space-y-4"> 
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Email</span>
                <div className="font-bold text-slate-800">{formData.email}</div>
              </div> 
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Mot de passe</span>
                <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-100">
                    <div className="font-mono text-xl font-black text-pink-600">{generatedPassword}</div>
                    <button type="button" onClick={() => { navigator.clipboard.writeText(generatedPassword); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                        {copied ? <Check size={18}/> : <Copy size={18}/>}
                    </button>
                </div>
              </div> 
            </div> 
            <button onClick={() => onSuccess()} className="w-full bg-slate-900 text-white py-4 rounded-[1.2rem] font-black">Terminer</button> 
          </div> 
        )} 
      </div> 
    </div> 
  );
}

function ApprenticePaymentModal({ member, onClose, onSuccess }: { member: TeamMember, onClose: () => void, onSuccess: () => void }) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    if(!member.apprentice_data) return null;
    const paid = member.apprentice_data.payments?.reduce((a,b) => a+b.amount, 0) || 0;
    const remaining = (member.apprentice_data.training_cost || 0) - paid;
    
    const handlePayment = async () => { 
        setLoading(true); 
        try { 
            const val = parseFloat(amount); 
            if(isNaN(val) || val <= 0 || val > remaining) { alert("Montant invalide"); setLoading(false); return; } 
            const newPayments = [...(member.apprentice_data?.payments || []), { amount: val, date: new Date().toISOString() }]; 
            const { error } = await supabase.from('team_members').update({ apprentice_data: { ...member.apprentice_data, payments: newPayments } }).eq('id', member.id); 
            if(error) throw error; 
            onSuccess(); 
        } catch(e: any) { alert("Erreur d'enregistrement."); } 
        finally { setLoading(false); } 
    };

    return ( 
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"> 
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 animate-fade-in"> 
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Nouvel Acompte.</h3> 
                <p className="text-slate-500 text-xs mb-6 font-medium">Paiement formation de {member.full_name}.</p>
                <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100 flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reste à payer</span>
                    <span className="font-black text-red-500 text-base">{remaining.toLocaleString()} F</span>
                </div> 
                <div className="relative mb-6">
                    <input type="number" autoFocus className="w-full p-4 text-3xl font-black text-center text-slate-900 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} /> 
                </div>
                <div className="flex gap-3"> 
                    <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-all">Annuler</button> 
                    <button onClick={handlePayment} disabled={loading || !amount} className="flex-1 py-4 bg-green-600 text-white font-black rounded-2xl shadow-xl shadow-green-600/20 active:scale-95 transition-all">
                        {loading ? '...' : 'Valider'}
                    </button> 
                </div> 
            </div> 
        </div> 
    );
}

function ContractModal({ member, onClose, userProfile }: { member: TeamMember, onClose: () => void, userProfile?: UserProfile | null }) {
    const handlePrint = () => { 
        const content = document.getElementById('contract-print'); 
        if (!content) return; 
        const win = window.open('', '', 'height=900,width=800'); 
        if(win) { 
            win.document.write('<html><head><title>Contrat Apprentissage</title><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet"><style>body{font-family:"Inter",sans-serif;}</style></head><body class="p-4">'); 
            win.document.write(content.innerHTML); 
            win.document.write('</body></html>'); 
            win.document.close(); 
            setTimeout(() => win.print(), 1000); 
        } 
    };

    const paid = member.apprentice_data?.payments?.reduce((a,b) => a+b.amount, 0) || 0;
    const total = member.apprentice_data?.training_cost || 0;
    const remaining = total - paid;
    const shopLogo = userProfile?.shop_logo_data || userProfile?.avatar_data;
    const shopName = userProfile?.shop_name || "L'Atelier";

    return ( 
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-4 bg-slate-900/80 backdrop-blur-md"> 
            <div className="bg-white md:rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-full md:h-[90vh] flex flex-col overflow-hidden"> 
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"> 
                    <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-[10px]"><FileText size={14}/> Contrat d'Apprentissage</h3> 
                    <div className="flex gap-2"> 
                        <button onClick={handlePrint} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-[10px] flex items-center gap-2 transition-all"><Printer size={14}/> Imprimer</button> 
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X size={20}/></button> 
                    </div> 
                </div> 
                <div className="flex-1 overflow-auto p-4 md:p-12 bg-slate-100 flex justify-center no-scrollbar"> 
                    <div id="contract-print" className="bg-white w-full max-w-[210mm] p-6 md:p-16 shadow-2xl relative text-slate-900 min-h-[297mm]"> 
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-slate-900 pb-8 mb-10 gap-6"> 
                            <div className="flex items-center gap-4">
                                {shopLogo && <img src={shopLogo} className="h-16 w-16 rounded-xl object-cover border border-slate-100" />}
                                <div>
                                    <h1 className="text-xl font-black uppercase tracking-tight">{shopName}</h1>
                                    <p className="text-slate-500 font-bold text-xs">Formation Couture Professionnelle</p>
                                </div>
                            </div>
                            <div className="text-right"> 
                                <div className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-lg mb-1">CONTRAT</div>
                                <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">N° {member.id.slice(0,8).toUpperCase()}</div> 
                            </div> 
                        </div> 

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-xs"> 
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"> 
                                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Le Patron</h4> 
                                <div className="space-y-1">
                                    <div className="text-sm font-black text-slate-900">{userProfile?.owner_full_name || 'Le Responsable'}</div> 
                                    <div className="text-slate-600 flex items-center gap-2"><Phone size={10}/> {userProfile?.phone || 'Non renseigné'}</div>
                                </div>
                            </div> 
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100"> 
                                <h4 className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-3">Apprenti(e) & Tuteur</h4> 
                                <div className="space-y-1">
                                    <div className="text-sm font-black text-slate-900">{member.full_name}</div> 
                                    <div className="font-bold text-blue-700">Parent: {member.apprentice_data?.tutor_name}</div>
                                    <div className="text-slate-600 flex items-center gap-2"><Phone size={10}/> {member.apprentice_data?.tutor_phone}</div>
                                </div>
                            </div> 
                        </div> 

                        <div className="space-y-4 mb-10 text-[11px] leading-relaxed">
                            <h3 className="font-black text-slate-900 uppercase border-b-2 border-slate-100 pb-1">Conditions</h3>
                            <p><strong>Engagement :</strong> L'apprenti s'engage à respecter les horaires et le règlement intérieur de l'atelier <strong>{shopName}</strong>.</p>
                            <p><strong>Durée :</strong> Début le <strong>{new Date(member.apprentice_data?.start_date || '').toLocaleDateString()}</strong> pour <strong>{member.apprentice_data?.duration_months} mois</strong>.</p>
                            <p><strong>Coût :</strong> La formation s'élève à <strong>{total.toLocaleString()} FCFA</strong>.</p>
                        </div>

                        <div className="mb-12 bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 bg-white/5 rounded-full blur-3xl"></div>
                            <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-4 relative z-10">Bilan</h4> 
                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                <div>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase block">Total</span>
                                    <span className="text-lg font-black">{total.toLocaleString()} F</span>
                                </div>
                                <div>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase block">Versé</span>
                                    <span className="text-lg font-black text-green-400">{paid.toLocaleString()} F</span>
                                </div>
                                <div className="col-span-2 pt-4 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-300">Reste à payer</span>
                                        <span className="text-xl font-black text-pink-500">{remaining.toLocaleString()} F</span>
                                    </div>
                                </div>
                            </div>
                        </div> 

                        <div className="grid grid-cols-2 gap-8 mt-12 text-[10px]"> 
                            <div className="text-center"> 
                                <div className="text-[8px] font-black uppercase text-slate-400 mb-10 tracking-widest">Le Patron</div> 
                                <div className="font-black text-slate-900 border-t border-slate-100 pt-1">{userProfile?.owner_full_name}</div> 
                            </div> 
                            <div className="text-center"> 
                                <div className="text-[8px] font-black uppercase text-slate-400 mb-10 tracking-widest">Le Tuteur</div> 
                                <div className="font-black text-slate-900 border-t border-slate-100 pt-1">{member.apprentice_data?.tutor_name}</div> 
                            </div> 
                        </div> 
                    </div> 
                </div> 
            </div> 
        </div> 
    )
}

function ApprenticeInvoiceModal({ member, onClose, userProfile }: { member: TeamMember, onClose: () => void, userProfile?: UserProfile | null }) {
    const handlePrint = () => { 
        const content = document.getElementById('apprentice-invoice-print'); 
        if (!content) return; 
        const win = window.open('', '', 'height=800,width=800'); 
        if(win) { 
            win.document.write('<html><head><title>Facture Formation</title><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet"><style>body{font-family:"Inter",sans-serif;}</style></head><body class="p-4">'); 
            win.document.write(content.innerHTML); 
            win.document.write('</body></html>'); 
            win.document.close(); 
            setTimeout(() => win.print(), 1000); 
        } 
    };

    const total = member.apprentice_data?.training_cost || 0;
    const payments = member.apprentice_data?.payments || [];
    const paid = payments.reduce((a,b) => a+b.amount, 0);
    const remaining = total - paid;
    const shopLogo = userProfile?.shop_logo_data || userProfile?.avatar_data;

    return ( 
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-4 bg-slate-900/80 backdrop-blur-md"> 
            <div className="bg-white md:rounded-[2.5rem] shadow-2xl w-full max-w-2xl h-full md:h-[90vh] flex flex-col overflow-hidden"> 
                <div className="p-4 border-b flex justify-between items-center bg-slate-50"> 
                    <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">Reçu de Paiement</h3> 
                    <div className="flex gap-2"> 
                        <button onClick={handlePrint} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-[10px] flex items-center gap-2 transition-all"><Printer size={14}/> Imprimer</button> 
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X size={20}/></button> 
                    </div> 
                </div> 
                <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-100 flex justify-center no-scrollbar"> 
                    <div id="apprentice-invoice-print" className="bg-white w-full max-w-[210mm] p-8 shadow relative text-slate-900 min-h-[297mm] flex flex-col"> 
                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8"> 
                            <div> 
                                {shopLogo ? <img src={shopLogo} className="h-14 w-14 object-cover rounded-xl mb-2" /> : <h1 className="text-lg font-black uppercase">{userProfile?.shop_name}</h1>} 
                                <p className="text-slate-500 font-bold text-[8px] uppercase tracking-widest">Frais de Formation</p> 
                            </div> 
                            <div className="text-right"> 
                                <h2 className="text-2xl font-black text-slate-200 uppercase">REÇU</h2> 
                                <div className="text-[8px] text-slate-400 font-mono mt-1 uppercase tracking-tight">Ref: REC-{member.id.slice(0, 6).toUpperCase()}</div> 
                            </div> 
                        </div> 
                        
                        <div className="mb-8 grid grid-cols-2 gap-4 text-xs">
                            <div className="border-l-4 border-slate-900 pl-3">
                                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Apprenti(e)</h4>
                                <div className="font-black">{member.full_name}</div>
                            </div>
                            <div className="text-right">
                                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</h4>
                                <div className="font-bold">{new Date().toLocaleDateString()}</div>
                            </div>
                        </div>

                        <div className="flex-1 text-[11px]"> 
                            <table className="w-full mb-8"> 
                                <thead>
                                    <tr className="border-b-2 border-slate-900 text-left text-[8px] uppercase font-black text-slate-400 tracking-widest">
                                        <th className="py-3">Libellé</th>
                                        <th className="py-3 text-right">Montant</th>
                                    </tr>
                                </thead> 
                                <tbody className="divide-y divide-slate-100">
                                    {payments.map((p, i) => (
                                        <tr key={i}>
                                            <td className="py-3">
                                                <div className="font-bold text-slate-800">Versement formation - {new Date(p.date).toLocaleDateString()}</div>
                                            </td>
                                            <td className="py-3 text-right font-black text-slate-900">{p.amount.toLocaleString()} F</td>
                                        </tr>
                                    ))}
                                </tbody> 
                            </table> 
                        </div> 

                        <div className="flex justify-end mb-10">
                            <div className="w-64 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                                <div className="flex justify-between text-slate-500 font-bold uppercase text-[9px]">
                                    <span>Total Formation</span>
                                    <span>{total.toLocaleString()} F</span>
                                </div>
                                <div className="flex justify-between text-green-600 font-black">
                                    <span className="text-[9px] uppercase">Total Payé</span>
                                    <span>- {paid.toLocaleString()} F</span>
                                </div>
                                <div className="flex justify-between pt-3 border-t border-slate-200 text-lg font-black text-slate-900">
                                    <span className="text-[10px] uppercase">Reste</span>
                                    <span>{remaining.toLocaleString()} F</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto grid grid-cols-2 gap-8 text-[9px]">
                            <div className="text-center pt-6 border-t border-slate-100">
                                <div className="text-[8px] font-black text-slate-400 uppercase mb-6 tracking-widest">Cachet</div>
                                <div className="font-black text-slate-800">{userProfile?.shop_name}</div>
                            </div>
                            <div className="text-center pt-6 border-t border-slate-100">
                                <div className="text-[8px] font-black text-slate-400 uppercase mb-6 tracking-widest">Décharge</div>
                                <div className="font-black text-slate-800">{member.apprentice_data?.tutor_name}</div>
                            </div>
                        </div>
                    </div> 
                </div> 
            </div> 
        </div> 
    )
}
