
import React, { useState } from 'react';
import { 
  ChevronDown, ChevronRight, Mic, Users, 
  FileText, CreditCard, MessageCircle, 
  Settings, Crown, HelpCircle, BookOpen, 
  ShieldCheck, Zap, Smartphone, WifiOff,
  Briefcase, ArrowRight
} from 'lucide-react';

interface DocSectionProps {
  title: string;
  icon: React.ElementType;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

const DocSection = ({ title, icon: Icon, children, defaultOpen = false }: DocSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-100 last:border-0 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
            <Icon size={20} />
          </div>
          <h3 className="font-bold text-slate-800">{title}</h3>
        </div>
        {isOpen ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-8 md:px-20 text-slate-600 space-y-4 font-sans text-sm md:text-base leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function Documentation() {
  return (
    <div className="max-w-4xl mx-auto h-full bg-white flex flex-col animate-fade-in pb-40">
      <div className="p-8 border-b border-slate-100 bg-[#FDFBF9]">
        <div className="flex items-center gap-3 text-pink-600 mb-2">
            <HelpCircle size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Aide & Guide</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Guide d'utilisation StylistePro.</h2>
        <p className="text-slate-500 font-medium text-sm mt-2">Apprenez à maîtriser votre atelier digital en quelques minutes.</p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <DocSection title="Prise en main" icon={Smartphone} defaultOpen>
          <p>
            Bienvenue sur StylistePro ! Cette application a été conçue pour simplifier la vie des ateliers de couture en Afrique. 
            Elle fonctionne sur mobile, tablette et ordinateur, même sans connexion Internet.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Dashboard :</strong> Aperçu de vos travaux en cours et de vos revenus.</li>
            <li><strong>Profil :</strong> C'est ici que vous configurez le nom de votre atelier et vos moyens de paiement.</li>
            <li><strong>Navigation :</strong> Utilisez le menu en bas sur mobile ou sur le côté sur ordinateur.</li>
          </ul>
        </DocSection>

        <DocSection title="Clients & Mesures" icon={Users}>
          <p>La base de votre atelier est votre fichier client. Ne perdez plus vos carnets en papier !</p>
          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
             <div className="flex gap-3">
               <div className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs shrink-0">1</div>
               <p><strong>Importer :</strong> Utilisez le bouton "Importer Répertoire" pour ajouter vos clients directement depuis vos contacts téléphone.</p>
             </div>
             <div className="flex gap-3">
               <div className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs shrink-0">2</div>
               <p><strong>Mesures :</strong> Cliquez sur un client pour voir ou modifier ses mesures. StylistePro enregistre plus de 10 points de mesure (épaule, poitrine, etc.).</p>
             </div>
          </div>
        </DocSection>

        <DocSection title="Commandes & Statuts" icon={FileText}>
          <p>Suivez l'avancement de chaque tenue avec précision.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>En attente :</strong> Commande enregistrée mais travail non commencé.</li>
            <li><strong>En cours :</strong> Le tailleur travaille sur la tenue.</li>
            <li><strong>Prêt :</strong> La tenue est finie et attend le client.</li>
            <li><strong>Livré :</strong> Le client a récupéré sa commande.</li>
          </ul>
          <p className="bg-blue-50 p-3 rounded-lg text-blue-700 font-medium text-sm italic">
            💡 Astuce : Passez une commande en "Prêt" pour générer automatiquement un code de paiement pour le client.
          </p>
        </DocSection>

        <DocSection title="Assistant Vocal (Stylé IA)" icon={Mic}>
          <div className="flex items-center gap-2 text-pink-600 font-black text-xs uppercase mb-4">
              <Crown size={14} /> Fonctionnalité PRO
          </div>
          <p>C'est l'outil le plus puissant pour gagner du temps. Vous pouvez parler à l'application pendant que vous travaillez.</p>
          <p className="font-bold">Comment l'utiliser :</p>
          <div className="space-y-4">
            <div className="border-l-4 border-slate-200 pl-4 py-1">
                <p className="text-xs text-slate-400 uppercase font-black mb-1">Créer un client</p>
                <p className="italic">"Nouveau client Monsieur Jean, téléphone 07 08 09 10, poitrine 45, épaule 38."</p>
            </div>
            <div className="border-l-4 border-slate-200 pl-4 py-1">
                <p className="text-xs text-slate-400 uppercase font-black mb-1">Créer une commande</p>
                <p className="italic">"Commande pour Marie, une robe de soirée à 25 000 francs, elle a donné 10 000 d'avance."</p>
            </div>
            <div className="border-l-4 border-slate-200 pl-4 py-1">
                <p className="text-xs text-slate-400 uppercase font-black mb-1">Encaisser un paiement</p>
                <p className="italic">"Encaissement de 5 000 francs pour la commande de Moussa."</p>
            </div>
          </div>
        </DocSection>

        <DocSection title="WhatsApp & Automatisations" icon={MessageCircle}>
          <p>Réduisez les impayés et communiquez mieux avec vos clients.</p>
          <ul className="list-disc pl-5 space-y-4">
            <li>
                <strong>Mode Classique :</strong> Quand vous changez un statut, l'application ouvre un onglet WhatsApp avec un message tout prêt pour le client.
            </li>
            <li>
                <strong>Mode Automatique (PRO) :</strong> Dans Paramètres &gt; Automatisations, configurez un Webhook pour envoyer les messages sans même ouvrir d'onglet.
            </li>
          </ul>
        </DocSection>

        <DocSection title="Gestion des Apprentis" icon={Briefcase}>
          <p>Idéal pour les patrons d'ateliers qui forment des jeunes.</p>
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
             <h4 className="font-bold text-blue-800 mb-2">Fonctions clés :</h4>
             <ul className="space-y-2 text-sm text-blue-700">
                 <li className="flex gap-2">✅ Génération de contrats de formation officiels.</li>
                 <li className="flex gap-2">✅ Suivi des paiements des frais de scolarité.</li>
                 <li className="flex gap-2">✅ Permissions limitées pour protéger vos données financières.</li>
             </ul>
          </div>
        </DocSection>

        <DocSection title="Fonctionnement Hors-Ligne" icon={WifiOff}>
          <p>
            Internet est capricieux ? StylistePro est conçu pour ça. 
            L'application enregistre tout localement. Dès que vous retrouvez du réseau, 
            les données sont synchronisées automatiquement avec le serveur Supabase.
          </p>
          <p className="text-xs text-slate-400 italic">
            * Note : L'assistant vocal IA et le support client nécessitent Internet pour fonctionner.
          </p>
        </DocSection>
      </div>

      <div className="p-8 border-t border-slate-100 text-center pb-12">
          <p className="text-sm text-slate-400 mb-4 font-medium">Vous avez encore des questions ?</p>
          <button 
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            Contacter le support <ArrowRight size={16}/>
          </button>
      </div>
    </div>
  );
}
