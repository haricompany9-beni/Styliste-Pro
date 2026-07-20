
import React, { useState, useRef, useEffect } from 'react';
import { Client, MEASUREMENT_LABELS, Permission } from '../types';
import { supabase } from '../supabaseClient';
import { 
  Search, Plus, Phone, Trash2, Edit2, ChevronDown, 
  ChevronRight, X, User, Scissors, AlertTriangle, 
  MoreVertical, Smartphone, Loader2, CheckCheck, RefreshCw, Info
} from 'lucide-react';

interface ClientManagerProps {
  clients: Client[];
  refreshData: () => void;
  permissions: Permission[];
  ownerId: string;
}

export default function ClientManager({ clients, refreshData, permissions, ownerId }: ClientManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [isContactApiSupported, setIsContactApiSupported] = useState(false);

  useEffect(() => {
    // Vérifier si l'API Contact Picker est disponible
    setIsContactApiSupported('contacts' in navigator && 'ContactsManager' in window);
  }, []);

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const canDelete = permissions.includes('delete_data');
  const canEdit = permissions.includes('manage_clients');

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (ownerId === 'guest-user-id') {
      const storedClients = localStorage.getItem('stylistepro_guest_clients');
      const localClients: Client[] = storedClients ? JSON.parse(storedClients) : [];
      const updatedClients = localClients.filter(c => c.id !== deleteTarget.id);
      localStorage.setItem('stylistepro_guest_clients', JSON.stringify(updatedClients));
      
      // Cascade delete orders
      const storedOrders = localStorage.getItem('stylistepro_guest_orders');
      if (storedOrders) {
        const localOrders = JSON.parse(storedOrders);
        const updatedOrders = localOrders.filter((o: any) => o.client_id !== deleteTarget.id);
        localStorage.setItem('stylistepro_guest_orders', JSON.stringify(updatedOrders));
      }
      
      setDeleteTarget(null);
      refreshData();
      return;
    }
    try {
      const { error } = await supabase.from('clients').delete().eq('id', deleteTarget.id);
      if(error) throw error;
      setDeleteTarget(null);
      refreshData();
    } catch(e: any) {
      console.error(e);
      let msg = String(e?.message || "Impossible de supprimer");
      if (e?.code === '23503' || msg.includes('foreign key')) {
          msg = "Impossible de supprimer : Base de données verrouillée.\n\nSOLUTION : Allez dans Profil -> Zone Technique et exécutez le script SQL pour activer la 'Cascade'.";
      }
      alert("Erreur : " + msg);
    }
  };

  const handleSyncContacts = async () => {
    if (!isContactApiSupported) {
        setShowCompatibilityModal(true);
        return;
    }

    try {
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        
        // @ts-ignore - API expérimentale
        const contacts = await navigator.contacts.select(props, opts);
        
        if (!contacts || contacts.length === 0) return;

        setIsSyncing(true);
        
        const newClients = contacts.map((contact: any) => {
            const name = contact.name?.[0] || 'Sans nom';
            const phone = contact.tel?.[0] || '';
            return {
                user_id: ownerId,
                name: name,
                phone: phone,
                measurements: {} 
            };
        }).filter((c: any) => c.phone !== ''); 

        if (newClients.length === 0) {
            alert("Aucun contact valide avec numéro de téléphone n'a été sélectionné.");
            setIsSyncing(false);
            return;
        }

        if (ownerId === 'guest-user-id') {
          const storedClients = localStorage.getItem('stylistepro_guest_clients');
          const localClients: Client[] = storedClients ? JSON.parse(storedClients) : [];
          const withIds = newClients.map((c: any) => ({ 
              ...c, 
              id: 'client_' + Math.random().toString(36).substr(2, 9), 
              created_at: new Date().toISOString() 
          }));
          localStorage.setItem('stylistepro_guest_clients', JSON.stringify([...localClients, ...withIds]));
          alert(`${newClients.length} clients ont été synchronisés localement avec succès !`);
          refreshData();
          setIsSyncing(false);
          return;
        }

        const { error } = await supabase.from('clients').insert(newClients);
        
        if (error) throw error;
        
        alert(`${newClients.length} clients ont été synchronisés avec succès !`);
        refreshData();
    } catch (e: any) {
        console.error("Sync error:", e);
        if (e.name !== 'AbortError') {
            alert("Une erreur est survenue lors de la synchronisation : " + e.message);
        }
    } finally {
        setIsSyncing(false);
    }
  };

  const handleDeleteRequest = (client: Client) => {
    if (!canDelete) {
        alert("Action non autorisée.");
        return;
    }
    setDeleteTarget(client);
  };

  const handleEdit = (client: Client) => {
    if (!canEdit) return;
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Registre Clients</h2>
          <p className="text-slate-500 text-sm">{clients.length} clients enregistrés</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            {canEdit && (
                <button 
                    onClick={handleSyncContacts}
                    disabled={isSyncing}
                    className="flex-1 sm:flex-none bg-pink-50 text-pink-600 border border-pink-100 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-pink-100 transition-all disabled:opacity-50 justify-center group relative"
                    title="Synchroniser depuis votre répertoire"
                >
                    {isSyncing ? <Loader2 size={18} className="animate-spin"/> : <Smartphone size={18} className="group-hover:rotate-12 transition-transform"/>}
                    <span className="hidden sm:inline">Importer Répertoire</span>
                    <span className="sm:hidden">Répertoire</span>
                    {!isContactApiSupported && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>}
                </button>
            )}
            {canEdit && (
                <button 
                    onClick={openNew}
                    className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-lg shadow-slate-900/20 transition-all justify-center"
                >
                    <Plus size={18} /> Nouveau Client
                </button>
            )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-3 items-center sticky top-0 z-10">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Rechercher par nom ou téléphone..." 
          className="w-full outline-none text-slate-700 bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isSyncing && (
          <div className="mb-6 p-4 bg-pink-600 text-white rounded-2xl flex items-center justify-center gap-3 animate-pulse shadow-xl shadow-pink-600/20">
              <RefreshCw size={20} className="animate-spin" />
              <span className="font-bold">Synchronisation des contacts en cours...</span>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
        {filtered.map(client => (
          <ClientCard 
            key={client.id} 
            client={client} 
            onEdit={() => handleEdit(client)}
            onDelete={() => handleDeleteRequest(client)}
            canDelete={canDelete}
            canEdit={canEdit}
          />
        ))}
        {filtered.length === 0 && !isSyncing && (
          <div className="col-span-full text-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <User size={32} className="opacity-20"/>
             </div>
             <p className="font-medium">Aucun client trouvé pour "{searchTerm}"</p>
             <button onClick={handleSyncContacts} className="mt-4 text-pink-600 font-bold flex items-center gap-2 mx-auto hover:underline">
                 <Smartphone size={16}/> Importer depuis mon téléphone
             </button>
          </div>
        )}
      </div>

      {/* Modal d'explication de compatibilité */}
      {showCompatibilityModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center relative">
                  <button onClick={() => setShowCompatibilityModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={20}/></button>
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Info size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Importation Contacts</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                      Cette fonction permet d'ouvrir le répertoire de votre téléphone pour ajouter vos clients en un clic. 
                      <br/><br/>
                      💡 Pour que cela fonctionne, vous devez être sur **Android** et utiliser le navigateur **Google Chrome**.
                  </p>
                  <button 
                    onClick={() => setShowCompatibilityModal(false)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-slate-800 transition-all"
                  >
                    J'ai compris
                  </button>
              </div>
          </div>
      )}

      {isModalOpen && (
        <ClientModal 
          client={editingClient} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); refreshData(); }}
          ownerId={ownerId}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-2">Supprimer ce client ?</h3>
                 <p className="text-sm text-slate-500 mb-6">
                    Vous êtes sur le point de supprimer <strong>{deleteTarget.name}</strong>.
                    <br/><br/>
                    <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded">ATTENTION :</span> Cette action supprimera également <strong>toutes ses commandes</strong> et son historique de mesures.
                 </p>
                 <div className="flex gap-3">
                    <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">
                       Annuler
                    </button>
                    <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
                       Confirmer
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

interface ClientCardProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
  canEdit: boolean;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onDelete, canDelete, canEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const measurementCount = Object.keys(client.measurements || {}).filter(k => client.measurements[k]).length;
  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEnd.current = e.targetTouches[0].clientX; };

  const handleTouchEnd = () => {
      if (!touchStart.current || !touchEnd.current) return;
      const distance = touchStart.current - touchEnd.current;
      const isLeftSwipe = distance > 75;
      const isRightSwipe = distance < -75;
      if (window.innerWidth < 1024) { 
          if (isLeftSwipe && canDelete) onDelete();
          if (isRightSwipe && canEdit) onEdit();
      }
      touchStart.current = 0; touchEnd.current = 0;
  };

  return (
    <div 
        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group relative"
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
    >
      <div className="p-5 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-lg group-hover:bg-pink-600 group-hover:text-white transition-colors">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">{client.name}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Phone size={14} /> {client.phone}
            </div>
          </div>
        </div>
        <div className="hidden md:block relative">
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(!menuOpen); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <MoreVertical size={20} />
            </button>
            {menuOpen && (
                <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}></div>
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1 overflow-hidden">
                    {canEdit && (
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); onEdit(); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <Edit2 size={16}/> Modifier
                        </button>
                    )}
                    {canDelete && (
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); onDelete(); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 size={16}/> Supprimer
                        </button>
                    )}
                </div>
                </>
            )}
        </div>
      </div>
      <button onClick={() => setExpanded(!expanded)} className="w-full px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center hover:bg-slate-100 transition-colors">
        <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mesures ({measurementCount})</span>
            {measurementCount === 0 && <span className="bg-orange-100 text-orange-600 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">À remplir</span>}
        </div>
        {expanded ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
      </button>
      {expanded && (
        <div className="p-5 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-y-3 gap-x-6 text-sm animate-fade-in">
          {Object.keys(MEASUREMENT_LABELS).map((key) => {
             const val = client.measurements?.[key];
             if(!val) return null;
             return (
              <div key={key} className="flex justify-between items-center border-b border-slate-200/60 pb-1">
                <span className="text-slate-500">{MEASUREMENT_LABELS[key]}</span>
                <span className="font-bold text-slate-800">{String(val)} cm</span>
              </div>
             );
          })}
          {measurementCount === 0 && (
              <div className="col-span-2 text-center py-4">
                  <p className="text-slate-400 text-xs mb-3 italic">Aucune mesure pour ce client.</p>
                  <button onClick={onEdit} className="text-pink-600 text-xs font-bold uppercase tracking-widest flex items-center gap-2 mx-auto bg-white px-4 py-2 rounded-lg border border-pink-100 shadow-sm">
                      <Plus size={14}/> Ajouter les mesures
                  </button>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

function ClientModal({ client, onClose, onSuccess, ownerId }: { client: Client | null, onClose: () => void, onSuccess: () => void, ownerId: string }) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    phone: client?.phone || '',
    measurements: client?.measurements || {} as Record<string, string>
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!ownerId) throw new Error("Erreur de session propriétaire.");
      if (ownerId === 'guest-user-id') {
        const storedClients = localStorage.getItem('stylistepro_guest_clients');
        const localClients: Client[] = storedClients ? JSON.parse(storedClients) : [];
        if (client) {
          const updated = localClients.map(c => c.id === client.id ? { ...c, name: formData.name, phone: formData.phone, measurements: formData.measurements } : c);
          localStorage.setItem('stylistepro_guest_clients', JSON.stringify(updated));
        } else {
          const newClient: Client = {
            id: 'client_' + Math.random().toString(36).substr(2, 9),
            user_id: ownerId,
            name: formData.name,
            phone: formData.phone,
            measurements: formData.measurements,
            created_at: new Date().toISOString()
          };
          localClients.push(newClient);
          localStorage.setItem('stylistepro_guest_clients', JSON.stringify(localClients));
        }
        onSuccess();
        return;
      }
      if (client) {
        const { error } = await supabase.from('clients').update({ name: formData.name, phone: formData.phone, measurements: formData.measurements }).eq('id', client.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clients').insert([{ user_id: ownerId, name: formData.name, phone: formData.phone, measurements: formData.measurements }]);
        if (error) throw error;
      }
      onSuccess();
    } catch (err: any) {
      alert("Erreur: " + String(err?.message || "Enregistrement échoué"));
    } finally {
      setSaving(false);
    }
  };

  const handleMeasurementChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, measurements: { ...prev.measurements, [key]: value } }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><User className="text-pink-600" />{client ? 'Modifier Client' : 'Nouveau Client'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-sm font-medium text-slate-700 mb-2">Nom Complet</label><input required type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Jean Dupont" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-2">Téléphone</label><input required type="tel" className="w-full p-3 border border-slate-200 rounded-xl outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Ex: 0102030405" /></div>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Scissors size={18} className="text-slate-500" />Prise de Mesures (cm)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(MEASUREMENT_LABELS).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-center font-medium outline-none" value={formData.measurements[key] || ''} onChange={e => handleMeasurementChange(key, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        </form>
        <div className="p-6 border-t border-slate-100 bg-white">
          <button onClick={handleSubmit} disabled={saving} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex justify-center items-center gap-2">{saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Enregistrer la fiche client'}</button>
        </div>
      </div>
    </div>
  );
}
