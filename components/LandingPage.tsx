
import React, { useEffect, useState } from 'react';
import { 
  Scissors, ArrowRight, Star, ShieldCheck, Zap, 
  MessageCircle, Users, BarChart3, CheckCircle, Smartphone, 
  Mic, Wifi, WifiOff, Globe, Sparkles, CreditCard, Lock, Crown, Quote,
  Menu, X, HelpCircle, ChevronDown, ChevronRight, BookOpen, Briefcase, FileText
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDocIndex, setOpenDocIndex] = useState<number | null>(0);

  const navLinks = [
    { label: 'Avantages', id: 'features' },
    { label: 'Guide', id: 'guide' },
    { label: 'Avis', id: 'testimonials' },
    { label: 'Offres', id: 'pricing' }
  ];

  const docSections = [
    {
      title: "Prise en main",
      icon: Smartphone,
      content: "StylistePro fonctionne sur mobile, tablette et ordinateur. Le tableau de bord vous donne un aperçu en temps réel de vos commandes 'Prêtes' et de vos revenus du mois."
    },
    {
      title: "Assistant Vocal IA",
      icon: Mic,
      content: "C'est notre outil magique. Restez à votre machine à coudre et dites : 'Nouveau client Amadou, poitrine 45, épaule 38'. L'IA crée la fiche client et enregistre les mesures automatiquement."
    },
    {
      title: "Suivi des Commandes",
      icon: FileText,
      content: "Passez vos commandes de 'En attente' à 'En cours', puis 'Prêt'. Dès qu'une tenue est prête, le client reçoit un code de retrait unique."
    },
    {
      title: "Relances WhatsApp",
      icon: MessageCircle,
      content: "Ne perdez plus de temps à appeler. L'application prépare des messages personnalisés pour vos clients pour confirmer la commande ou signaler qu'elle est terminée."
    },
    {
      title: "Gestion des Apprentis",
      icon: Briefcase,
      content: "Gérez vos contrats de formation et suivez les paiements des frais de scolarité de vos élèves tailleurs directement dans l'onglet Personnel."
    },
    {
      title: "Mode Hors-ligne",
      icon: WifiOff,
      content: "Pas d'Internet à l'atelier ? Aucun problème. L'application enregistre tout localement. Dès que vous retrouvez du réseau, les données sont synchronisées automatiquement avec le serveur Supabase."
    }
  ];

  const scrollTo = (id: string) => {
    setIsMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleDoc = (index: number) => {
    setOpenDocIndex(openDocIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-display text-slate-900 overflow-x-hidden selection:bg-pink-100 selection:text-pink-900">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-[60] bg-white/80 backdrop-blur-md py-4 px-6 lg:px-12 flex justify-between items-center border-b border-slate-200/60 transition-all duration-300">
        <div className="flex items-center gap-2">
           <div className="w-10 h-10 rounded-xl bg-pink-600 flex items-center justify-center shadow-lg shadow-pink-600/20 text-white">
             <Scissors size={20} />
           </div>
           <span className="font-bold text-xl tracking-tight text-slate-900">Styliste<span className="text-pink-600">Pro</span></span>
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-500">
            {navLinks.map(link => (
              <button key={link.id} onClick={() => scrollTo(link.id)} className="hover:text-slate-900 transition-colors">{link.label}.</button>
            ))}
        </div>

        <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={onStart}
              className="hidden md:block bg-slate-900 text-white px-5 lg:px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 transition-all hover:scale-105 shadow-lg shadow-slate-900/20"
            >
              Connexion.
            </button>
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              aria-label="Menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>

        {/* Mobile/Tablet Dropdown Menu */}
        <div className={`absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-2xl transition-all duration-300 lg:hidden overflow-hidden ${isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
            <div className="p-6 md:px-12 flex flex-col gap-6">
                {navLinks.map(link => (
                    <button 
                        key={link.id} 
                        onClick={() => scrollTo(link.id)} 
                        className="text-left text-lg font-bold text-slate-700 hover:text-pink-600 flex items-center justify-between group"
                    >
                        {link.label}
                        <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"/>
                    </button>
                ))}
                <div className="pt-6 border-t border-slate-100">
                    <button 
                      onClick={onStart}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-base shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
                    >
                      Se connecter à mon atelier
                    </button>
                </div>
            </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative pt-32 md:pt-40 pb-12 px-6 md:px-12 flex flex-col items-center text-center overflow-hidden min-h-[85vh] justify-center">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[800px] h-[400px] md:h-[500px] bg-pink-300/20 rounded-full blur-[120px] -z-10"></div>
        
        {/* FLOATING ELEMENTS - DESKTOP ONLY */}
        <div className="hidden xl:block absolute inset-0 pointer-events-none overflow-hidden select-none">
            {/* Card 1: Payment Notification */}
            <div className="absolute top-[25%] left-[10%] animate-float p-4 bg-white rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle size={20} />
                </div>
                <div className="text-left">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acompte reçu</div>
                    <div className="text-sm font-bold text-slate-900">+ 15.000 FCFA</div>
                </div>
            </div>

            {/* Card 2: Voice Command Mockup */}
            <div className="absolute top-[35%] right-[8%] animate-float p-4 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.5s', animationDuration: '7s' }}>
                <div className="w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center animate-pulse">
                    <Mic size={20} />
                </div>
                <div className="text-left">
                    <div className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Stylé IA</div>
                    <div className="text-xs font-medium text-slate-300">"Nouveau client Amadou..."</div>
                </div>
            </div>

            {/* Card 3: Client Measurement */}
            <div className="absolute bottom-[20%] left-[15%] animate-float p-4 bg-white rounded-2xl shadow-2xl border border-slate-100 animate-fade-in-up" style={{ animationDelay: '0.8s', animationDuration: '5s' }}>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><Users size={14}/></div>
                    <span className="text-[10px] font-bold text-slate-900">Moussa Diop</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 px-2 py-1 rounded-md text-[9px] font-bold text-slate-500">Poitrine: 45</div>
                    <div className="bg-slate-50 px-2 py-1 rounded-md text-[9px] font-bold text-slate-500">Épaule: 38</div>
                </div>
            </div>

            {/* Icon 4: Floating Scissors */}
            <div className="absolute bottom-[30%] right-[15%] animate-float p-5 bg-pink-50 text-pink-600 rounded-3xl shadow-xl shadow-pink-200/50 animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
                <Scissors size={32} />
            </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-pink-100 shadow-sm mb-6 animate-fade-in backdrop-blur-md relative z-10">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
          </span>
          <span className="text-[10px] md:text-xs font-bold text-pink-600 uppercase tracking-wider">L'IA arrive dans la couture.</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.2] mb-6 max-w-5xl tracking-tight animate-fade-in-up px-4 relative z-10">
          Votre Atelier.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600">Plus Simple. Plus Beau.</span>
        </h1>
        
        <p className="text-slate-600 text-base md:text-lg lg:text-xl max-w-2xl mb-10 leading-relaxed animate-fade-in-up delay-100 font-medium font-sans px-4 relative z-10">
          Gérez vos clients et encaissez vos paiements. 
          <span className="text-slate-900 font-bold"> Tout ça, juste avec votre voix.</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-10 animate-fade-in-up delay-200 w-full max-w-md px-4 sm:px-0 relative z-10">
           <button onClick={onStart} className="flex-1 px-8 py-4 bg-pink-600 text-white rounded-full font-bold text-lg hover:bg-pink-700 transition-all hover:scale-105 shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2">Essayer. <ArrowRight size={20}/></button>
           <button onClick={onStart} className="flex-1 px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm">Voir démo. <Sparkles size={18} className="text-yellow-500 fill-yellow-500"/></button>
        </div>

        <div id="features" className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 auto-rows-auto lg:auto-rows-[220px] mt-12 text-left px-4 md:px-0 relative z-10">
            <div className="md:col-span-1 lg:col-span-2 lg:row-span-2 bg-white border border-slate-200 rounded-[2rem] p-6 md:p-7 lg:p-10 flex flex-col justify-between relative overflow-hidden group hover:border-pink-200 hover:shadow-2xl transition-all duration-500 shadow-sm min-h-[280px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50 rounded-full blur-[60px] -z-10 group-hover:bg-pink-100 transition-colors"></div>
                <div>
                    <div className="w-10 h-10 md:w-12 bg-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-pink-600/20 text-white transform group-hover:scale-110 transition-transform duration-500"><Mic size={22} /></div>
                    <h3 className="text-xl md:text-xl lg:text-3xl font-extrabold text-slate-900 mb-3 leading-tight tracking-tight">Parlez, tout est noté.</h3>
                    <p className="text-slate-500 font-medium text-sm md:text-sm lg:text-base max-w-sm leading-relaxed font-sans">Dites simplement : <br/><span className="italic text-slate-800">"Nouveau client Jean..."</span>. <br/> L'IA crée la fiche et note les mesures.</p>
                </div>
                <div className="flex items-end justify-center gap-1.5 h-12 md:h-16 opacity-80 mt-6 md:mt-8">
                    {[40, 70, 30, 80, 50, 90, 40, 60, 30, 70, 40, 80, 30, 50, 20].map((h, i) => (<div key={i} className="w-2 md:w-2.5 bg-pink-500 rounded-full animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}></div>))}
                </div>
            </div>
            <div className="md:col-span-1 lg:row-span-2 bg-green-50 border border-green-100 rounded-[2rem] p-6 md:p-7 relative overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-green-500/10 transition-all duration-500 min-h-[280px]">
                 <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/30 text-white"><MessageCircle size={20} /></div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Relances WhatsApp.</h3>
                 <p className="text-slate-500 text-sm mb-6 font-medium font-sans">Prévenez vos clients automatiquement dès que c'est prêt.</p>
                 <div className="flex-1 space-y-3 flex flex-col justify-end pb-2 font-sans">
                     <div className="bg-white p-3 rounded-tr-xl rounded-tl-xl rounded-bl-xl text-[10px] text-slate-600 ml-auto max-w-[90%] shadow-sm border border-slate-100">Votre tenue est prête ! 👗</div>
                     <div className="bg-green-500 p-3 rounded-tr-xl rounded-tl-xl rounded-br-xl text-[10px] text-white mr-auto max-w-[90%] shadow-md shadow-green-500/20">Waoouh merci ! J'arrive.</div>
                 </div>
            </div>
            <div className="md:col-span-1 bg-white border border-slate-200 rounded-[2rem] p-6 md:p-7 flex flex-col justify-between hover:shadow-xl transition-all duration-500 group shadow-sm min-h-[160px] md:min-h-0 lg:min-h-[220px]">
                 <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500"><BarChart3 size={20}/></div>
                 <div><div className="text-xl font-extrabold text-slate-900 tracking-tight">Finance.</div><div className="text-xs text-slate-500 mt-1 font-sans">Suivi des dettes et recettes.</div></div>
            </div>
            <div className="md:col-span-1 bg-slate-50 border border-slate-200 rounded-[2rem] p-6 md:p-7 flex items-center gap-4 hover:shadow-xl transition-all duration-500 shadow-sm group min-h-[160px] md:min-h-0 lg:min-h-[220px]">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-100 text-slate-400 group-hover:text-slate-900 transition-colors"><WifiOff size={20}/></div>
                 <div><h3 className="font-bold text-slate-900 text-lg tracking-tight">Zéro Internet ?</h3><p className="text-[10px] text-slate-500 font-medium font-sans">Ça fonctionne sans connexion.</p></div>
            </div>
             <div className="md:col-span-1 lg:col-span-2 bg-white border border-slate-200 rounded-[2rem] p-6 md:p-7 lg:p-10 flex flex-col md:flex-col lg:flex-row items-center lg:justify-between relative overflow-hidden group hover:shadow-2xl transition-all duration-500 shadow-sm min-h-[240px] md:min-h-0">
                 <div className="relative z-10 w-full lg:w-1/2 mb-6 lg:mb-0 text-center lg:text-left">
                     <div className="flex items-center justify-center lg:justify-start gap-2 mb-3"><div className="p-1 bg-yellow-100 rounded-lg"><Crown size={16} className="text-yellow-600"/></div><h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Vitrine digitale.</h3></div>
                     <p className="text-xs text-slate-500 font-medium font-sans">Votre book photo de luxe.</p>
                 </div>
                 <div className="relative flex justify-center lg:justify-end w-full lg:w-1/2 scale-90 md:scale-80 lg:scale-100">
                     <div className="flex -space-x-3 md:-space-x-4 lg:-space-x-5">
                         {["1539109136881-3be0616acf4b", "1490481651871-ab68de25d43d", "1509631179647-0177331693ae"].map((id, i) => (
                             <div key={id} className={`w-16 h-20 md:w-18 md:h-24 lg:w-24 lg:h-32 rounded-xl bg-slate-100 border-4 border-white transform ${i === 0 ? '-rotate-6' : i === 2 ? 'rotate-6' : 'rotate-0 translate-y-1.5'} transition-all duration-500 shadow-xl overflow-hidden shrink-0 z-${30 - (i*10)}`}>
                                 <img src={`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=300&q=80`} className="w-full h-full object-cover" alt="Fashion preview." />
                             </div>
                         ))}
                     </div>
                 </div>
            </div>
            <div className="md:col-span-1 lg:col-span-2 bg-slate-900 text-white border border-slate-800 rounded-[2rem] p-6 md:p-7 lg:p-10 flex flex-col md:flex-col lg:flex-row items-center justify-between shadow-xl relative overflow-hidden min-h-[160px] md:min-h-0 lg:min-h-[220px]">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                <div className="relative z-10 text-left w-full lg:max-w-[65%] mb-4 lg:mb-0">
                     <h3 className="font-bold text-base md:text-lg mb-1 leading-tight tracking-tight">Gérez vos apprentis.</h3>
                     <p className="text-[10px] text-slate-400 font-medium font-sans">Contrats et scolarité.</p>
                </div>
                <div className="flex -space-x-2 relative z-10 shrink-0">
                    {[1,2,3].map(i => (<div key={i} className="w-8 h-8 md:w-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white uppercase">{['A','M','S'][i-1]}</div>))}
                    <div className="w-8 h-8 md:w-10 rounded-full bg-pink-600 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold">+3</div>
                </div>
            </div>
        </div>
      </header>

      {/* DOCUMENTATION / GUIDE SECTION */}
      <section id="guide" className="py-24 px-6 md:px-12 bg-white">
          <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Aide & Guide</div>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Tout comprendre en 1 minute.</h2>
                  <p className="text-slate-500 mt-4 font-medium font-sans">Parce que votre métier c'est la couture, pas l'informatique.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                  {docSections.map((doc, idx) => (
                      <div key={idx} className={`border rounded-3xl transition-all duration-300 overflow-hidden ${openDocIndex === idx ? 'border-pink-200 bg-pink-50/20 shadow-lg' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                          <button 
                              onClick={() => toggleDoc(idx)}
                              className="w-full p-6 md:p-8 flex items-center justify-between text-left group"
                          >
                              <div className="flex items-center gap-4 md:gap-6">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${openDocIndex === idx ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                                      <doc.icon size={22} />
                                  </div>
                                  <h3 className={`text-lg md:text-xl font-bold ${openDocIndex === idx ? 'text-slate-900' : 'text-slate-700'}`}>{doc.title}</h3>
                              </div>
                              <div className={`transition-transform duration-300 ${openDocIndex === idx ? 'rotate-180 text-pink-600' : 'text-slate-400'}`}>
                                  <ChevronDown size={24} />
                              </div>
                          </button>
                          <div className={`transition-all duration-500 ease-in-out ${openDocIndex === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                              <div className="px-6 pb-8 md:px-24 md:pb-12 text-slate-600 font-sans leading-relaxed text-base">
                                  {doc.content}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>

              <div className="mt-12 bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                  <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-pink-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-pink-600/20 animate-pulse"><Mic size={28}/></div>
                      <div>
                          <h4 className="text-lg font-bold">L'assistant vocal est là.</h4>
                          <p className="text-sm text-slate-400 font-medium font-sans">Pas besoin de taper, parlez simplement à l'appli.</p>
                      </div>
                  </div>
                  <button onClick={onStart} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2">Découvrir Stylé IA <ArrowRight size={18}/></button>
              </div>
          </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-20 px-6 md:px-12 bg-[#FDFBF9] border-t border-slate-100">
          <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 px-4">
                  <span className="text-pink-600 font-bold text-sm tracking-widest uppercase mb-2 block">Communauté.</span>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Ils l'ont adopté.</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: 'Awa Diop', city: 'Dakar', text: "Tout est dans mon téléphone. Mes clients adorent leurs factures WhatsApp.", img: "1531123897727-8f129e1688ce" },
                    { name: 'Marc K.', city: 'Abidjan', text: "Je couds, je parle, et StylistePro note tout. Magique !", img: "1506794778202-cad84cf45f1d", dark: true },
                    { name: 'Sophie T.', city: 'Douala', text: "Gérer mes apprentis était un cauchemar. Maintenant, c'est un jeu d'enfant.", img: "1589156280159-27698a70f29e" }
                  ].map((t, i) => (
                    <div key={i} className={`p-8 rounded-[2rem] relative border transition-all ${t.dark ? 'bg-slate-900 text-white border-slate-800 shadow-2xl lg:scale-105 z-10' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <Quote className={`absolute top-8 right-8 ${t.dark ? 'text-slate-700' : 'text-pink-100'}`} size={40}/>
                      <div className="flex items-center gap-1 mb-4 text-yellow-400">
                        {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="currentColor"/>)}
                      </div>
                      <p className={`font-medium font-sans mb-8 leading-relaxed text-sm ${t.dark ? 'text-slate-300' : 'text-slate-600'}`}>"{t.text}"</p>
                      <div className="flex items-center gap-3">
                        <img src={`https://images.unsplash.com/photo-${t.img}?auto=format&fit=crop&w=150&q=80`} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt={t.name} />
                        <div>
                          <div className={`font-bold text-sm ${t.dark ? 'text-white' : 'text-slate-900'}`}>{t.name}</div>
                          <div className={`text-[10px] uppercase font-bold tracking-wider ${t.dark ? 'text-slate-500' : 'text-slate-400'}`}>{t.city}</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
          </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6 md:px-12 bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto text-center">
              <div className="mb-10 px-4">
                  <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Prix Mini.</h2>
                  <p className="text-slate-500 text-lg font-medium font-sans">Transformez votre atelier pour le prix d'un café.</p>
              </div>

              <div className="flex justify-center items-center gap-4 mb-14 font-sans">
                  <button onClick={() => setBillingCycle('monthly')} className={`text-sm font-bold transition-colors ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Mensuel.</button>
                  <div onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')} className="w-14 h-8 bg-slate-100 rounded-full p-1 cursor-pointer border-2 border-slate-200 relative transition-colors hover:border-pink-300">
                      <div className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${billingCycle === 'monthly' ? 'bg-white translate-x-0' : 'bg-pink-600 translate-x-6'}`}></div>
                  </div>
                  <button onClick={() => setBillingCycle('yearly')} className={`text-sm font-bold transition-colors flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>Annuel. <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wide">🎁 -15%</span></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-xl flex flex-col hover:border-slate-300 transition-all text-left">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mb-6">Standard</span>
                      <div className="mb-10 flex items-baseline gap-1">
                          <span className="text-5xl font-extrabold text-slate-900">{billingCycle === 'monthly' ? '100' : '1.000'}</span>
                          <span className="text-2xl text-slate-400 font-bold">F</span>
                          <span className="text-sm text-slate-500 font-medium ml-1">/{billingCycle === 'monthly' ? 'mois' : 'an'}</span>
                      </div>
                      <div className="flex-1 space-y-4 mb-10 font-sans text-sm">
                          <CheckItem text="Clients & Mesures Illimités." />
                          <CheckItem text="Suivi des Commandes." />
                          <CheckItem text="Catalogue Digital Simple." />
                      </div>
                      <button onClick={onStart} className="w-full py-4 rounded-2xl border-2 border-slate-100 text-slate-700 font-bold hover:bg-slate-50 transition-all active:scale-95">Choisir Standard.</button>
                  </div>
                  <div className="bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 flex flex-col relative shadow-2xl shadow-slate-900/30 md:scale-105 text-left">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">Populaire.</div>
                      <span className="bg-white/10 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mb-6 backdrop-blur-sm">PRO</span>
                      <div className="mb-10 flex items-baseline gap-1 text-white">
                          <span className="text-5xl font-extrabold">{billingCycle === 'monthly' ? '500' : '5.000'}</span>
                          <span className="text-2xl text-slate-400 font-bold">F</span>
                          <span className="text-sm text-slate-500 font-medium ml-1">/{billingCycle === 'monthly' ? 'mois' : 'an'}</span>
                      </div>
                      <div className="flex-1 space-y-4 mb-10 font-sans text-sm">
                          <CheckItem text="Assistant Vocal IA." dark />
                          <CheckItem text="WhatsApp Automatique." dark />
                          <CheckItem text="Factures & Reçus PDF." dark />
                          <CheckItem text="Gestion des Apprentis." dark />
                      </div>
                      <button onClick={onStart} className="w-full py-4 rounded-2xl bg-pink-600 text-white font-black hover:bg-pink-700 transition-all shadow-xl shadow-pink-600/30 active:scale-95">Passer PRO.</button>
                  </div>
              </div>
          </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 border-t border-slate-200 text-center text-slate-500 text-sm bg-[#FDFBF9]">
          <div className="flex items-center justify-center gap-2 mb-6 text-slate-900 font-bold text-xl">
              <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center text-white"><Scissors size={16}/></div>
              StylistePro.
          </div>
          <p className="font-medium font-sans px-4">© 2025 Tous droits réservés. Créé pour les ateliers d'Afrique.</p>
          <div className="flex justify-center gap-6 mt-8 text-[10px] md:text-xs uppercase font-black tracking-widest">
              <button className="hover:text-pink-600 transition-colors">Confidentialité</button>
              <button className="hover:text-pink-600 transition-colors">Conditions</button>
              <button className="hover:text-pink-600 transition-colors">Support</button>
          </div>
      </footer>

    </div>
  );
}

function CheckItem({ text, dark = false }: { text: string, dark?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${dark ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600'}`}>
                <CheckCircle size={12} strokeWidth={3}/>
            </div>
            <span className={`font-medium ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{text}</span>
        </div>
    )
}
