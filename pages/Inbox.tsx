import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Conversation } from '../types';
import { triggerToast } from '../components/NotificationToast';
import { mongoService } from '../services/mongoService';
import { ensureKeyPair, getStoredPublicKeyJwk, encryptMessage, decryptMessage } from '../utils/e2eEncryption';
import { getConvId } from '../utils/convId';

interface InboxLetter {
  id: string;
  sender: string;
  senderAvatar: string;
  senderRole: string;
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isClaimed: boolean;
  pointsReward?: number;
  coinsReward?: number;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  displayText?: string;
  time: string;
  isMe: boolean;
  isRead?: boolean;
  isEncrypted?: boolean;
}

const Inbox: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pms' | 'letters' | 'requests'>('pms');
  const getSessionUser = (): User | null => {
    try { return JSON.parse(localStorage.getItem('user_session') || 'null'); }
    catch { return null; }
  };
  const [currentUser, setCurrentUser] = useState<User | null>(getSessionUser);

  // PM Conversation States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [composeSearch, setComposeSearch] = useState('');
  const [myPublicKey, setMyPublicKey] = useState<JsonWebKey | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Official Letter States
  const [letters, setLetters] = useState<InboxLetter[]>([]);
  const [activeLetter, setActiveLetter] = useState<InboxLetter | null>(null);

  // Request States
  const [requests, setRequests] = useState<any[]>([]);

  // Load User, Conversations, Letters, and E2E keys
  useEffect(() => {
    // 1. User session
    const savedUser = localStorage.getItem('user_session');
    let user: User | null = null;
    if (savedUser) {
      try {
        user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (e) { console.error(e); }
    }

    // 2. E2E key pair
    ensureKeyPair().then(pubKey => {
      setMyPublicKey(pubKey);
      if (user.id) {
        mongoService.updateUser(user.id, { e2ePublicKey: pubKey } as any);
      }
    });

    // 2. PM Conversations (with ID migration)
    const savedConvs = localStorage.getItem('friends_bd_conversations');
    if (savedConvs) {
      try {
        const parsed = JSON.parse(savedConvs);
        const migrated = parsed.map((c: any) => {
          if (c.id && !c.id.startsWith('pm_') && !c.isGroup && c.participants?.[0]?.id && user?.id) {
            return { ...c, id: getConvId(user.id, c.participants[0].id) };
          }
          return c;
        });
        setConversations(migrated);
        localStorage.setItem('friends_bd_conversations', JSON.stringify(migrated));
      } catch (e) {
        setConversations([]);
      }
    } else {
      setConversations([]);
    }

    // 3. Official letters seeding & loading
    const savedLetters = localStorage.getItem('friends_bd_letters');
    if (savedLetters) {
      setLetters(JSON.parse(savedLetters));
    } else {
      const defaultLetters: InboxLetter[] = [
        {
          id: 'let_1',
          sender: 'FriendsBD Staff',
          senderAvatar: 'https://picsum.photos/seed/staff/150',
          senderRole: '👑 Chief Admin',
          title: 'Welcome to the New Community Hub!',
          content: 'Hi Mehedi,\n\nWe are absolutely delighted to welcome you to the new FriendsBD framework! As one of our premium testers and top active players, we appreciate you setting up tournaments, quizzes, and chat shouts.\n\nTo help you dominate the leaderboard, we have enclosed a welcome gift of 250 Points!\n\nBest Regards,\nThe Staff Team',
          timestamp: '10 mins ago',
          isRead: false,
          isClaimed: false,
          pointsReward: 250,
        },
        {
          id: 'let_2',
          sender: 'Game Master 🚜',
          senderAvatar: 'https://picsum.photos/seed/farm/150',
          senderRole: '🌾 Mini-games Host',
          title: 'Special Golden Coin Claim',
          content: 'Greeting player!\n\nYour recent scores in the Ludo matches and Farm games have triggered a special community bonus grant. We love seeing your high-quality engagement on our feeds.\n\nPlease claim your bonus reward of 5 Golden Coins below to use them immediately in our shop or games.\n\nKeep on rollin\'!',
          timestamp: '2 hours ago',
          isRead: false,
          isClaimed: false,
          coinsReward: 5,
        },
        {
          id: 'let_3',
          sender: 'Lotto Referee',
          senderAvatar: 'https://picsum.photos/seed/lotto/150',
          senderRole: '✨ Event Manager',
          title: 'Weekly Lotto Draw Announcement',
          content: 'Alert: The weekend jackpot registration is officially open.\n\nWe are seeing record participation this week. No reward is attached to this bulletin, but the premium store features an exclusive ticket pack discount right now. Best of luck in the draw!',
          timestamp: 'Yesterday',
          isRead: false,
          isClaimed: false,
        }
      ];
      setLetters(defaultLetters);
      localStorage.setItem('friends_bd_letters', JSON.stringify(defaultLetters));
    }
  }, []);

  // Sync scroll for chats
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Real-time Firestore messages for active conversation
  useEffect(() => {
    if (!activeChat) {
      setChatMessages([]);
      return;
    }
    const convId = activeChat.id;
    const myId = currentUser.id;

    const unsub = mongoService.listenMessages(convId, async (rawMsgs) => {
      const decrypted: Message[] = await Promise.all(
        rawMsgs.map(async (m: any) => {
          const isMe = m.senderId === myId;
          let displayText = m.text;
          if (m.isEncrypted && !isMe && m.senderPublicKey) {
            displayText = await decryptMessage(m.text, m.senderPublicKey);
          } else if (m.isEncrypted && isMe) {
            displayText = localStorage.getItem(`msg_display_${m.id}`) || m.text;
          }
          return {
            id: m.id,
            sender: m.senderName,
            text: m.text,
            displayText,
            time: m.time,
            isMe,
            isRead: m.isRead,
            isEncrypted: m.isEncrypted,
          };
        })
      );
      setChatMessages(decrypted);

      // Mark incoming as read
      rawMsgs.forEach((m: any) => {
        if (!m.isRead && m.senderId !== myId) {
          mongoService.markMessageRead(convId, m.id);
        }
      });

      // Reset unread count
      setConversations(prev => {
        const updated = prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c);
        localStorage.setItem('friends_bd_conversations', JSON.stringify(updated));
        return updated;
      });
    });

    return () => unsub();
  }, [activeChat?.id, currentUser.id]);

  // Handle PM Send (E2E encrypted, no auto-reply)
  const handleSendMessage = useCallback(async () => {
    if (!newMessageText.trim() || !activeChat || isSending) return;

    setIsSending(true);
    const text = newMessageText;
    setNewMessageText('');

    const msgId = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const myPubKey = myPublicKey || getStoredPublicKeyJwk();
    const recipientId = activeChat.isGroup ? null : activeChat.participants[0]?.id;

    let ciphertext = text;
    let encrypted = false;

    if (recipientId && !activeChat.isGroup) {
      try {
        const recipientUser = await mongoService.getUser(recipientId);
        const recipientPubKey = (recipientUser as any)?.e2ePublicKey;
        if (recipientPubKey && myPubKey) {
          ciphertext = await encryptMessage(text, recipientPubKey);
          encrypted = true;
        }
      } catch (err) {
        console.warn('Encryption failed:', err);
      }
    }

    if (encrypted) localStorage.setItem(`msg_display_${msgId}`, text);

    // Optimistic update
    setChatMessages(prev => [
      ...prev,
      { id: msgId, sender: currentUser.name, text: ciphertext, displayText: text,
        time: nowTime, isMe: true, isRead: false, isEncrypted: encrypted }
    ]);

    await mongoService.sendMessage(activeChat.id, {
      id: msgId, senderId: currentUser.id, senderName: currentUser.name,
      senderAvatar: currentUser.avatar, senderPublicKey: myPubKey,
      text: ciphertext, time: nowTime, timestamp: Date.now(),
      isMe: false, isRead: false, convId: activeChat.id, isEncrypted: encrypted,
    });

    if (recipientId && recipientId !== currentUser.id) {
      mongoService.sendMessageNotification(recipientId, currentUser.id, currentUser.name,
        currentUser.avatar || `https://picsum.photos/seed/${currentUser.id}/100`, text, activeChat.id);
      mongoService.saveConversation(activeChat.id, {
        id: activeChat.id, participantIds: [currentUser.id, recipientId],
        lastMessage: encrypted ? '🔒 Encrypted message' : text,
        lastTimestamp: Date.now(), lastSenderId: currentUser.id,
        [`unread_${recipientId}`]: 1,
      });
    }

    setConversations(prev => {
      const updated = prev.map(c => c.id === activeChat.id
        ? { ...c, lastMessage: encrypted ? '🔒 Encrypted message' : text, timestamp: 'Just now' } : c);
      localStorage.setItem('friends_bd_conversations', JSON.stringify(updated));
      return updated;
    });

    setIsSending(false);
  }, [activeChat, currentUser, newMessageText, myPublicKey, isSending]);

  // Start new chat with user from search
  const handleStartComposeChat = (friend: User) => {
    const convId = getConvId(currentUser.id, friend.id);

    // Check if conversation already exists
    const existing = conversations.find(c => c.id === convId);
    if (existing) {
      setActiveChat(existing);
      setIsComposing(false);
      return;
    }

    // Otherwise, create new with symmetric ID
    const newConv: Conversation = {
      id: convId,
      participants: [friend],
      lastMessage: 'Say hello! 👋',
      timestamp: 'Just now',
      unreadCount: 0,
      isGroup: false
    };

    const updatedConvs = [newConv, ...conversations];
    setConversations(updatedConvs);
    localStorage.setItem('friends_bd_conversations', JSON.stringify(updatedConvs));
    
    setActiveChat(newConv);
    setIsComposing(false);
  };

  // Claim rewards from Letter
  const handleClaimReward = (letter: InboxLetter) => {
    if (letter.isClaimed) return;

    // 1. Mark letter as claimed
    const updatedLetters = letters.map(l => l.id === letter.id ? { ...l, isClaimed: true, isRead: true } : l);
    setLetters(updatedLetters);
    localStorage.setItem('friends_bd_letters', JSON.stringify(updatedLetters));

    // Update detail overlay state
    setActiveLetter(prev => prev ? { ...prev, isClaimed: true, isRead: true } : null);

    // 2. Dispatch points/coins to user state info
    let pointsToAdd = letter.pointsReward || 0;
    let coinsToAdd = letter.coinsReward || 0;

    const updatedUser = {
      ...currentUser,
      points: currentUser.points + pointsToAdd,
      goldenCoins: currentUser.goldenCoins + coinsToAdd
    };

    setCurrentUser(updatedUser);
    localStorage.setItem('user_session', JSON.stringify(updatedUser));

    // Trigger toast notification
    let toastMsg = 'Claimed rewards successfully!';
    if (pointsToAdd && coinsToAdd) {
      toastMsg = `Acclaimed +${pointsToAdd} Points & +${coinsToAdd} Golden Coins!`;
    } else if (pointsToAdd) {
      toastMsg = `Acclaimed +${pointsToAdd} Points!`;
    } else if (coinsToAdd) {
      toastMsg = `Acclaimed +${coinsToAdd} Golden Coins!`;
    }

    triggerToast({
      id: 'claim-' + letter.id,
      senderId: 'system',
      senderName: letter.sender,
      senderAvatar: letter.senderAvatar,
      type: 'REWARD',
      message: toastMsg,
      timestamp: Date.now(),
      isRead: false
    });

    // Fire window storage event to let layouts know user stats updated
    window.dispatchEvent(new Event('storage'));
  };

  // Open letter
  const handleOpenLetter = (letter: InboxLetter) => {
    setActiveLetter(letter);

    // Mark as read
    if (!letter.isRead) {
      const updatedLetters = letters.map(l => l.id === letter.id ? { ...l, isRead: true } : l);
      setLetters(updatedLetters);
      localStorage.setItem('friends_bd_letters', JSON.stringify(updatedLetters));
    }
  };

  // Manage Request Actions
  const handleRequestAction = (id: string, name: string, approved: boolean) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    
    triggerToast({
      id: `req-toast-${id}`,
      senderId: 'system',
      senderName: 'Notification Unit',
      senderAvatar: 'https://picsum.photos/seed/systemnotify/100',
      type: 'SYSTEM',
      message: approved ? `You accepted ${name}'s request!` : `Declined request from ${name}.`,
      timestamp: Date.now(),
      isRead: false
    });
  };

  const [allUsers, setAllUsers] = useState<User[]>([]);
  useEffect(() => {
    const unsub = mongoService.listenUsers(setAllUsers);
    return () => unsub();
  }, []);
  const filteredFriends = allUsers.filter(f => 
    f.name?.toLowerCase().includes(composeSearch.toLowerCase()) || 
    f.username?.toLowerCase().includes(composeSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white relative flex flex-col font-inter" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(124, 58, 237, 0.15) 0%, transparent 70%), linear-gradient(135deg, #110a2a 0%, #1d0d4a 50%, #0d1a6b 100%)' }}>
      
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-full max-w-sm h-96 bg-purple-600/30 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-full max-w-sm h-96 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

      {/* 1. Header Banner */}
      <header className="bg-[#12122A]/80 backdrop-blur-xl border-b border-purple-500/20 p-6 pb-20 rounded-b-[3.5rem] shadow-2xl relative shrink-0 z-20">
        
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/home')} 
              className="p-2.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-90"
            >
              <svg className="w-5 h-5 text-purple-300 fill-none stroke-current" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center gap-2">
                Inbox Hub
              </h2>
              <p className="text-[9px] text-indigo-300/60 font-black uppercase tracking-widest mt-0.5">
                Level {currentUser?.level || 1} • {currentUser?.points || 0} pts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-amber-500/10 text-amber-300 font-black border border-amber-500/20 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(251,191,36,0.15)]">
              👑 {currentUser.goldenCoins}
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="mt-8 flex bg-[#1A1A35]/50 p-1.5 rounded-2.5xl border border-purple-500/20 backdrop-blur-md">
          <button
            onClick={() => { setActiveTab('pms'); setActiveChat(null); }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${
              activeTab === 'pms' ? 'bg-purple-600/30 text-white shadow-lg border border-purple-500/30 scale-[1.02]' : 'text-purple-300/50 hover:text-purple-300 hover:bg-purple-500/10'
            }`}
          >
            💬 PMs
          </button>
          
          <button
            onClick={() => { setActiveTab('letters'); setActiveLetter(null); }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-2xl transition-all relative ${
              activeTab === 'letters' ? 'bg-purple-600/30 text-white shadow-lg border border-purple-500/30 scale-[1.02]' : 'text-purple-300/50 hover:text-purple-300 hover:bg-purple-500/10'
            }`}
          >
            📬 Letters
            {letters.some(l => !l.isRead) && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.8)] animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-2xl transition-all relative ${
              activeTab === 'requests' ? 'bg-purple-600/30 text-white shadow-lg border border-purple-500/30 scale-[1.02]' : 'text-purple-300/50 hover:text-purple-300 hover:bg-purple-500/10'
            }`}
          >
            👥 Invites
            {requests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                {requests.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Content Cards */}
      <div className="px-4 -mt-12 flex-1 pb-24 overflow-y-auto no-scrollbar relative z-10">
        
        {/* TAB 1: PERSONAL DISCUSSIONS */}
        {activeTab === 'pms' && (
          <div className="space-y-4">
            
            {/* Compose trigger */}
            <div className="flex items-center justify-between bg-[#1A1A35]/60 backdrop-blur-md px-6 py-4 rounded-[2rem] border border-purple-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
              <span className="text-xs font-black text-purple-300/60 uppercase tracking-wider">Start a discussion</span>
              <button 
                onClick={() => setIsComposing(true)}
                className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 font-black px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_15px_rgba(147,51,234,0.1)]"
              >
                <span>➕ New Message</span>
              </button>
            </div>

            {/* Conversation list */}
            {conversations.length === 0 ? (
              <div className="bg-[#1A1A35]/40 backdrop-blur-md p-12 text-center rounded-[2.5rem] border border-dashed border-purple-500/20 shadow-xl">
                <span className="text-5xl block mb-3 opacity-50">💬</span>
                <h4 className="font-black text-white text-sm uppercase tracking-wider mb-1">No chats found</h4>
                <p className="text-xs text-purple-300/60 font-medium">Click New Message to begin chatting with community mates!</p>
              </div>
            ) : (
              <div className="bg-[#1A1A35]/40 backdrop-blur-md rounded-[2.5rem] p-4 shadow-xl border border-purple-500/20 space-y-1">
                <p className="text-[10px] font-extrabold uppercase text-purple-400/80 tracking-widest pl-4 py-3 border-b border-purple-500/10">Active Threads</p>
                {conversations.map(conv => {
                  const isUnread = conv.unreadCount > 0;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveChat(conv)}
                      className={`w-full flex items-center gap-4 p-3.5 rounded-2.5xl transition-all border-b border-purple-500/10 last:border-none relative group ${
                        isUnread 
                          ? 'bg-purple-600/10 border-l-4 border-l-purple-500 pl-2.5 hover:bg-purple-600/20' 
                          : 'hover:bg-purple-500/5'
                      }`}
                    >
                      <div className="relative shrink-0">
                        {conv.isGroup ? (
                          <div className={`w-13 h-13 rounded-2xl flex items-center justify-center text-2xl border-2 font-bold transition-all ${
                            isUnread ? 'bg-purple-500/30 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-[#12122A] border-purple-500/30 text-purple-300 group-hover:border-purple-500/50'
                          }`}>
                            {conv.icon || '👥'}
                          </div>
                        ) : (
                          <img 
                            src={conv.participants[0].avatar} 
                            className={`w-13 h-13 rounded-2xl border-2 object-cover transition-all ${
                              isUnread ? 'border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-purple-500/30 group-hover:border-purple-500/50'
                            }`} 
                            alt="" 
                          />
                        )}
                        
                        {isUnread && (
                          <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[9px] w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 border-[#1A1A35] font-black shadow-[0_0_10px_rgba(236,72,153,0.8)] animate-pulse">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className={`text-xs truncate tracking-tight ${
                            isUnread ? 'font-black text-white' : 'font-extrabold text-white/90'
                          }`}>
                            {conv.isGroup ? conv.groupName : conv.participants[0].name}
                          </h4>
                          <span className={`text-[9px] uppercase tracking-widest ${
                            isUnread ? 'text-purple-400 font-extrabold' : 'text-purple-300/40 font-extrabold'
                          }`}>{conv.timestamp}</span>
                        </div>
                        <p className={`text-xs truncate leading-relaxed ${
                          isUnread ? 'font-bold text-white/80' : 'font-medium text-purple-300/60'
                        }`}>
                          {isUnread ? '💬 ' + conv.lastMessage : conv.lastMessage}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BULLETINS & OFFICIAL LETTERS */}
        {activeTab === 'letters' && (
          <div className="space-y-4">
            
            <div className="bg-[#1A1A35]/40 backdrop-blur-md rounded-[2.5rem] p-5 shadow-xl border border-purple-500/20 space-y-3">
              <p className="text-[10px] font-extrabold uppercase text-purple-400/80 tracking-widest pl-2 mb-2">My Community Mailbox</p>
              
              {letters.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-5xl block mb-3 opacity-50">📬</span>
                  <p className="text-xs font-black text-purple-300/60 uppercase tracking-widest">No letters in your inbox</p>
                </div>
              ) : (
                letters.map(letter => (
                  <button
                    key={letter.id}
                    onClick={() => handleOpenLetter(letter)}
                    className={`w-full text-left p-4 rounded-2.5xl border flex items-start gap-4 transition-all relative group active:scale-[0.99] ${
                      !letter.isRead ? 'bg-purple-600/10 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:bg-purple-600/20' : 'bg-[#12122A]/40 border-purple-500/10 hover:bg-purple-500/10'
                    }`}
                  >
                    {!letter.isRead && (
                      <span className="absolute top-4 right-4 w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)] animate-pulse"></span>
                    )}

                    <img 
                      src={letter.senderAvatar} 
                      className={`w-12 h-12 rounded-2xl shadow-sm border shrink-0 object-cover ${!letter.isRead ? 'border-purple-400' : 'border-purple-500/30'}`} 
                      alt="" 
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] font-black bg-purple-500/20 text-purple-300 uppercase tracking-wider px-2 py-0.5 rounded-md border border-purple-500/30">
                          {letter.sender}
                        </span>
                        <span className="text-[8px] font-extrabold uppercase tracking-widest text-purple-300/60">
                          {letter.timestamp}
                        </span>
                      </div>
                      
                      <h4 className={`font-extrabold text-xs truncate leading-snug ${!letter.isRead ? 'text-white' : 'text-white/80'}`}>
                        {letter.title}
                      </h4>
                      
                      <p className="text-[11px] text-purple-300/60 line-clamp-1 font-medium select-none">
                        {letter.content}
                      </p>

                      {/* Reward indicators */}
                      {(letter.pointsReward || letter.coinsReward) && (
                        <div className="flex gap-2 pt-1">
                          {letter.pointsReward && (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                              🎁 +{letter.pointsReward} Points
                            </span>
                          )}
                          {letter.coinsReward && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-300 font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5 border border-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]">
                              👑 +{letter.coinsReward} Coins
                            </span>
                          )}
                          {letter.isClaimed && (
                            <span className="text-[9px] text-emerald-400/80 font-black uppercase tracking-wider flex items-center gap-1">
                              ✓ Claimed
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PARTIES & INVITES */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="bg-[#1A1A35]/40 backdrop-blur-md rounded-[2.5rem] p-5 shadow-xl border border-purple-500/20 space-y-4">
              <p className="text-[10px] font-extrabold uppercase text-purple-400/80 tracking-widest pl-2">Pending Requests</p>
              
              <AnimatePresence mode="popLayout">
                {requests.length > 0 ? (
                  requests.map(req => (
                    <motion.div
                      key={req.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="p-4 rounded-2.5xl bg-[#12122A]/60 border border-purple-500/20 flex items-center gap-4 hover:bg-purple-500/10 transition-all group"
                    >
                      <img src={req.avatar} className="w-13 h-13 rounded-2xl object-cover shadow-[0_0_15px_rgba(168,85,247,0.2)] border-2 border-purple-500/30 group-hover:border-purple-400 shrink-0 transition-all" alt="" />
                      
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest block mb-0.5">
                          {req.type}
                        </span>
                        
                        <h4 className="font-black text-white text-xs truncate">
                          {req.name}
                        </h4>
                        
                        <p className="text-[9px] text-purple-300/60 font-black uppercase tracking-wider">
                          {req.mutual} {typeof req.mutual === 'number' ? 'Mutual Mates' : 'Activity'}
                        </p>
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => handleRequestAction(req.id, req.name, true)}
                          className="w-9 h-9 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 text-xs shadow-[0_0_10px_rgba(52,211,153,0.15)]"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleRequestAction(req.id, req.name, false)}
                          className="w-9 h-9 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/30 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 text-xs shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                        >
                          ✕
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-[#12122A]/40 rounded-2.5xl p-6 border border-dashed border-purple-500/20">
                    <span className="text-5xl block mb-3">✨</span>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Inbox clean! No invites.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

      </div>

      {/* --- OVERLAY 1: ACTIVE LETTER COMPONENT PANEL --- */}
      <AnimatePresence>
        {activeLetter && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-end justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100, scale: 0.95 }} 
              animate={{ y: 0, scale: 1 }} 
              exit={{ y: 100, scale: 0.95 }}
              className="bg-[#12122A] w-full max-w-sm rounded-[3rem] p-6 shadow-2xl relative border border-purple-500/30 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header inside modal */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-purple-500/10">
                <div className="flex items-center gap-3">
                  <img src={activeLetter.senderAvatar} className="w-11 h-11 rounded-xl object-cover shadow-[0_0_15px_rgba(168,85,247,0.2)] border-2 border-purple-500/30" alt="" />
                  <div>
                    <h4 className="text-sm font-black text-white">{activeLetter.sender}</h4>
                    <p className="text-[9px] text-purple-400 font-extrabold uppercase tracking-widest">{activeLetter.senderRole}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setActiveLetter(null)}
                  className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-300 hover:text-white text-xs font-black hover:bg-purple-500/20 transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Content body */}
              <div className="space-y-4 text-left">
                <h3 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-white tracking-tight leading-snug">
                  {activeLetter.title}
                </h3>
                
                <div className="text-xs text-purple-100/80 font-medium whitespace-pre-wrap leading-relaxed h-48 overflow-y-auto no-scrollbar pr-1 bg-[#1A1A35]/60 p-4 rounded-2xl border border-purple-500/20 shadow-inner">
                  {activeLetter.content}
                </div>
                
                {/* Reward Claim Card */}
                {(activeLetter.pointsReward || activeLetter.coinsReward) && (
                  <div className="p-4 rounded-2xl bg-gradient-to-tr from-[#1A1A35] to-purple-900/30 border border-purple-500/30 flex items-center justify-between shadow-[0_0_20px_rgba(147,51,234,0.1)]">
                    <div>
                      <p className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-1">Enclosed Gifts</p>
                      <div className="flex gap-2">
                        {activeLetter.pointsReward && (
                          <span className="text-xs font-black text-emerald-400">✨ {activeLetter.pointsReward} Points</span>
                        )}
                        {activeLetter.coinsReward && (
                          <span className="text-xs font-black text-amber-400">👑 {activeLetter.coinsReward} Gold</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleClaimReward(activeLetter)}
                      disabled={activeLetter.isClaimed}
                      className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] ${
                        activeLetter.isClaimed 
                          ? 'bg-purple-900/50 shadow-none cursor-default text-purple-300/50 border border-purple-500/20' 
                          : 'bg-emerald-500 hover:bg-emerald-400 hover:scale-105 active:scale-95'
                      }`}
                    >
                      {activeLetter.isClaimed ? 'Claimed ✓' : 'Claim Reward'}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setActiveLetter(null)}
                  className="bg-[#1A1A35] border border-purple-500/30 text-purple-300 hover:text-white font-black px-6 py-3.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-purple-600/30 transition-all text-center w-full"
                >
                  Close Letter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- OVERLAY 2: INDEPENDENT DIRECT CHAT PANEL WITHIN INBOX --- */}
      <AnimatePresence>
        {activeChat && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end"
          >
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              className="bg-[#0F0F1A] w-full h-[85vh] rounded-t-[3rem] shadow-[0_-10px_40px_rgba(147,51,234,0.15)] flex flex-col border-t border-purple-500/30 relative"
            >
              {/* Background ambient glows for Chat */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none" />
              
              {/* Thread Header */}
              <header className="bg-[#12122A]/80 backdrop-blur-md text-white p-5 flex items-center justify-between shrink-0 border-b border-purple-500/20 relative z-10">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveChat(null)} 
                    className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-full transition-all hover:bg-purple-500/30 active:scale-90"
                  >
                    <svg className="w-5 h-5 fill-none stroke-current text-purple-300" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center text-xl shadow-[0_0_15px_rgba(168,85,247,0.2)] border border-purple-500/40 shrink-0">
                      {activeChat.isGroup ? '🦁' : '👤'}
                    </div>
                    <div>
                      <h4 className="text-sm font-black tracking-tight truncate max-w-[200px] text-white">
                        {activeChat.isGroup ? activeChat.groupName : activeChat.participants[0].name}
                      </h4>
                      <p className="text-[8px] text-purple-300/80 font-bold uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
                        Secure PM
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    navigate('/chat');
                  }}
                  className="bg-purple-600/20 hover:bg-purple-600/40 font-black text-purple-300 text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg border border-purple-500/30 transition-all shadow-[0_0_10px_rgba(147,51,234,0.1)]"
                >
                  Full View
                </button>
              </header>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-transparent relative z-10 no-scrollbar">
                {chatMessages.map((msg, index) => (
                  <div key={`${msg.id}-${index}`} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-3 rounded-[1.75rem] text-xs shadow-lg relative leading-relaxed backdrop-blur-sm ${
                      msg.isMe
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-sm border border-purple-400/30'
                        : 'bg-[#1A1A35]/80 text-white rounded-bl-sm border border-purple-500/20'
                    }`}>
                      <p className={`font-black text-[9px] mb-0.5 block select-none uppercase tracking-wider ${msg.isMe ? 'text-purple-200' : 'text-purple-400'}`}>
                        {msg.sender}
                      </p>
                      <p className="font-bold text-[13px] leading-snug">{msg.displayText || msg.text}</p>
                      
                      <div className="flex items-center justify-between gap-3 mt-1.5 opacity-70 select-none">
                        <span className="text-[7px] font-black uppercase tracking-widest leading-none">
                          {msg.time}
                        </span>
                        {msg.isMe && (
                          <span className={`text-[8.5px] font-black uppercase tracking-wider flex items-center gap-0.5 leading-none ${
                            msg.isRead ? 'text-emerald-300' : 'text-purple-200'
                          }`}>
                            {msg.isRead ? (
                              <>
                                <span>✓✓</span>
                                <span>Seen</span>
                              </>
                            ) : (
                              <>
                                <span>✓</span>
                                <span>Sent</span>
                              </>
                            )}
                          </span>
                        )}
                        {!msg.isMe && !msg.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]"></span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Textbar */}
              <div className="p-4 bg-[#12122A]/80 backdrop-blur-md border-t border-purple-500/20 shrink-0 relative z-10">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-[9px] text-emerald-400 font-black flex items-center gap-1 uppercase tracking-widest">
                    🔒 End-to-end encrypted
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#1A1A35]/60 border border-purple-500/30 rounded-2xl px-4 py-1 flex items-center shadow-inner focus-within:border-purple-400 focus-within:bg-[#1A1A35] transition-all">
                    <input
                      type="text"
                      value={newMessageText}
                      onChange={e => setNewMessageText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Write an encrypted message..."
                      className="flex-1 bg-transparent border-none text-xs font-semibold py-3 outline-none text-white placeholder:text-purple-300/40"
                    />
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessageText.trim() || isSending}
                    className="bg-purple-600 hover:bg-purple-500 text-white w-11 h-11 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all active:scale-90 disabled:opacity-50 disabled:shadow-none"
                  >
                    {isSending ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- OVERLAY 3: COMPOSE POPUP --- */}
      <AnimatePresence>
        {isComposing && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end"
          >
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              className="bg-[#0F0F1A] w-full h-[70vh] rounded-t-[3rem] shadow-[0_-10px_40px_rgba(147,51,234,0.15)] flex flex-col border-t border-purple-500/30 relative"
            >
              {/* Ambient glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none" />

              <header className="bg-[#12122A]/80 backdrop-blur-md text-white p-5 flex items-center justify-between shrink-0 border-b border-purple-500/20 relative z-10">
                <h3 className="font-black text-sm uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">New Private Message</h3>
                <button 
                  onClick={() => setIsComposing(false)}
                  className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-300 hover:text-white text-xs font-black hover:bg-purple-500/20 transition-all border border-purple-500/20"
                >
                  ✕
                </button>
              </header>

              <div className="p-4 bg-transparent border-b border-purple-500/20 shrink-0 relative z-10">
                <input
                  type="text"
                  placeholder="Search user..."
                  value={composeSearch}
                  onChange={e => setComposeSearch(e.target.value)}
                  className="w-full bg-[#1A1A35]/60 text-white rounded-xl px-4 py-3 text-xs font-bold border border-purple-500/30 outline-none focus:border-purple-400 focus:bg-[#1A1A35] transition-all placeholder:text-purple-300/40"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar bg-transparent relative z-10">
                <p className="text-[9px] font-black uppercase text-purple-400/80 tracking-widest pl-2 mb-2">My Friends List</p>
                {filteredFriends.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs font-bold text-purple-300/60">No matching friends list</p>
                  </div>
                ) : (
                  filteredFriends.map(friend => (
                    <button
                      key={friend.id}
                      onClick={() => handleStartComposeChat(friend)}
                      className="w-full bg-[#12122A]/60 p-3.5 rounded-2xl border border-purple-500/20 flex items-center gap-3.5 hover:bg-purple-500/10 hover:border-purple-500/30 text-left transition-all active:scale-[0.98] group"
                    >
                      <img src={friend.avatar} className="w-10 h-10 rounded-xl object-cover shadow-[0_0_15px_rgba(168,85,247,0.1)] border border-purple-500/30 group-hover:border-purple-400 shrink-0 transition-all" alt="" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-xs text-white truncate">{friend.name}</h4>
                        <p className="text-[10px] text-purple-300/60 font-bold">@{friend.username}</p>
                      </div>
                      <span className="text-[10px] font-black text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-500/30 group-hover:bg-purple-600/30 group-hover:text-white transition-all">
                        Chat
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inbox;


