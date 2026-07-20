
import React, { useState, useRef, useEffect } from 'react';
import { Mic, X, Check, Loader2, Save, Trash2, Send, ChevronUp, Sparkles, WifiOff, Crown, ArrowRight, Lock } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Client, Order } from '../types';

interface VoiceClientAdderProps {
  ownerId: string;
  clients: Client[];
  orders?: Order[];
  onSuccess: () => void;
  subscriptionPlan?: string;
  onRequestUpgrade?: () => void;
}

type IntentType = 'CREATE_CLIENT' | 'CREATE_ORDER' | 'ADD_PAYMENT' | 'UNKNOWN';

interface AIResponse {
  intent: IntentType;
  confidence: number;
  detected_name?: string;
  client_data?: {
    name: string;
    phone: string;
    measurements: Record<string, string>;
  };
  order_data?: {
    description: string;
    price: number;
    deposit: number;
  };
  payment_data?: {
    amount: number;
  };
}

export default function VoiceClientAdder({ ownerId, clients, orders = [], onSuccess, subscriptionPlan = 'free', onRequestUpgrade }: VoiceClientAdderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const startY = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const isPro = subscriptionPlan === 'pro';

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    if (!isPro) {
      setShowUpgradeModal(true);
      return;
    }
    if (isOffline) {
      alert("L'assistant vocal nécessite une connexion internet.");
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      source.connect(analyserRef.current);

      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setSlideProgress(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 100);

    } catch (err) {
      console.error("Mic error:", err);
      alert("Impossible d'accéder au microphone.");
    }
  };

  const stopAndProcess = () => {
    if (!mediaRecorder.current || !isRecording) return;
    
    mediaRecorder.current.stop();
    mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
    
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    
    setIsRecording(false);
    setIsLocked(false);
    setSlideProgress(0);

    if (recordingTime > 5) {
      setIsProcessing(true);
      processAudioWithGemini();
    } else {
      setRecordingTime(0);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setIsLocked(false);
    setRecordingTime(0);
    setSlideProgress(0);
  };

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isProcessing || aiResult) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startY.current = clientY;
    startRecording();
  };

  const handleInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isRecording || isLocked) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = startY.current - clientY;
    const progress = Math.min(Math.max(deltaY / 80, 0), 1);
    setSlideProgress(progress);
    
    if (deltaY > 80) {
      setIsLocked(true);
      setSlideProgress(1);
    }
  };

  const handleInteractionEnd = () => {
    if (!isRecording || isLocked) return;
    stopAndProcess();
  };

  const processAudioWithGemini = async () => {
    try {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(audioBlob);
      });
      const base64Audio = await base64Promise;

      const existingClients = clients.map(c => c.name).join(', ');

      const res = await fetch("/api/gemini/process-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Audio, existingClients })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur serveur lors du traitement de l'audio.");
      }

      const { result: rawText } = await res.json();
      
      // Nettoyage robuste de la réponse pour extraire le JSON
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : rawText;
      
      const result = JSON.parse(cleanJson);
      
      if (result.intent === 'UNKNOWN' || result.confidence < 0.4) {
        alert("Désolé, je n'ai pas bien compris. Re-essayez : 'Nouveau client Marie, épaule 40'.");
        setIsProcessing(false);
        return;
      }
      setAiResult(result);
    } catch (error: any) {
      console.error("AI Error:", error);
      alert("Erreur de compréhension : " + (error.message || "Assurez-vous de parler distinctement."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalSave = async (finalData: any) => {
    try {
      if (aiResult?.intent === 'CREATE_CLIENT') {
        await supabase.from('clients').insert([{ user_id: ownerId, name: finalData.name, phone: finalData.phone || '', measurements: finalData.measurements || {} }]);
      } 
      else if (aiResult?.intent === 'CREATE_ORDER') {
        await supabase.from('orders').insert([{ user_id: ownerId, client_id: finalData.client_id, description: finalData.description, price: finalData.price, total_paid: finalData.total_paid, status: finalData.total_paid > 0 ? 'In Progress' : 'Pending', payments: finalData.total_paid > 0 ? [{ amount: finalData.total_paid, date: new Date().toISOString() }] : [] }]);
      } 
      else if (aiResult?.intent === 'ADD_PAYMENT') {
        const { data: ord } = await supabase.from('orders').select('*').eq('id', finalData.order_id).single();
        if (ord) {
          const newTotal = (ord.total_paid || 0) + finalData.amount;
          const newPayments = [...(ord.payments || []), { amount: finalData.amount, date: new Date().toISOString() }];
          await supabase.from('orders').update({ total_paid: newTotal, payments: newPayments, status: 'In Progress' }).eq('id', ord.id);
        }
      }
      onSuccess();
      setAiResult(null);
    } catch (e) { alert("Erreur d'enregistrement."); }
  };

  return (
    <>
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-pink-100 text-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"><Crown size={40} /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Stylé IA est PRO.</h3>
            <p className="text-slate-500 font-medium text-sm mb-8">Cette fonction est réservée aux abonnés PRO.</p>
            <button onClick={() => { setShowUpgradeModal(false); onRequestUpgrade?.(); }} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-3">Voir les offres PRO <ArrowRight size={20}/></button>
            <button onClick={() => setShowUpgradeModal(false)} className="mt-4 text-xs font-bold text-slate-400 uppercase">Plus tard</button>
          </div>
        </div>
      )}

      {aiResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-3"><Sparkles size={20} className="text-pink-500"/> Analyse IA terminée</h3>
              <button onClick={() => setAiResult(null)}><X /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
               <SmartConfirmationForm aiResult={aiResult} clients={clients} orders={orders} onCancel={() => setAiResult(null)} onConfirm={handleFinalSave} />
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-24 md:bottom-8 right-6 z-[90] flex flex-col items-end gap-4">
        {isRecording && (
          <div className="flex flex-col items-center gap-4 mb-4">
            {!isLocked && (
              <div className="flex flex-col items-center animate-bounce">
                <ChevronUp className="text-slate-400" />
                <Lock size={16} className="text-slate-400" />
              </div>
            )}
            <div className="bg-slate-900 rounded-3xl p-4 shadow-2xl flex items-center gap-4 border border-slate-800 animate-fade-in-up">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-white font-mono font-bold text-sm">{(recordingTime/10).toFixed(1)}s</span>
              </div>
              <div className="h-8 w-32 flex items-center justify-center gap-1">
                <AudioOscillator analyser={analyserRef.current} />
              </div>
              {isLocked && (
                <button onClick={cancelRecording} className="p-2 bg-slate-800 text-red-400 rounded-full hover:bg-slate-700">
                  <Trash2 size={18}/>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="relative">
          {isProcessing && (
            <div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin scale-110"></div>
          )}
          
          <button
            onMouseDown={handleInteractionStart}
            onMouseMove={handleInteractionMove}
            onMouseUp={handleInteractionEnd}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchMove={handleInteractionMove}
            onTouchEnd={handleInteractionEnd}
            onClick={() => { if(isLocked) stopAndProcess(); if(!isRecording && !isProcessing) startRecording(); }}
            className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 relative border-4 border-white
              ${isRecording ? 'bg-pink-600 scale-125' : isProcessing ? 'bg-slate-800' : 'bg-slate-900 hover:scale-110'}
              ${!isPro ? 'opacity-40 grayscale' : ''}
            `}
          >
            {isProcessing ? <Loader2 className="animate-spin text-white" /> : 
             isLocked ? <Send size={28} className="text-white ml-1" /> : 
             <Mic size={28} className="text-white" />}
            
            {!isLocked && isRecording && (
               <div className="absolute -top-12 right-0 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center border border-slate-100" style={{ opacity: slideProgress }}>
                 <Lock size={18} className="text-pink-600" />
               </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

function AudioOscillator({ analyser }: { analyser: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!analyser || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / 8);
      let x = 0;
      for (let i = 0; i < 8; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = '#db2777';
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    };
    draw();
  }, [analyser]);
  return <canvas ref={canvasRef} width={120} height={32} />;
}

function SmartConfirmationForm({ aiResult, clients, orders, onCancel, onConfirm }: any) {
  const [formData, setFormData] = useState<any>({});
  const [selectedClientId, setSelectedClientId] = useState('');

  useEffect(() => {
    if (aiResult.intent === 'CREATE_CLIENT') {
      setFormData(aiResult.client_data);
    } else if (aiResult.intent === 'CREATE_ORDER') {
      const match = clients.find((c: any) => c.name.toLowerCase().includes(aiResult.detected_name?.toLowerCase()));
      if (match) setSelectedClientId(match.id);
      setFormData({ ...aiResult.order_data, client_id: match?.id || '' });
    } else if (aiResult.intent === 'ADD_PAYMENT') {
      const match = clients.find((c: any) => c.name.toLowerCase().includes(aiResult.detected_name?.toLowerCase()));
      if (match) {
        setSelectedClientId(match.id);
        const order = orders.find((o: any) => o.client_id === match.id && o.status !== 'Delivered');
        setFormData({ amount: aiResult.payment_data?.amount, order_id: order?.id || '' });
      } else {
        setFormData({ amount: aiResult.payment_data?.amount });
      }
    }
  }, [aiResult, clients, orders]);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100 flex items-start gap-4">
        <Sparkles className="text-pink-600 shrink-0 mt-1" size={20}/>
        <div>
          <p className="text-pink-900 font-bold text-sm">Action détectée : {aiResult.intent.replace('_', ' ')}</p>
        </div>
      </div>
      <div className="space-y-4">
        {aiResult.intent === 'CREATE_CLIENT' && (
          <>
            <InputGroup label="Nom" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
            <InputGroup label="Téléphone" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
          </>
        )}
        {aiResult.intent === 'CREATE_ORDER' && (
          <>
            <select className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none mb-4" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                <option value="">Lier au client...</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <InputGroup label="Description" value={formData.description} onChange={v => setFormData({...formData, description: v})} isTextArea />
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Prix" value={formData.price} type="number" onChange={v => setFormData({...formData, price: v})} />
              <InputGroup label="Acompte" value={formData.deposit} type="number" onChange={v => setFormData({...formData, deposit: v})} />
            </div>
          </>
        )}
        {aiResult.intent === 'ADD_PAYMENT' && (
          <>
            <InputGroup label="Montant" value={formData.amount} type="number" onChange={v => setFormData({...formData, amount: parseInt(v)})} />
            <select className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none" value={formData.order_id} onChange={e => setFormData({...formData, order_id: e.target.value})}>
                <option value="">Choisir commande...</option>
                {orders.filter((o: any) => o.client_id === selectedClientId).map((o: any) => (
                  <option key={o.id} value={o.id}>{o.description} ({o.price - o.total_paid} F restant)</option>
                ))}
            </select>
          </>
        )}
      </div>
      <div className="flex gap-3 pt-4">
        <button onClick={onCancel} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl">Annuler</button>
        <button onClick={() => onConfirm(formData)} className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-2xl">Valider</button>
      </div>
    </div>
  );
}

function InputGroup({ label, value, onChange, type = "text", isTextArea = false }: any) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">{label}</label>
      {isTextArea ? (
        <textarea className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none h-24" value={value} onChange={e => onChange(e.target.value)} />
      ) : (
        <input type={type} className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none" value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}
