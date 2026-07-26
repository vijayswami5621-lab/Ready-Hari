import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Send, Trash2, Clock, Sparkles, Volume2, Copy, Menu, Plus, X, 
  MessageSquare, ChevronRight, Search, Edit2, Mic, MicOff, 
  Share2, ThumbsUp, ThumbsDown, RotateCcw, Pin, PinOff, VolumeX, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import { SEO } from '../../components/SEO';
import { db } from '../../firebase/config';
import { collection, doc, onSnapshot, query, orderBy, setDoc, addDoc, serverTimestamp, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: any;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: any;
  updatedAt: any;
  lastMessage: string;
  pinned?: boolean;
}

export const AIGuruScreen = () => {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'like' | 'dislike'>>({});
  const [isListening, setIsListening] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition for Voice Input
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'hi-IN'; // Recognizes both Hindi and English mixed very well

      rec.onstart = () => setIsListening(true);
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };
      rec.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser/device.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Load conversations
  useEffect(() => {
    if (!user) return;
    
    const conversationsRef = collection(db, 'users', user.uid, 'aiGuruHistory');
    const q = query(conversationsRef, orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];
      setConversations(convos);
    }, (err) => {
      console.warn("AI Guru load conversations snapshot failed:", err);
    });

    return () => unsubscribe();
  }, [user]);

  // Load messages for current conversation
  useEffect(() => {
    if (!user || !currentConversationId) {
      // Default welcome message for new chat
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: 'राधे राधे 🙏 मैं हरि पाठशाला का AI गुरु हूँ। मैं भगवद्गीता, रामचरितमानस, वेद, उपनिषद, और अन्य आध्यात्मिक विषयों पर आपका मार्गदर्शन करने के लिए यहाँ हूँ। आप मुझसे क्या पूछना चाहते हैं?',
        timestamp: new Date()
      }]);
      return;
    }

    const messagesRef = collection(db, 'users', user.uid, 'aiGuruHistory', currentConversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    }, (err) => {
      console.warn("AI Guru load messages snapshot failed:", err);
    });

    return () => unsubscribe();
  }, [user, currentConversationId]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle send message
  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || !user) return;

    if (!customText) setInput('');
    setIsTyping(true);

    // Stop speech synthesis if speaking when user sends a new message
    if (speakingId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }

    try {
      let convId = currentConversationId;
      
      // Create new conversation if needed
      if (!convId) {
        const convRef = doc(collection(db, 'users', user.uid, 'aiGuruHistory'));
        convId = convRef.id;
        setCurrentConversationId(convId);
        
        await setDoc(convRef, {
          title: textToSend.substring(0, 35) + (textToSend.length > 35 ? '...' : ''),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: textToSend
        });
      }

      // 1. Save user message to Firestore
      const messagesRef = collection(db, 'users', user.uid, 'aiGuruHistory', convId, 'messages');
      await addDoc(messagesRef, {
        role: 'user',
        text: textToSend,
        timestamp: serverTimestamp()
      });

      // Update conversation lastMessage & updatedAt
      await updateDoc(doc(db, 'users', user.uid, 'aiGuruHistory', convId), {
        lastMessage: textToSend,
        updatedAt: serverTimestamp()
      });

      // 2. Fetch AI response
      const historyForAI = messages
        .filter(m => m.id !== 'welcome')
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        }));

      const response = await axios.post('/api/chat', { 
        message: textToSend,
        history: historyForAI 
      });

      const aiText = response.data.reply;

      // 3. Save AI message to Firestore
      await addDoc(messagesRef, {
        role: 'model',
        text: aiText,
        timestamp: serverTimestamp()
      });

      // Update conversation again
      await updateDoc(doc(db, 'users', user.uid, 'aiGuruHistory', convId), {
        lastMessage: aiText,
        updatedAt: serverTimestamp()
      });

    } catch (error: any) {
      console.error("Chat error:", error);
      let errorText = '🙏 क्षमा करें, कुछ तकनीकी समस्या आ गई है। कृपया पुनः प्रयास करें।';
      if (error.response?.data?.error) {
        errorText = `🙏 क्षमा करें, कुछ तकनीकी समस्या आ गई है।\n\n**त्रुटि विवरण:** ${error.response.data.error}`;
      } else if (error.message) {
        errorText = `🙏 क्षमा करें, नेटवर्क या तकनीकी समस्या आ गई है।\n\n**विवरण:** ${error.message}`;
      }
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: errorText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setIsDrawerOpen(false);
    if (speakingId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }
  };

  const selectConversation = (id: string) => {
    setCurrentConversationId(id);
    setIsDrawerOpen(false);
    if (speakingId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }
  };

  const renameConversation = async (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    if (!user) return;
    const newTitle = prompt("Enter new name for this chat:", currentTitle);
    if (newTitle && newTitle.trim() !== "" && newTitle !== currentTitle) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'aiGuruHistory', id), {
          title: newTitle.trim(),
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error renaming conversation", error);
      }
    }
  };

  const deleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    if (confirm("Are you sure you want to delete this chat?")) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'aiGuruHistory', id));
        if (currentConversationId === id) {
          setCurrentConversationId(null);
        }
      } catch (error) {
        console.error("Error deleting conversation", error);
      }
    }
  };

  // Pin / Unpin Conversation
  const togglePinConversation = async (e: React.MouseEvent, id: string, currentlyPinned: boolean) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'aiGuruHistory', id), {
        pinned: !currentlyPinned
      });
    } catch (error) {
      console.error("Error toggling pin status:", error);
    }
  };

  // Copy Message to Clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Speak response out loud using Web Speech API
  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Cancel any current speech

    // Clean markdown characters for smoother speech synthesis
    const cleanText = text
      .replace(/[*#_`~|]/g, '')
      .replace(/॥/g, '।')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const hasHindi = /[\u0900-\u097F]/.test(cleanText);
    utterance.lang = hasHindi ? 'hi-IN' : 'en-US';

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Share Response
  const handleShare = async (text: string) => {
    const shareText = `${text}\n\n— AI Guru, Hari Pathshala`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Guru - Hari Pathshala',
          text: shareText,
        });
      } catch (err) {
        console.warn("Share failed, falling back to clipboard copy", err);
        navigator.clipboard.writeText(shareText);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  // Regenerate Response
  const handleRegenerate = async (msgId: string) => {
    if (!user || !currentConversationId) return;

    // Find the user message immediately preceding this AI message
    const msgIndex = messages.findIndex(m => m.id === msgId);
    if (msgIndex <= 0) return;

    let userMsg: Message | null = null;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMsg = messages[i];
        break;
      }
    }

    if (!userMsg) return;
    const userText = userMsg.text;

    setIsTyping(true);
    if (speakingId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }

    try {
      // Delete the old AI response from Firestore to replace it
      await deleteDoc(doc(db, 'users', user.uid, 'aiGuruHistory', currentConversationId, 'messages', msgId));

      // Fetch new AI response
      const historyForAI = messages
        .filter(m => m.id !== 'welcome' && m.id !== msgId)
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        }));

      const response = await axios.post('/api/chat', { 
        message: userText,
        history: historyForAI 
      });

      const aiText = response.data.reply;

      // Save new AI message
      const messagesRef = collection(db, 'users', user.uid, 'aiGuruHistory', currentConversationId, 'messages');
      await addDoc(messagesRef, {
        role: 'model',
        text: aiText,
        timestamp: serverTimestamp()
      });

      // Update conversation
      await updateDoc(doc(db, 'users', user.uid, 'aiGuruHistory', currentConversationId), {
        lastMessage: aiText,
        updatedAt: serverTimestamp()
      });

    } catch (error: any) {
      console.error("Regeneration error:", error);
      let errorText = '🙏 क्षमा करें, कुछ तकनीकी समस्या आ गई है। कृपया पुनः प्रयास करें।';
      if (error.response?.data?.error) {
        errorText = `🙏 क्षमा करें, कुछ तकनीकी समस्या आ गई है।\n\n**त्रुटि विवरण:** ${error.response.data.error}`;
      } else if (error.message) {
        errorText = `🙏 क्षमा करें, नेटवर्क या तकनीकी समस्या आ गई है।\n\n**विवरण:** ${error.message}`;
      }
      if (currentConversationId) {
        const messagesRef = collection(db, 'users', user.uid, 'aiGuruHistory', currentConversationId, 'messages');
        await addDoc(messagesRef, {
          role: 'model',
          text: errorText,
          timestamp: serverTimestamp()
        });
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleFeedback = (msgId: string, type: 'like' | 'dislike') => {
    setFeedback(prev => ({
      ...prev,
      [msgId]: prev[msgId] === type ? undefined : type as any
    }));
  };

  // Sort: Pinned first, then by date updatedAt desc
  const sortedConversations = [...conversations].sort((a, b) => {
    const aPinned = a.pinned || false;
    const bPinned = b.pinned || false;
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    
    const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
    const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
    return bTime - aTime;
  });

  const filteredConversations = sortedConversations.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suggestedQuestions = [
    "भगवद्गीता का सार क्या है?",
    "रामचरितमानस में भक्ति का महत्व?",
    "मन को शांत कैसे करें?",
    "आज का आध्यात्मिक संदेश",
    "श्रीकृष्ण के उपदेश",
    "हनुमान जी की भक्ति"
  ];

  return (
    <div className="flex flex-col h-full bg-[#FAF6F0] dark:bg-slate-950 transition-colors duration-300 relative font-sans">
      <SEO title="AI Guru | Hari Pathshala" description="Ask your spiritual questions and get answers from our AI Guru." />
      
      {/* HEADER */}
      <header className="px-4 py-3 bg-white/80 dark:bg-slate-900/80 border-b border-orange-100 dark:border-slate-800 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 -ml-2 text-amber-900 dark:text-amber-200 hover:bg-orange-100/60 dark:hover:bg-slate-800 rounded-full transition"
            id="history-drawer-btn"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-yellow-400 rounded-full flex items-center justify-center text-white shadow-md relative p-0.5">
              <div className="w-full h-full rounded-full bg-[#FFF6E9] dark:bg-slate-900 flex items-center justify-center text-orange-600 dark:text-amber-400 font-extrabold border-2 border-white/90">
                ॐ
              </div>
              {/* online pulse dot */}
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-slate-900 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-amber-950 dark:text-amber-100 leading-tight">AI Guru</h1>
              <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold tracking-wide">
                Online
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-1.5">
          <button 
            onClick={startNewChat} 
            className="px-3.5 py-1.5 text-xs font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full transition-all duration-300 shadow-sm flex items-center gap-1"
            title="New Chat"
            id="new-chat-btn"
          >
            <Plus size={14} strokeWidth={2.5} />
            New Chat
          </button>
        </div>
      </header>

      {/* HISTORY DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
              id="drawer-overlay"
            />
            <motion.div 
              initial={{ x: '-100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '-100%' }} 
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col border-r border-orange-100 dark:border-slate-800"
              id="drawer-panel"
            >
              <div className="p-4 border-b border-orange-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-orange-50/40 to-white dark:from-slate-900 dark:to-slate-900">
                <h2 className="font-extrabold text-amber-950 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Clock size={16} className="text-orange-500" /> Conversations
                </h2>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-3">
                <button 
                  onClick={startNewChat}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all duration-300 transform hover:scale-[1.01]"
                >
                  <Plus size={16} strokeWidth={2.5} /> New Conversation
                </button>
              </div>

              <div className="px-3 pb-2">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search spiritual queries..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-orange-50/50 dark:bg-slate-800 border border-orange-100 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition"
                  />
                  <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredConversations.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 mt-12 font-medium">No previous chats found.</p>
                ) : (
                  filteredConversations.map(conv => (
                    <div 
                      key={conv.id} 
                      onClick={() => selectConversation(conv.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 group cursor-pointer border ${currentConversationId === conv.id ? 'bg-[#FFF3E3] dark:bg-slate-800 border-orange-200 dark:border-slate-700 shadow-sm' : 'hover:bg-orange-50/30 dark:hover:bg-slate-800/40 border-transparent'}`}
                    >
                      <MessageSquare size={16} className={`mt-0.5 shrink-0 ${currentConversationId === conv.id ? 'text-orange-500' : 'text-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 justify-between">
                          <p className={`text-xs font-bold truncate ${currentConversationId === conv.id ? 'text-amber-950 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {conv.title || "Spiritual Query"}
                          </p>
                          {conv.pinned && (
                            <Pin size={10} className="text-orange-500 fill-orange-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button 
                          onClick={(e) => togglePinConversation(e, conv.id, conv.pinned || false)}
                          className={`p-1 hover:bg-orange-100 dark:hover:bg-slate-700 rounded-md transition ${conv.pinned ? 'text-orange-500' : 'text-slate-400 hover:text-orange-500'}`}
                          title={conv.pinned ? "Unpin Chat" : "Pin Chat"}
                        >
                          {conv.pinned ? <PinOff size={11} /> : <Pin size={11} />}
                        </button>
                        <button 
                          onClick={(e) => renameConversation(e, conv.id, conv.title || "Spiritual Query")}
                          className="p-1 text-slate-400 hover:text-orange-500 hover:bg-orange-100 dark:hover:bg-slate-700 rounded-md transition"
                          title="Rename"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button 
                          onClick={(e) => deleteConversation(e, conv.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-32 max-w-4xl mx-auto w-full">
        {/* Welcome Hero State */}
        {messages.length <= 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="my-6 text-center space-y-4 px-2"
          >
            {/* Elegant SVG illustration of meditiating Rishi/Guru in front of Sunset Aura */}
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-orange-400/25 blur-3xl rounded-full" />
              <svg className="w-40 h-40 mx-auto text-amber-500 drop-shadow-[0_8px_20px_rgba(249,115,22,0.15)] relative z-10" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="50" fill="url(#sunGlow)" opacity="0.9" />
                
                <g opacity="0.35">
                  <line x1="100" y1="20" x2="100" y2="42" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="100" y1="158" x2="100" y2="180" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="20" y1="100" x2="42" y2="100" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="158" y1="100" x2="180" y2="100" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="43" y1="43" x2="59" y2="59" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="141" y1="141" x2="157" y2="157" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="157" y1="43" x2="141" y2="59" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="59" y1="141" x2="43" y2="157" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                </g>
                
                {/* Yogi silhouette */}
                <circle cx="100" cy="74" r="7.5" fill="#78350F" />
                <circle cx="100" cy="86" r="10.5" fill="#92400E" />
                <path d="M94 93 C94 105 106 105 106 93 Z" fill="#E2E8F0" />
                <path d="M78 135 C78 108 122 108 122 135 Z" fill="#D97706" />
                <path d="M65 142 Q100 135 135 142 L128 149 Q100 144 72 149 Z" fill="#92400E" />
                
                <circle cx="100" cy="90" r="28" stroke="#FCD34D" strokeWidth="1" strokeDasharray="3 3" className="animate-[spin_60s_linear_infinite]" />
                <path d="M55 145 C60 155 75 155 80 145 C85 155 105 155 110 145 C115 155 130 155 135 145 C140 155 150 145 145 140 C115 135 75 135 45 140 Z" fill="#FB7185" opacity="0.8" />

                <defs>
                  <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FDE047" />
                    <stop offset="65%" stopColor="#F97316" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-xl font-black text-amber-950 dark:text-white">दिव्य आध्यात्मिक गुरु</h2>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                भगवद्गीता, रामायण, उपनिषद एवं सनातन धर्म ग्रंथों पर आधारित सत्य मार्गदर्शन।
              </p>
            </div>

            {/* Suggested Chip List */}
            <div className="pt-2">
              <h3 className="text-[10px] uppercase tracking-widest text-amber-800/60 dark:text-slate-400 font-extrabold mb-2.5">त्वरित सुझाव</h3>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {suggestedQuestions.map((qText, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSend(qText)}
                    className="px-3.5 py-2 bg-white dark:bg-slate-900 text-xs font-bold text-amber-900 dark:text-amber-200 border border-orange-100 dark:border-slate-800 rounded-full shadow-sm hover:border-orange-300 hover:bg-orange-50/20 dark:hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {qText}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Conversational bubble flow */}
        <div className="space-y-5">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[88%] rounded-2xl px-4 py-3.5 shadow-sm relative group/message transition-all ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-tr from-orange-500 via-orange-500 to-amber-500 text-white rounded-tr-xs' 
                  : 'bg-white dark:bg-slate-900 text-amber-950 dark:text-slate-100 border border-orange-100/80 dark:border-slate-800 rounded-tl-xs shadow-[0_2px_12px_rgba(0,0,0,0.02)]'
              }`}>
                {/* User/AI Identifier header */}
                <div className="flex items-center justify-between mb-1.5 border-b border-black/5 dark:border-white/5 pb-1 gap-6">
                  <span className="text-[10px] font-black uppercase tracking-wider opacity-60 flex items-center gap-1">
                    {msg.role === 'user' ? 'आप' : 'AI गुरु'}
                    {msg.role === 'model' && msg.id !== 'welcome' && (
                      <Sparkles size={10} className="text-orange-500" />
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Timestamp inside header */}
                    <span className="text-[8px] opacity-40 font-mono">
                      {msg.timestamp?.toDate 
                        ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    </span>
                  </div>
                </div>

                {/* Markdown body styled elegantly */}
                <div className={`prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed ${
                  msg.role === 'user' ? 'text-white font-medium prose-p:my-0' : 'text-slate-800 dark:text-slate-100'
                }`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      blockquote: ({ node, ...props }) => (
                        <div className="my-2.5 p-3 bg-amber-50/50 dark:bg-amber-950/20 border-l-4 border-yellow-500 rounded-r-lg text-center font-serif text-amber-900 dark:text-yellow-400 italic">
                          {props.children}
                        </div>
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-sm font-extrabold text-amber-800 dark:text-yellow-400 mt-2.5 mb-1" {...props} />
                      ),
                      h4: ({ node, ...props }) => (
                        <h4 className="text-xs font-bold text-amber-800 dark:text-yellow-400 mt-2 mb-1" {...props} />
                      ),
                      p: ({ node, ...props }) => {
                        const text = String(props.children);
                        // Catch Sanskrit Slokas and style beautifully as traditional scriptures
                        if (text.includes('॥') || text.includes('।') && text.length > 15 && text.length < 150 && /[\u0900-\u097F]/.test(text)) {
                          return (
                            <div className="my-3 p-3.5 bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-amber-50/70 dark:from-amber-950/20 dark:to-amber-950/10 border-y-2 border-yellow-500/30 rounded-lg text-center font-serif text-amber-900 dark:text-yellow-400 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-yellow-500/50" />
                              <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-yellow-500/50" />
                              <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-yellow-500/50" />
                              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-yellow-500/50" />
                              <p className="text-sm md:text-base leading-relaxed font-bold italic whitespace-pre-line my-0">{props.children}</p>
                            </div>
                          );
                        }
                        return <p className="mb-2 leading-relaxed" {...props} />;
                      }
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>

                {/* AI Assistant Quick Actions (Visible on hover on Desktop, always visible on mobile) */}
                {msg.role === 'model' && (
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4">
                    {/* Left: Feedback */}
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleFeedback(msg.id, 'like')}
                        className={`p-1.5 rounded-md hover:bg-orange-50 dark:hover:bg-slate-800 transition ${feedback[msg.id] === 'like' ? 'text-green-600' : 'text-slate-400 hover:text-green-600'}`}
                        title="Useful"
                      >
                        <ThumbsUp size={12} className={feedback[msg.id] === 'like' ? 'fill-green-600/10' : ''} />
                      </button>
                      <button 
                        onClick={() => handleFeedback(msg.id, 'dislike')}
                        className={`p-1.5 rounded-md hover:bg-orange-50 dark:hover:bg-slate-800 transition ${feedback[msg.id] === 'dislike' ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                        title="Not Useful"
                      >
                        <ThumbsDown size={12} className={feedback[msg.id] === 'dislike' ? 'fill-red-500/10' : ''} />
                      </button>
                    </div>

                    {/* Right: Sharing, TTS, Copying, Regeneration */}
                    <div className="flex items-center gap-1">
                      {msg.id !== 'welcome' && (
                        <button 
                          onClick={() => handleRegenerate(msg.id)}
                          className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-md transition"
                          title="Regenerate"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleSpeak(msg.id, msg.text)}
                        className={`p-1.5 rounded-md hover:bg-orange-50 dark:hover:bg-slate-800 transition ${speakingId === msg.id ? 'text-orange-500 bg-orange-50 dark:bg-slate-800 animate-pulse' : 'text-slate-400 hover:text-orange-500'}`}
                        title={speakingId === msg.id ? "Stop Reading" : "Read Aloud"}
                      >
                        {speakingId === msg.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      </button>

                      <button 
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-md transition relative"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? (
                          <Check size={12} className="text-green-600" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>

                      <button 
                        onClick={() => handleShare(msg.text)}
                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-md transition"
                        title="Share Response"
                      >
                        <Share2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {/* Animated typing loading status */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white dark:bg-slate-900 border border-orange-100/80 dark:border-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 shadow-sm flex items-center gap-3">
                <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest">गुरु जी चिंतनशील हैं</span>
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        <div ref={endOfMessagesRef} />
      </div>

      {/* INPUT AREA */}
      <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-gradient-to-t from-[#FAF6F0] via-[#FAF6F0]/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 z-20 flex justify-center">
        <div className="w-full max-w-2xl relative">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-orange-200/80 dark:border-slate-800 pl-2 pr-12 py-1.5 flex items-center relative min-h-[50px]">
            {/* Left Action: Voice mic input */}
            <button
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-full transition ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800'}`}
              title={isListening ? "Listening... Click to stop" : "Speak your query (Voice Input)"}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {/* Main Textarea input */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="दिव्य गुरु जी से अपना प्रश्न पूछें..."
              rows={Math.min(4, input.split('\n').length || 1)}
              maxLength={1000}
              className="flex-1 bg-transparent border-none outline-none resize-none px-2 py-1.5 text-xs md:text-sm text-amber-950 dark:text-white"
            />

            {/* Character count label */}
            {input.length > 50 && (
              <span className="absolute right-14 bottom-3 text-[8px] font-mono text-slate-400">
                {input.length}/1000
              </span>
            )}

            {/* Right Action: Send message */}
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="absolute right-1.5 top-1.5 bottom-1.5 w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-slate-200 disabled:to-slate-200 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 rounded-xl flex items-center justify-center text-white transition-all shadow-sm transform active:scale-95 cursor-pointer shrink-0"
              title="Send spiritual question"
            >
              <Send size={15} strokeWidth={2.5} className="-ml-0.5" />
            </button>
          </div>

          <p className="text-[9px] text-center text-slate-400 dark:text-slate-500 mt-1.5 leading-tight">
            AI गुरु मार्गदर्शन प्रदान करता है। दिव्य सत्य के लिए सनातन शास्त्रों का अध्ययन करें।
          </p>
        </div>
      </div>

      {/* Floating alert for clipboard copy success */}
      <AnimatePresence>
        {shareSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg font-bold flex items-center gap-1.5"
          >
            <Check size={14} className="text-green-500" /> Response shared successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
