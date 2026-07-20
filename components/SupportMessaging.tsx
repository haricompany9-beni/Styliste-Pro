
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { SupportTicket, SupportReply } from '../types';
import { 
  Send, Plus, Search, MessageCircle, Headphones, 
  X, Loader2, ChevronLeft, HeadphonesIcon, MoreVertical, 
  CheckCheck, Sparkles, Clock, Calendar, Paperclip, FileText, Download,
  Image as ImageIcon, AlertCircle, Reply, Smile, Heart, ThumbsUp, User
} from 'lucide-react';

interface SupportMessagingProps {
  ownerId: string | undefined;
  currentUserId?: string | undefined; 
  onNotificationRefresh?: () => void;
  persistedTicketId?: string | null;
  onTicketChange?: (id: string | null) => void;
}

const EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥', '👏', '🙌', '✨', '👗', '🧵', '✂️', '✅'];

const AVATAR_COLORS = [
    'bg-blue-500', 'bg-pink-500', 'bg-purple-500', 
    'bg-indigo-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500'
];

export default function SupportMessaging({ ownerId, currentUserId, onNotificationRefresh, persistedTicketId, onTicketChange }: SupportMessagingProps) {
    const [view, setView] = useState<'list' | 'chat'>(persistedTicketId ? 'chat' : 'list');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
    const [replies, setReplies] = useState<SupportReply[]>([]);
    
    const [isAddingTicket, setIsAddingTicket] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState('');
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [attachedFile, setAttachedFile] = useState<{name: string, data: string, type: string} | null>(null);
    const [quotedReply, setQuotedReply] = useState<SupportReply | null>(null);
    const [showMainEmojiPicker, setShowMainEmojiPicker] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (ownerId) fetchTickets();
    }, [ownerId]);

    useEffect(() => {
        if (persistedTicketId && tickets.length > 0) {
            const found = tickets.find(t => t.id === persistedTicketId);
            if (found) {
                setActiveTicket(found);
                fetchReplies(found.id);
                markAsRead(found.id);
                if (window.innerWidth < 1024) setView('chat');
            }
        }
    }, [persistedTicketId, tickets]);

    useEffect(() => {
        if (!ownerId) return;
        const interval = setInterval(() => {
            if (navigator.onLine) {
                if (activeTicket) {
                    fetchReplies(activeTicket.id, false);
                    markAsRead(activeTicket.id); 
                }
                fetchTickets(false);
            }
        }, 5000); 
        return () => clearInterval(interval);
    }, [activeTicket, ownerId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [replies]);

    const fetchTickets = async (showLoading = true) => {
        if (!ownerId || !navigator.onLine) return;
        if (showLoading) setLoadingTickets(true);
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .select('*, support_replies(id, is_admin, read_at)')
                .eq('user_id', ownerId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            if (data) {
                const enriched = data.map(t => ({
                    ...t,
                    unread_count: (t.support_replies as any[] || []).filter(r => r.is_admin && !r.read_at).length
                }));
                setTickets(enriched);
            }
        } catch (e: any) {
            const { data: simpleData } = await supabase.from('support_messages').select('*').eq('user_id', ownerId).order('created_at', { ascending: false });
            if (simpleData) setTickets(simpleData);
        } finally {
            if (showLoading) setLoadingTickets(false);
        }
    };

    const fetchReplies = async (ticketId: string, showLoading = true) => {
        if (!navigator.onLine) return;
        try {
            const { data, error } = await supabase
                .from('support_replies')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            if (data) setReplies(data);
        } catch (e: any) {}
    };

    const handleSelectTicket = (ticket: SupportTicket | null) => {
        setActiveTicket(ticket);
        setQuotedReply(null);
        setShowMainEmojiPicker(false);
        if (onTicketChange) onTicketChange(ticket?.id || null);
        if (ticket) {
            setReplies([]);
            fetchReplies(ticket.id);
            markAsRead(ticket.id);
            if (window.innerWidth < 1024) setView('chat');
        } else {
            setView('list');
        }
    };

    const markAsRead = async (ticketId: string) => {
        if (!navigator.onLine) return;
        try {
            const { count } = await supabase.from('support_replies').select('id', { count: 'exact', head: true }).eq('ticket_id', ticketId).eq('is_admin', true).is('read_at', null);
            if (count && count > 0) {
                await supabase.from('support_replies').update({ read_at: new Date().toISOString() }).eq('ticket_id', ticketId).eq('is_admin', true).is('read_at', null);
                if (onNotificationRefresh) onNotificationRefresh();
            }
        } catch (e) {}
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setAttachedFile({ 
                name: file.name, 
                data: reader.result as string,
                type: file.type
            });
        };
        reader.readAsDataURL(file);
    };

    const addEmoji = (emoji: string) => {
        setReplyText(prev => prev + emoji);
        textareaRef.current?.focus();
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = replyText.trim();
        const file = attachedFile;
        if (!activeTicket || (!text && !file) || !currentUserId || sending) return;
        
        setSending(true);
        setShowMainEmojiPicker(false);
        try {
            const payload: any = {
                ticket_id: activeTicket.id,
                sender_id: currentUserId,
                message: text,
                is_admin: false,
                file_data: file?.data || null,
                file_name: file?.name || null
            };

            if (quotedReply && quotedReply.id !== 'initial') {
                payload.parent_id = quotedReply.id;
            } else if (quotedReply && quotedReply.id === 'initial') {
                payload.message = `> ${activeTicket.message.substring(0, 50)}...\n\n${text}`;
            }

            const { data, error } = await supabase.from('support_replies').insert([payload]).select().single();
            if (error) throw error;
            if (data) {
                setReplies(prev => [...prev, data]);
                setReplyText('');
                setAttachedFile(null);
                setQuotedReply(null);
                if (textareaRef.current) textareaRef.current.style.height = 'inherit';
            }
        } catch (e: any) {
            alert("Erreur d'envoi");
        } finally {
            setSending(false);
        }
    };

    const handleReaction = async (replyId: string, emoji: string) => {
        if (!navigator.onLine) return;
        try {
            const reply = replies.find(r => r.id === replyId);
            if (!reply) return;
            const currentReactions = { ...(reply.reactions || {}) };
            if (currentReactions[emoji]) delete currentReactions[emoji];
            else currentReactions[emoji] = currentUserId || 'system';
            setReplies(prev => prev.map(r => r.id === replyId ? { ...r, reactions: currentReactions } : r));
            await supabase.from('support_replies').update({ reactions: currentReactions }).eq('id', replyId);
        } catch (err) {}
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ownerId || !currentUserId || !newSubject.trim() || !newMessage.trim() || sending) return;
        setSending(true);
        try {
            const { data, error } = await supabase.from('support_messages').insert([{ user_id: ownerId, subject: newSubject.trim(), message: newMessage.trim(), status: 'open' }]).select().single();
            if (error) throw error;
            setNewSubject('');
            setNewMessage('');
            setIsAddingTicket(false);
            await fetchTickets();
            if (data) handleSelectTicket(data);
        } catch (e: any) {
            alert("Erreur");
        } finally {
            setSending(false);
        }
    };

    const filteredTickets = tickets.filter(t => 
        (t.subject || '').toLowerCase().includes(search.toLowerCase()) || 
        (t.message || '').toLowerCase().includes(search.toLowerCase())
    );

    const getAvatarColor = (id: string) => {
        const charCode = id.charCodeAt(0) || 0;
        return AVATAR_COLORS[charCode % AVATAR_COLORS.length];
    };

    return (
        <div className="flex h-full bg-white overflow-hidden font-sans">
            {/* Liste des conversations - Style Messenger/WhatsApp */}
            <div className={`w-full lg:w-[360px] flex flex-col border-r border-slate-100 transition-all ${view === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-5 bg-white sticky top-0 z-10">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Support</h2>
                        <button onClick={() => setIsAddingTicket(true)} className="p-2.5 bg-slate-100 text-slate-900 rounded-full hover:bg-pink-100 hover:text-pink-600 transition-all active:scale-90">
                            <Plus size={20}/>
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input type="text" placeholder="Rechercher..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-full text-sm outline-none transition-all focus:bg-slate-100" value={search} onChange={e => setSearch(e.target.value)}/>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar px-2">
                    {loadingTickets ? (
                        <div className="flex flex-col items-center justify-center p-20 text-slate-300"><Loader2 className="animate-spin" size={24}/></div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200"><MessageCircle size={32}/></div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Aucun ticket</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredTickets.map(ticket => {
                                const isActive = activeTicket?.id === ticket.id;
                                const unread = ticket.unread_count || 0;
                                return (
                                    <div 
                                        key={ticket.id} 
                                        onClick={() => handleSelectTicket(ticket)} 
                                        className={`flex items-center gap-3 p-3 cursor-pointer transition-all rounded-2xl ${isActive ? 'bg-pink-50/50' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-white font-black text-lg ${getAvatarColor(ticket.id)} shadow-inner`}>
                                            {ticket.subject.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h4 className={`text-sm truncate ${unread > 0 ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{ticket.subject}</h4>
                                                <span className={`text-[10px] whitespace-nowrap ${unread > 0 ? 'text-pink-600 font-bold' : 'text-slate-400'}`}>
                                                    {new Date(ticket.created_at).toLocaleDateString([], {day:'2-digit', month:'2-digit'})}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center gap-2">
                                                <p className={`text-xs truncate flex-1 ${unread > 0 ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>{ticket.message}</p>
                                                {unread > 0 && <div className="w-2.5 h-2.5 bg-pink-600 rounded-full shrink-0 shadow-lg shadow-pink-600/30"></div>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Zone de Chat - Largeur contrôlée sur PC */}
            <div className={`flex-1 flex flex-col bg-white relative transition-all ${view === 'list' ? 'hidden lg:flex' : 'flex'}`}>
                {activeTicket ? (
                    <>
                        {/* Header Chat */}
                        <div className="h-16 md:h-20 px-6 border-b border-slate-100 bg-white/95 backdrop-blur-md flex items-center justify-between z-20 sticky top-0">
                            <div className="flex items-center gap-3">
                                <button onClick={() => handleSelectTicket(null)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-all"><ChevronLeft size={24}/></button>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm ${getAvatarColor(activeTicket.id)}`}>
                                    {activeTicket.subject.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm md:text-base leading-tight line-clamp-1">{activeTicket.subject}</h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Support en ligne
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => alert("Ticket marqué résolu")} className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase transition-all">
                                    Marquer résolu
                                </button>
                                <button onClick={() => handleSelectTicket(null)} className="hidden lg:block p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                            </div>
                        </div>

                        {/* Zone des messages centrée ergonomique */}
                        <div className="flex-1 overflow-y-auto bg-[#F8F9FA] no-scrollbar">
                            <div className="max-w-4xl mx-auto w-full p-4 md:p-8 space-y-4">
                                <div className="flex justify-center mb-8">
                                    <span className="px-4 py-1.5 bg-white/80 text-[10px] font-black text-slate-400 rounded-full shadow-sm uppercase tracking-[0.2em] backdrop-blur-sm border border-slate-100">Ouvert le {new Date(activeTicket.created_at).toLocaleDateString()}</span>
                                </div>
                                
                                <MessageBubble message={activeTicket.message} createdAt={activeTicket.created_at} isAdmin={true} isInitial={true} onReply={() => setQuotedReply({ id: 'initial', message: activeTicket.message, isAdmin: true } as any)} />
                                
                                {replies.map((reply) => (
                                    <MessageBubble 
                                        key={reply.id} 
                                        message={reply.message} 
                                        createdAt={reply.created_at} 
                                        isAdmin={reply.is_admin} 
                                        readAt={reply.read_at}
                                        fileData={reply.file_data}
                                        fileName={reply.file_name}
                                        reactions={reply.reactions}
                                        onReply={() => setQuotedReply(reply)}
                                        onReaction={(emoji: string) => handleReaction(reply.id, emoji)}
                                        quotedMessage={reply.parent_id ? (reply.parent_id === 'initial' ? activeTicket.message : replies.find(r => r.id === reply.parent_id)?.message) : undefined}
                                    />
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Barre de saisie centrée ergonomique */}
                        <div className="bg-white border-t border-slate-100 z-20">
                            <div className="max-w-4xl mx-auto p-4 md:p-6 pb-10 md:pb-6 relative">
                                {showMainEmojiPicker && (
                                    <div className="absolute bottom-full left-4 md:left-6 mb-4 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 grid grid-cols-7 gap-3 z-50 animate-fade-in-up">
                                        {EMOJIS.map(e => (
                                            <button key={e} onClick={() => addEmoji(e)} className="text-2xl hover:scale-125 transition-transform p-1.5">{e}</button>
                                        ))}
                                    </div>
                                )}
                                {quotedReply && (
                                    <div className="mb-3 p-3 bg-slate-50 border-l-4 border-pink-500 rounded-xl flex items-center justify-between animate-fade-in-up">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="text-[10px] font-bold text-pink-600 uppercase mb-1">{quotedReply.is_admin ? 'Support' : 'Moi'}</div>
                                            <div className="text-xs text-slate-500 line-clamp-1 italic">{quotedReply.message}</div>
                                        </div>
                                        <button onClick={() => setQuotedReply(null)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"><X size={16}/></button>
                                    </div>
                                )}
                                {attachedFile && (
                                    <div className="mb-3 p-3 bg-pink-50 rounded-xl flex items-center justify-between animate-fade-in border border-pink-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white rounded-lg border border-pink-200 overflow-hidden flex items-center justify-center shrink-0">
                                                {attachedFile.type.startsWith('image/') ? <img src={attachedFile.data} className="w-full h-full object-cover" alt="Preview" /> : <FileText size={20} className="text-pink-600"/>}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[11px] font-black text-pink-900 truncate block max-w-[150px] md:max-w-[300px]">{attachedFile.name}</span>
                                                <span className="text-[9px] text-pink-500 uppercase font-bold">Fichier prêt</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setAttachedFile(null)} className="p-2 text-pink-600 hover:bg-pink-100 rounded-full transition-colors"><X size={18}/></button>
                                    </div>
                                )}
                                <form onSubmit={handleSendReply} className="flex items-end gap-3">
                                    <div className="flex-1 bg-slate-100 rounded-[1.5rem] flex items-end p-1.5 min-h-[48px]">
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-pink-600 transition-colors shrink-0 active:scale-90"><Paperclip size={20}/></button>
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".jpg,.jpeg,.png,.pdf" />
                                        <textarea 
                                            ref={textareaRef}
                                            className="flex-1 bg-transparent border-none px-2 py-2 text-sm md:text-base outline-none resize-none font-medium max-h-32 text-slate-700" 
                                            placeholder="Écrire un message..." 
                                            rows={1}
                                            value={replyText} 
                                            onChange={e => {
                                                setReplyText(e.target.value);
                                                e.target.style.height = 'inherit';
                                                e.target.style.height = `${e.target.scrollHeight}px`;
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 1024) {
                                                    e.preventDefault();
                                                    handleSendReply(e as any);
                                                }
                                            } }
                                            disabled={sending}
                                        />
                                        <button type="button" onClick={() => setShowMainEmojiPicker(!showMainEmojiPicker)} className={`p-2.5 transition-colors shrink-0 active:scale-90 ${showMainEmojiPicker ? 'text-pink-600' : 'text-slate-400 hover:text-pink-600'}`}><Smile size={20}/></button>
                                    </div>
                                    <button disabled={(!replyText.trim() && !attachedFile) || sending} className="w-12 h-12 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-all shadow-xl shadow-pink-600/20 active:scale-90 disabled:opacity-50 flex items-center justify-center shrink-0">
                                        {sending ? <Loader2 className="animate-spin" size={22}/> : <Send size={22}/>}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#F8F9FA]">
                        <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-8 text-pink-600 border border-slate-50"><HeadphonesIcon size={40}/></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Besoin d'aide ?</h3>
                        <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm font-medium leading-relaxed">Nos experts sont là pour vous aider à maîtriser StylistePro.</p>
                        <button onClick={() => setIsAddingTicket(true)} className="px-10 py-5 bg-pink-600 text-white rounded-full font-black text-sm md:text-base hover:bg-pink-700 transition-all shadow-2xl shadow-pink-600/30 flex items-center gap-4 mx-auto active:scale-95">
                            <Plus size={24}/> Nouveau ticket
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de création */}
            {isAddingTicket && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-black text-xl text-slate-900 flex items-center gap-3">Ouvrir un ticket</h3>
                            <button onClick={() => setIsAddingTicket(false)} className="p-2.5 hover:bg-slate-200 rounded-full transition-colors active:scale-90"><X size={24}/></button>
                        </div>
                        <form onSubmit={handleCreateTicket} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Sujet</label>
                                <input required className="w-full p-4 bg-slate-50 border-none rounded-2xl text-base outline-none font-bold text-slate-800" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Ex: Erreur d'enregistrement"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Votre message</label>
                                <textarea required className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm h-32 resize-none outline-none font-medium text-slate-700" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Détaillez votre demande..."/>
                            </div>
                            <button disabled={sending || !newSubject.trim() || !newMessage.trim()} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/30 active:scale-95">
                                {sending ? 'Envoi...' : 'Créer le ticket'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function MessageBubble({ 
    message, createdAt, isAdmin, readAt, fileData, fileName, reactions, quotedMessage, onReply, onReaction, isInitial = false 
}: any) {
    const [dragX, setDragX] = useState(0);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const touchStartX = useRef(0);
    const bubbleRef = useRef<HTMLDivElement>(null);
    const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
    const handleTouchMove = (e: React.TouchEvent) => {
        const delta = e.targetTouches[0].clientX - touchStartX.current;
        if (delta > 0 && delta < 100) setDragX(delta);
    };
    const handleTouchEnd = () => {
        if (dragX > 70) onReply();
        setDragX(0);
    };
    const hasReactions = reactions && Object.keys(reactions).length > 0;

    return (
        <div 
            className={`flex w-full mb-1 group transition-all duration-300 ${isAdmin ? 'justify-start' : 'justify-end'}`}
            style={{ transform: `translateX(${dragX}px)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div className="absolute left-[-40px] top-1/2 -translate-y-1/2 text-pink-500 opacity-0 transition-opacity flex items-center justify-center" style={{ opacity: dragX / 70 }}><Reply size={20} /></div>
            <div className={`relative max-w-[88%] md:max-w-[70%] group ${isAdmin ? 'items-start' : 'items-end'}`}>
                <div className={`absolute top-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isAdmin ? 'left-full ml-1' : 'right-full mr-1'}`}>
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1 text-slate-300 hover:text-slate-500 hover:bg-white rounded-full transition-all shadow-sm"><Smile size={18}/></button>
                </div>
                {showEmojiPicker && (
                    <div className={`absolute top-[-45px] bg-white border border-slate-100 rounded-full shadow-2xl p-1.5 flex items-center gap-2 z-50 animate-fade-in-up ${isAdmin ? 'left-0' : 'right-0'}`}>
                        {EMOJIS.slice(0, 6).map(e => (
                            <button key={e} type="button" onClick={(ev) => { ev.stopPropagation(); onReaction(e); setShowEmojiPicker(false); }} className="text-lg hover:scale-150 transition-transform active:scale-125 p-1">{e}</button>
                        ))}
                    </div>
                )}
                <div 
                    ref={bubbleRef}
                    onContextMenu={(e) => { e.preventDefault(); setShowEmojiPicker(!showEmojiPicker); }}
                    className={`relative p-3 md:p-4 rounded-2xl shadow-sm text-sm md:text-[15px] leading-relaxed overflow-visible transition-all ${isAdmin ? 'bg-white text-slate-800 rounded-tl-none border border-slate-200' : 'bg-pink-600 text-white rounded-tr-none shadow-lg shadow-pink-600/10'}`}
                >
                    {quotedMessage && <div className={`mb-2 p-2 rounded-lg text-[11px] border-l-4 leading-snug italic truncate ${isAdmin ? 'bg-slate-50 border-slate-300 text-slate-500' : 'bg-white/10 border-white/30 text-white/60'}`}>{quotedMessage}</div>}
                    {isInitial && <div className="text-[10px] font-black uppercase text-pink-500 mb-2 tracking-widest">Ma demande</div>}
                    {message && <p className="whitespace-pre-wrap font-medium">{message}</p>}
                    {fileData && (
                        <div className={`mt-3 p-3 rounded-xl flex items-center gap-3 border ${isAdmin ? 'bg-slate-50 border-slate-100' : 'bg-white/10 border-white/20'}`}>
                            <div className="p-2 bg-pink-500 rounded-lg text-white"><FileText size={18}/></div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-black truncate">{fileName}</div>
                                <button type="button" onClick={() => { const link = document.createElement('a'); link.href = fileData!; link.download = fileName!; link.click(); }} className="text-[9px] font-black uppercase text-pink-600 mt-1 flex items-center gap-1"><Download size={10}/> Télécharger</button>
                            </div>
                        </div>
                    )}
                    <div className={`flex items-center gap-1.5 mt-2 justify-end opacity-40 text-[9px] font-bold ${isAdmin ? 'text-slate-400' : 'text-white'}`}>
                        {new Date(createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {!isAdmin && (readAt ? <CheckCheck size={12} className="text-white"/> : <CheckCheck size={12}/>)}
                    </div>
                    {hasReactions && (
                        <div className={`absolute bottom-[-14px] flex gap-1 animate-fade-in z-20 ${isAdmin ? 'left-2' : 'right-2'}`}>
                            <div className="bg-white border border-slate-100 rounded-full px-2 py-0.5 shadow-md flex items-center gap-1.5">
                                {Object.keys(reactions).map(e => (<span key={e} className="text-[13px]">{e}</span>))}
                                {Object.keys(reactions).length > 1 && <span className="text-[10px] font-black text-slate-500 ml-0.5">{Object.keys(reactions).length}</span>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
