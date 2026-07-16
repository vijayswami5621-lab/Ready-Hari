import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Send, Trash2, Clock, Sparkles, Volume2, Copy, Menu, Plus, X, MessageSquare, ChevronRight, Search, Edit2 } from 'lucide-react';
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
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

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
      
      // If no current conversation and we have some, or if current was deleted
      if (convos.length > 0 && !currentConversationId) {
        // We don't auto-load the first one to allow "New Chat" by default, or we can auto-load.
        // Let's default to a New Chat screen if currentConversationId is null.
      } else if (convos.length === 0) {
        setCurrentConversationId(null);
      }
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

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userText = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      let convId = currentConversationId;
      
      // Create new conversation if needed
      if (!convId) {
        const convRef = doc(collection(db, 'users', user.uid, 'aiGuruHistory'));
        convId = convRef.id;
        setCurrentConversationId(convId);
        
        await setDoc(convRef, {
          title: userText.substring(0, 30) + (userText.length > 30 ? '...' : ''),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: userText
        });
      }

      // 1. Save user message to Firestore
      const messagesRef = collection(db, 'users', user.uid, 'aiGuruHistory', convId, 'messages');
      await addDoc(messagesRef, {
        role: 'user',
        text: userText,
        timestamp: serverTimestamp()
      });

      // Update conversation lastMessage & updatedAt
      await updateDoc(doc(db, 'users', user.uid, 'aiGuruHistory', convId), {
        lastMessage: userText,
        updatedAt: serverTimestamp()
      });

      // 2. Fetch AI response
      // Map previous messages to Gemini format (user vs model)
      // Exclude the hardcoded welcome message if it doesn't exist in Firestore
      const historyForAI = messages
        .filter(m => m.id !== 'welcome')
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        }));

      const response = await axios.post('/api/chat', { 
        message: userText,
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

    } catch (error) {
      console.error("Chat error:", error);
      // We could add an error message locally without saving to DB
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: '🙏 क्षमा करें, कुछ तकनीकी समस्या आ गई है। कृपया पुनः प्रयास करें।',
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
  };

  const selectConversation = (id: string) => {
    setCurrentConversationId(id);
    setIsDrawerOpen(false);
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

  const filteredConversations = conversations.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-orange-50 dark:bg-slate-900 transition-colors duration-300 relative">
      <SEO title="AI Guru | Hari Pathshala" description="Ask your spiritual questions and get answers from our AI Guru." />
      
      {/* HEADER */}
      <header className="px-4 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-100 dark:hover:bg-slate-800 rounded-full transition"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-saffron to-saffron-dark rounded-full flex items-center justify-center text-white shadow-md">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white leading-tight">AI Guru</h1>
              <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Online
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={startNewChat} className="p-2 text-saffron hover:bg-orange-100 dark:hover:bg-slate-800 rounded-full transition" title="New Chat">
            <Plus size={22} />
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
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '-100%' }} 
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col border-r border-slate-100 dark:border-slate-800"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="font-bold text-brown-dark dark:text-white flex items-center gap-2">
                  <Clock size={18} className="text-saffron" /> Chat History
                </h2>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4">
                <button 
                  onClick={startNewChat}
                  className="w-full py-3 px-4 bg-saffron text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-saffron-dark transition-colors"
                >
                  <Plus size={18} /> New Conversation
                </button>
              </div>

              <div className="px-4 pb-2">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search chats..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-saffron"
                  />
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {filteredConversations.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 mt-10">No conversations found.</p>
                ) : (
                  filteredConversations.map(conv => (
                    <div 
                      key={conv.id} 
                      onClick={() => selectConversation(conv.id)}
                      className={`w-full text-left p-3 rounded-xl transition flex items-start gap-3 group cursor-pointer ${currentConversationId === conv.id ? 'bg-orange-50 dark:bg-slate-800 border border-orange-100 dark:border-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'}`}
                    >
                      <MessageSquare size={18} className={`mt-0.5 shrink-0 ${currentConversationId === conv.id ? 'text-saffron' : 'text-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${currentConversationId === conv.id ? 'text-brown-dark dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {conv.title || "New Chat"}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                      </div>
                      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button 
                          onClick={(e) => renameConversation(e, conv.id, conv.title || "New Chat")}
                          className="p-1 text-slate-300 hover:text-saffron hover:bg-orange-50 dark:hover:bg-slate-700 rounded-md transition"
                          title="Rename Chat"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => deleteConversation(e, conv.id)}
                          className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition"
                          title="Delete Chat"
                        >
                          <Trash2 size={14} />
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative ${
                msg.role === 'user' 
                  ? 'bg-saffron text-white rounded-tr-sm' 
                  : 'bg-white dark:bg-slate-800 text-brown-dark dark:text-slate-200 border border-orange-100 dark:border-slate-700 rounded-tl-sm'
              }`}>
                {msg.role === 'model' && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button className="p-1 text-brown-light/50 hover:text-saffron transition" onClick={() => navigator.clipboard.writeText(msg.text)}><Copy size={12} /></button>
                    <button className="p-1 text-brown-light/50 hover:text-saffron transition"><Volume2 size={12} /></button>
                  </div>
                )}
                
                <div className={`prose prose-sm dark:prose-invert max-w-none ${msg.role === 'user' ? 'text-white' : ''} ${msg.role === 'model' ? 'mt-2' : ''}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
                
                <div className={`text-[9px] mt-1 text-right ${msg.role === 'user' ? 'text-white/70' : 'text-brown-light/50'}`}>
                  {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white dark:bg-slate-800 text-brown-dark rounded-2xl rounded-tl-sm p-4 shadow-sm border border-orange-100 flex gap-1 items-center">
                <span className="w-2 h-2 bg-saffron rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-saffron rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-saffron rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endOfMessagesRef} />
      </div>

      {/* INPUT AREA */}
      <div className="fixed bottom-[80px] w-full p-4 bg-gradient-to-t from-orange-50 via-orange-50 to-transparent dark:from-slate-900 dark:via-slate-900">
        <div className="relative glass-card dark:glass-card-dark rounded-full p-1 shadow-lg border border-orange-200 dark:border-slate-700">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your spiritual question..."
            className="w-full bg-transparent border-none outline-none py-3 pl-5 pr-14 text-sm text-brown-dark dark:text-white"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-1.5 top-1.5 bottom-1.5 w-10 bg-saffron hover:bg-saffron-dark disabled:bg-brown-light/30 rounded-full flex items-center justify-center text-white transition shadow-sm"
          >
            <Send size={16} className="-ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
