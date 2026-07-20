
import React, { useState, useRef } from 'react';
import { CatalogItem, Permission } from '../types';
import { supabase } from '../supabaseClient';
import { Search, Plus, Trash2, Tag, Image as ImageIcon, X, Upload, Edit2, Save, Loader2, Filter, Layers, ChevronLeft, ChevronRight } from 'lucide-react';

interface CatalogueManagerProps {
  catalog: CatalogItem[];
  refreshData: () => void;
  permissions: Permission[];
  ownerId: string;
}

const CATEGORIES = ["Tout", "Robe", "Ensemble", "Bazin", "Soirée", "Mariage", "Traditionnel", "Homme", "Enfant", "Accessoire"];

export default function CatalogueManager({ catalog, refreshData, permissions, ownerId }: CatalogueManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const [detailItem, setDetailItem] = useState<CatalogItem | null>(null);

  const filtered = catalog.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Tout' || c.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const canManage = permissions.includes('manage_catalog');
  const canDelete = permissions.includes('delete_data');

  const confirmDelete = async () => {
      if (!deleteTarget) return;
      if (ownerId === 'guest-user-id') {
        const storedCatalog = localStorage.getItem('stylistepro_guest_catalog');
        const localCatalog: CatalogItem[] = storedCatalog ? JSON.parse(storedCatalog) : [];
        const updated = localCatalog.filter(c => c.id !== deleteTarget.id);
        localStorage.setItem('stylistepro_guest_catalog', JSON.stringify(updated));
        setDeleteTarget(null);
        setDetailItem(null);
        refreshData();
        return;
      }
      try { const { error } = await supabase.from('catalog').delete().eq('id', deleteTarget.id); if(error) throw error; setDeleteTarget(null); setDetailItem(null); refreshData(); } catch(e: any) { alert("Erreur: " + String(e?.message || "Erreur inconnue")); }
  };

  const openNew = () => { setEditingItem(null); setIsModalOpen(true); };
  const openEdit = (item: CatalogItem) => { setEditingItem(item); setIsModalOpen(true); };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pb-40">
      <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Collection</h2>
              <p className="text-slate-500 font-medium">Votre book digital ({catalog.length} modèles)</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Rechercher..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-pink-500 outline-none shadow-sm transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                {canManage && ( <button onClick={openNew} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-slate-900/20 transition-transform active:scale-95 shrink-0"> <Plus size={20} /> <span className="hidden sm:inline">Nouveau</span> </button> )}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-gradient"> {CATEGORIES.map(cat => ( <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all border ${ activeCategory === cat ? 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/30' : 'bg-white text-slate-600 border-slate-200 hover:border-pink-300 hover:text-pink-600' }`} > {cat} </button> ))} </div>
      </div>
      {filtered.length === 0 ? ( <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl"> <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><ImageIcon size={32} className="opacity-50"/></div> <p className="font-medium">Aucun modèle trouvé.</p> {canManage && <button onClick={openNew} className="mt-4 text-pink-600 font-bold hover:underline">Ajouter un modèle</button>} </div> ) : ( <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max pb-20 md:pb-0"> {filtered.map(item => ( <CatalogCard key={item.id} item={item} onClick={() => setDetailItem(item)} /> ))} </div> )}
      {isModalOpen && ( <CatalogModal item={editingItem} onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); refreshData(); }} ownerId={ownerId} /> )}
      {detailItem && ( <DetailModal item={detailItem} onClose={() => setDetailItem(null)} onEdit={() => { setDetailItem(null); openEdit(detailItem); }} onDelete={() => setDeleteTarget(detailItem)} canManage={canManage} canDelete={canDelete} /> )}
      {deleteTarget && ( <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"> <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center"> <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div> <h3 className="text-xl font-bold text-slate-800 mb-2">Supprimer ce modèle ?</h3> <p className="text-sm text-slate-500 mb-6">Action irréversible.</p> <div className="flex gap-3"> <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl">Annuler</button> <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20">Confirmer</button> </div> </div> </div> )}
    </div>
  );
}

const CatalogCard: React.FC<{ item: CatalogItem, onClick: () => void }> = ({ item, onClick }) => {
    const images = item.images && item.images.length > 0 ? item.images : (item.image_url ? [item.image_url] : []);
    const mainImage = images[0];
    const count = images.length;
    return ( <div onClick={onClick} className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100" > <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden"> {mainImage ? ( <img src={mainImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /> ) : ( <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={48}/></div> )} <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div> <div className="absolute top-3 left-3 flex flex-col gap-1"> <span className="px-2 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider rounded-md text-slate-800 shadow-sm"> {item.category} </span> </div> {count > 1 && ( <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-md text-white text-xs font-bold rounded-full flex items-center gap-1"> <Layers size={12}/> {count} </div> )} </div> <div className="p-4"> <div className="flex justify-between items-start gap-2"> <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-1">{item.title}</h3> <span className="font-bold text-pink-600 text-sm whitespace-nowrap">{item.price > 0 ? `${item.price.toLocaleString()} F` : 'Sur Devis'}</span> </div> </div> </div> )
}

function DetailModal({ item, onClose, onEdit, onDelete, canManage, canDelete }: any) {
    const images = item.images && item.images.length > 0 ? item.images : (item.image_url ? [item.image_url] : []);
    const [currentIdx, setCurrentIdx] = useState(0);
    const nextImage = (e: any) => { e.stopPropagation(); setCurrentIdx((prev) => (prev + 1) % images.length); };
    const prevImage = (e: any) => { e.stopPropagation(); setCurrentIdx((prev) => (prev - 1 + images.length) % images.length); };
    return ( <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in" onClick={onClose}> <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}> <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden"> {images.length > 0 ? ( <> <img src={images[currentIdx]} className="w-full h-full object-contain" /> {images.length > 1 && ( <> <button onClick={prevImage} className="absolute left-4 p-2 bg-white/10 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-colors"><ChevronLeft size={24}/></button> <button onClick={nextImage} className="absolute right-4 p-2 bg-white/10 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-colors"><ChevronRight size={24}/></button> <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"> {images.map((_: any, idx: number) => ( <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentIdx ? 'bg-white w-4' : 'bg-white/40'}`}></div> ))} </div> </> )} </> ) : ( <div className="text-slate-500 flex flex-col items-center"><ImageIcon size={48} className="mb-2 opacity-50"/> <span className="text-xs">Aucune image</span></div> )} <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 md:hidden"><X size={20}/></button> </div> <div className="w-full md:w-[400px] bg-white flex flex-col border-l border-slate-100"> <div className="p-6 border-b border-slate-100 flex justify-between items-start"> <div> <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-2">{item.title}</h2> <span className="px-3 py-1 bg-pink-100 text-pink-700 text-xs font-bold uppercase rounded-full tracking-wide">{item.category}</span> </div> <button onClick={onClose} className="hidden md:block p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button> </div> <div className="p-6 flex-1 overflow-y-auto"> <div className="text-3xl font-extrabold text-slate-900 mb-6">{item.price > 0 ? `${item.price.toLocaleString()} F` : 'Prix sur demande'}</div> <h4 className="text-sm font-bold text-slate-400 uppercase mb-2 tracking-wider">Description</h4> <p className="text-slate-600 leading-relaxed whitespace-pre-line mb-8"> {item.description || "Aucune description fournie pour ce modèle."} </p> </div> <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3"> {canManage && ( <button onClick={onEdit} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"> <Edit2 size={18}/> Modifier </button> )} {canDelete && ( <button onClick={onDelete} className="px-4 py-3 bg-white border border-slate-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors"> <Trash2 size={20}/> </button> )} </div> </div> </div> </div> )
}

function CatalogModal({ item, onClose, onSuccess, ownerId }: { item: CatalogItem | null, onClose: () => void, onSuccess: () => void, ownerId: string }) {
  const [formData, setFormData] = useState({ title: item?.title || '', category: item?.category || 'Tenue de ville', price: item?.price?.toString() || '', description: item?.description || '', });
  const initialImages = item?.images && item.images.length > 0 ? item.images : (item?.image_url ? [item.image_url] : []);
  const [images, setImages] = useState<string[]>(initialImages);
  const [loading, setLoading] = useState(false);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const files = e.target.files; if (files && files.length > 0) { if (images.length + files.length > 8) { alert("Maximum 8 images par modèle."); return; } Array.from(files).forEach((file: File) => { const reader = new FileReader(); reader.onloadend = () => { const img = new Image(); img.src = reader.result as string; img.onload = () => { const canvas = document.createElement('canvas'); const MAX_WIDTH = 800; const scaleSize = MAX_WIDTH / img.width; canvas.width = MAX_WIDTH; canvas.height = img.height * scaleSize; const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0, canvas.width, canvas.height); const dataUrl = canvas.toDataURL('image/jpeg', 0.85); setImages(prev => [...prev, dataUrl]); }; }; reader.readAsDataURL(file); }); } };
  const removeImage = (index: number) => { setImages(prev => prev.filter((_, i) => i !== index)); };
  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      const payload = { 
        title: formData.title, 
        category: formData.category, 
        price: parseFloat(formData.price) || 0, 
        description: formData.description, 
        images: images, 
        image_url: images.length > 0 ? images[0] : null 
      }; 
      
      if (ownerId === 'guest-user-id') {
        const storedCatalog = localStorage.getItem('stylistepro_guest_catalog');
        const localCatalog: CatalogItem[] = storedCatalog ? JSON.parse(storedCatalog) : [];
        if (item) {
          const updated = localCatalog.map(c => c.id === item.id ? { ...c, ...payload } : c);
          localStorage.setItem('stylistepro_guest_catalog', JSON.stringify(updated));
        } else {
          const newItem = {
            ...payload,
            id: 'catalog_' + Math.random().toString(36).substr(2, 9),
            user_id: ownerId,
            created_at: new Date().toISOString()
          };
          localCatalog.push(newItem);
          localStorage.setItem('stylistepro_guest_catalog', JSON.stringify(localCatalog));
        }
        onSuccess();
        return;
      }

      if (item) { 
        const { error } = await supabase.from('catalog').update(payload).eq('id', item.id); 
        if (error) throw error; 
      } else { 
        const { error } = await supabase.from('catalog').insert([{ ...payload, user_id: ownerId }]); 
        if (error) throw error; 
      } 
      onSuccess(); 
    } catch(e: any) { 
      alert("Erreur: " + String(e?.message)); 
    } finally { 
      setLoading(false); 
    } 
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50"> <h3 className="font-bold text-xl text-slate-800">{item ? 'Modifier Modèle' : 'Nouveau Modèle'}</h3> <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button> </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div> <label className="block text-sm font-bold text-slate-700 mb-3 flex justify-between"> <span>Galerie Photos ({images.length}/8)</span> {images.length > 0 && <span className="text-pink-600 text-xs font-normal">La première image sera la couverture</span>} </label> <div className="grid grid-cols-3 sm:grid-cols-4 gap-3"> {images.map((img, idx) => ( <div key={idx} className="aspect-square rounded-xl overflow-hidden relative group border border-slate-200 bg-slate-100"> <img src={img} className="w-full h-full object-cover" /> <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" > <X size={12}/> </button> {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] font-bold text-center py-0.5">PRINCIPALE</div>} </div> ))} {images.length < 8 && ( <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-pink-400 transition-colors group"> <Upload className="text-slate-400 group-hover:text-pink-500 mb-1" size={24}/> <span className="text-[10px] font-bold text-slate-500 group-hover:text-pink-600">Ajouter</span> <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" /> </label> )} </div> </div>
          <div> <label className="block text-sm font-bold text-slate-700 mb-2">Titre du modèle</label> <input required type="text" className="w-full p-3 border border-slate-200 rounded-xl focus:border-pink-500 outline-none font-bold text-slate-700" placeholder="Ex: Robe Bazin Riche" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /> </div>
          <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-sm font-bold text-slate-700 mb-2">Catégorie</label> <select className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:border-pink-500 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}> {CATEGORIES.filter(c => c !== 'Tout').map(c => <option key={c} value={c}>{c}</option>)} </select> </div> <div> <label className="block text-sm font-bold text-slate-700 mb-2">Prix (FCFA)</label> <input type="number" className="w-full p-3 border border-slate-200 rounded-xl focus:border-pink-500 outline-none font-bold" placeholder="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /> </div> </div>
          <div> <label className="block text-sm font-bold text-slate-700 mb-2">Description</label> <textarea className="w-full p-3 border border-slate-200 rounded-xl h-24 focus:border-pink-500 outline-none resize-none" placeholder="Détails du tissu, coupe..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /> </div>
        </form>
        <div className="p-6 border-t border-slate-100 bg-white"> <button onClick={handleSubmit} disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20" > {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} {loading ? 'Enregistrement...' : item ? 'Mettre à jour' : 'Ajouter au Catalogue'} </button> </div>
      </div>
    </div>
  );
}
