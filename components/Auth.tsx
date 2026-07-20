
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Scissors, Mail, Lock, Loader2, AlertCircle, 
  Store, ArrowRight, Camera, CheckCircle, MailCheck, Sparkles,
  Copy, ExternalLink, Database
} from 'lucide-react';
import { SQL_SETUP_SCRIPT } from '../types';

interface AuthProps {
  onStaffLogin?: (staff: any) => void;
}

export default function Auth({ onStaffLogin }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopImage, setShopImage] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSqlError, setIsSqlError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDemoMode = () => {
    localStorage.setItem('stylistepro_guest_session', 'true');
    window.location.reload();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          setShopImage(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Passage à l'étape 2 (Logo) si inscription
    if (mode === 'signup' && step === 1) {
      if (!shopName || !email || !password) {
        setError("Veuillez remplir tous les champs.");
        return;
      }
      setStep(2);
      return;
    }

    setLoading(true);
    setError(null);
    setIsSqlError(false);

    try {
      if (mode === 'login') {
        // LOGIN
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
            email: email.trim(), 
            password: password.trim() 
        });
        
        if (authError) {
             // Fallback: Tentative de connexion Staff si le compte Auth n'existe pas ou mdp faux
             const { data: staffData } = await supabase.from('team_members')
                .select('*')
                .eq('email', email.trim())
                .eq('password', password.trim())
                .maybeSingle();
             
             if (staffData) {
               localStorage.setItem('stylistepro_staff', JSON.stringify(staffData));
               if(onStaffLogin) onStaffLogin(staffData);
               return;
             }
             throw authError;
        }
        // Si succès, l'event onAuthStateChange dans App.tsx s'occupera du reste
      } else {
        // SIGNUP
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;

        const { data, error: signupError } = await supabase.auth.signUp({ 
          email: email.trim(), 
          password: password.trim(),
          options: { 
            data: { shop_name: shopName.trim() },
            emailRedirectTo: redirectUrl
          } 
        });
        
        if (signupError) throw signupError;

        if (data.user) {
          try {
            // Insertion du profil même si la session n'est pas encore active (confirmation email)
            // On tente l'upsert mais on n'échoue pas l'inscription complète si RLS le bloque (normal sans session active)
            const { error: profileError } = await supabase.from('profiles').upsert({ 
              id: data.user.id,
              shop_name: shopName.trim(),
              shop_logo_data: shopImage, 
              updated_at: new Date().toISOString()
            });
            if (profileError) {
              console.warn("Profil upsert non complété durant l'inscription (attendu si RLS est actif) :", profileError.message);
            }
          } catch (profileErr) {
            console.warn("Erreur d'insertion du profil durant l'inscription :", profileErr);
          }
          
          if (data.session) {
            // Auto-login réussi (si email confirmation est désactivé dans Supabase)
            window.location.reload();
          } else {
            // Email de confirmation envoyé (comportement par défaut de Supabase)
            setIsSuccess(true);
          }
        }
      }
    } catch (err: any) {
      console.error("Auth Error Full Object:", err);
      let msg = err.message || "Erreur inconnue";
      
      if (msg.includes("Invalid login credentials")) {
          msg = "Email ou mot de passe incorrect. Si vous venez de vous inscrire, vérifiez vos emails pour confirmer votre compte.";
      } else if (msg.includes("Failed to fetch")) {
          msg = "Problème de connexion au serveur Supabase. Vérifiez votre internet ou désactivez votre bloqueur de publicités.";
      } else if (msg.includes("User already registered")) {
          msg = "Cet email est déjà utilisé par un autre atelier.";
      } else if (msg.includes("Signup is disabled")) {
          msg = "Les inscriptions sont temporairement désactivées.";
      } else if (msg.includes("Database error saving new user")) {
          setIsSqlError(true);
          msg = "Erreur de base de données : Le déclencheur d'inscription Supabase (Trigger) a échoué car les tables requises (notamment 'profiles') ne sont pas encore créées dans votre base de données Supabase. Suivez les instructions ci-dessous pour copier et exécuter le script SQL de configuration.";
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="relative z-10 w-full max-w-md animate-fade-in-up">
          <div className="bg-white border border-slate-200/60 p-10 rounded-[3rem] shadow-2xl text-center">
            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner animate-bounce">
              <MailCheck size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Vérifiez vos emails !</h2>
            <p className="text-slate-500 mb-10 font-medium leading-relaxed">
              Un lien de confirmation a été envoyé à <span className="text-slate-900 font-bold">{email}</span>. 
              Veuillez cliquer dessus pour activer votre atelier et pouvoir vous connecter.
            </p>
            <button 
              onClick={() => { setIsSuccess(false); setMode('login'); }}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-100/50 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="flex justify-center mb-8">
           <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-pink-600 shadow-xl shadow-pink-600/20 flex items-center justify-center text-white">
                 <Scissors size={24} />
               </div>
               <span className="text-slate-900 font-black text-2xl tracking-tight">Styliste<span className="text-pink-600">Pro</span></span>
           </div>
        </div>

        <div className="bg-white border border-slate-200/60 p-8 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
            <h2 className="text-3xl font-black text-slate-900 mb-2 text-center tracking-tight">
               {mode === 'login' ? 'Bon retour.' : step === 2 ? 'Votre Identité.' : 'Nouvel Atelier.'}
            </h2>
            <p className="text-slate-500 mb-8 text-sm text-center font-medium leading-relaxed px-4">
               {mode === 'login' ? 'Accédez à votre espace de gestion.' : step === 2 ? 'Ajoutez votre logo (optionnel).' : 'Créez votre compte en quelques secondes.'}
            </p>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[11px] font-bold flex items-start gap-2 animate-fade-in">
                    <AlertCircle size={16} className="shrink-0 mt-0.5"/> <span>{error}</span>
                </div>
            )}

            {isSqlError && (
                <div className="mb-6 p-5 bg-slate-50 border border-slate-200/80 rounded-2xl animate-fade-in text-slate-700">
                    <div className="flex items-center gap-2 mb-3 text-pink-600">
                        <Database size={18} />
                        <h4 className="font-black text-xs uppercase tracking-wider">Configuration de la Base de Données</h4>
                    </div>
                    <p className="text-xs font-semibold leading-relaxed mb-4">
                        Pour activer votre application, vous devez initialiser vos tables de base de données dans Supabase. C'est très simple :
                    </p>
                    <ol className="list-decimal pl-4 space-y-2 text-[11px] font-medium leading-relaxed mb-4">
                        <li>
                            Allez sur votre <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-pink-600 font-bold inline-flex items-center gap-0.5 hover:underline">Console Supabase <ExternalLink size={10} /></a>.
                        </li>
                        <li>Sélectionnez votre projet.</li>
                        <li>Cliquez sur <strong>SQL Editor</strong> dans le menu de gauche.</li>
                        <li>Cliquez sur <strong>New Query</strong> (Nouvelle Requête).</li>
                        <li>Copiez le code SQL ci-dessous et collez-le dans l'éditeur.</li>
                        <li>Cliquez sur le bouton vert <strong>Run</strong> en bas à droite pour l'exécuter.</li>
                    </ol>

                    <div className="relative bg-slate-900 rounded-xl overflow-hidden p-3.5 mb-3 border border-slate-800">
                        <span className="text-[9px] font-mono text-slate-500 block mb-1">SCRIPT SQL D'INITIALISATION</span>
                        <div className="max-h-[120px] overflow-y-auto no-scrollbar font-mono text-[9px] text-slate-300 whitespace-pre-wrap leading-tight">
                            {SQL_SETUP_SCRIPT}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
                        >
                            <Copy size={12} />
                            {copied ? 'Copié !' : 'Copier'}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 italic font-medium leading-normal text-center">
                        💡 Une fois le script exécuté avec succès, cliquez à nouveau sur le bouton "S'inscrire" ci-dessus pour finaliser la création de votre atelier.
                    </p>
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
                {mode === 'signup' && step === 2 ? (
                    <div className="text-center py-2 animate-fade-in">
                        <div className="w-40 h-40 bg-slate-50 rounded-[2.5rem] mx-auto mb-8 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 relative group cursor-pointer hover:border-pink-500 transition-all hover:scale-105 shadow-inner">
                            {shopImage ? (
                                <img src={shopImage} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center text-slate-400 group-hover:text-pink-500 transition-colors">
                                    <Camera size={48} className="mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Ajouter Logo</span>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <div className="flex flex-col gap-3">
                            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                                {loading ? <Loader2 className="animate-spin"/> : 'Terminer l\'inscription'}
                            </button>
                            <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600">Retour aux informations</button>
                        </div>
                    </div>
                ) : (
                    <>
                        {mode === 'signup' && (
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 focus-within:ring-4 focus-within:ring-pink-500/5 focus-within:bg-white focus-within:border-pink-500 transition-all group">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest group-focus-within:text-pink-600 transition-colors">Nom de l'atelier</label>
                                <div className="flex items-center gap-3">
                                    <Store size={18} className="text-slate-400 group-focus-within:text-pink-600 transition-colors"/>
                                    <input type="text" required className="bg-transparent border-none outline-none text-slate-900 w-full placeholder-slate-300 font-bold" placeholder="Ex: Maison de Couture" value={shopName} onChange={e => setShopName(e.target.value)} />
                                </div>
                            </div>
                        )}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 focus-within:ring-4 focus-within:ring-pink-500/5 focus-within:bg-white focus-within:border-pink-500 transition-all group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest group-focus-within:text-pink-600 transition-colors">Email</label>
                            <div className="flex items-center gap-3">
                                <Mail size={18} className="text-slate-400 group-focus-within:text-pink-600 transition-colors"/>
                                <input type="email" required className="bg-transparent border-none outline-none text-slate-900 w-full placeholder-slate-300 font-bold" placeholder="atelier@exemple.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 focus-within:ring-4 focus-within:ring-pink-500/5 focus-within:bg-white focus-within:border-pink-500 transition-all group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest group-focus-within:text-pink-600 transition-colors">Mot de passe</label>
                            <div className="flex items-center gap-3">
                                <Lock size={18} className="text-slate-400 group-focus-within:text-pink-600 transition-colors"/>
                                <input type="password" required minLength={6} className="bg-transparent border-none outline-none text-slate-900 w-full placeholder-slate-300 font-bold" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-pink-600 hover:bg-pink-700 text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-pink-600/20 flex items-center justify-center gap-3 mt-4 active:scale-95 transition-all">
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'Se connecter' : 'Suivant')}
                            {!loading && mode === 'signup' && <ArrowRight size={18} />}
                        </button>
                    </>
                )}
            </form>

            <div className="mt-8 text-center border-t border-slate-100 pt-8">
                {mode === 'login' ? (
                    <p className="text-sm text-slate-400 font-medium">
                        Pas encore d'atelier ? <button onClick={() => { setMode('signup'); setStep(1); }} className="text-pink-600 font-black hover:underline ml-1">Créer un compte</button>
                    </p>
                ) : (
                    step === 1 && (
                        <p className="text-sm text-slate-400 font-medium">
                            Déjà inscrit ? <button onClick={() => setMode('login')} className="text-pink-600 font-black hover:underline ml-1">Se connecter</button>
                        </p>
                    )
                )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={handleDemoMode}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-3.5 rounded-[20px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-slate-100/80 active:scale-95 shadow-sm"
                >
                  <Sparkles size={16} className="text-pink-500 animate-pulse"/> Essayer en mode Démo (Instantané)
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
