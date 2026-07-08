import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Conversation } from '../types';

import { mongoService } from '../services/mongoService';
import { triggerToast } from '../components/NotificationToast';
import { apTransactionService } from '../services/apTransactionService';
import {
  ensureKeyPair,
  getStoredPublicKeyJwk,
  encryptMessage,
  decryptMessage,
  isEncrypted,
} from '../utils/e2eEncryption';
import { getConvId } from '../utils/convId';
import { BBCodeParser } from '../components/BBCodeParser';

interface Message {
  id: string;
  senderId?: string;
  sender: string;
  senderAvatar?: string;
  senderPublicKey?: JsonWebKey; // stored so recipient can decrypt
  text: string;         // encrypted ciphertext (or plaintext fallback)
  displayText?: string; // decrypted plaintext for display
  time: string;
  timestamp?: number;
  isMe: boolean;
  isRead?: boolean;
  isEncrypted?: boolean;
}

const QUICK_EMOJIS = ['🔥', '💯', '😂', '❤️', '👀', '✨', '👍', '👋'];

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isConversationsLoaded, setIsConversationsLoaded] = useState(false);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myPublicKey, setMyPublicKey] = useState<JsonWebKey | null>(null);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<Conversation | null>(null);
  const currentUserRef = useRef<User | null>(null);
  activeChatRef.current = activeChat;
  currentUserRef.current = currentUser;

  // 1. Initialize user session + E2E keys
  useEffect(() => {
    const savedUser = localStorage.getItem('user_session');
    let user: User | null = null;
    if (savedUser) {
      try {
        user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (e) {
        console.error(e);
      }
    }

    // Generate/load E2E key pair and publish public key to Firestore
    ensureKeyPair().then(pubKey => {
      setMyPublicKey(pubKey);
      // Store public key in user profile so recipients can fetch it
      if (user?.id) {
        mongoService.updateUser(user.id, { e2ePublicKey: pubKey } as any);
      }
    });

    const savedConvs = localStorage.getItem('friends_bd_conversations');
    if (savedConvs) {
      try {
        const parsed = JSON.parse(savedConvs);
        // Migrate old conv IDs to symmetric pm_X_Y format
        const migrated = parsed.map((c: any) => {
          if (c.id && !c.id.startsWith('pm_') && !c.isGroup && c.participants?.[0]?.id && user?.id) {
            const correctId = getConvId(user.id, c.participants[0].id);
            return { ...c, id: correctId };
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
    setIsConversationsLoaded(true);
  }, []);

  // 2. Handle ?userId= query param to open/start chat
  useEffect(() => {
    if (targetUserId && isConversationsLoaded) {
      const existing = conversations.find(
        c => !c.isGroup && c.participants.some(p => p.id === targetUserId)
      );

      if (existing) {
        setActiveChat(existing);
        setSearchParams({});
      } else {
        mongoService.getUser(targetUserId).then(targetUser => {
          if (targetUser) {
            const convId = getConvId(currentUser.id, targetUser.id);
            const newConv: Conversation = {
              id: convId,
              participants: [targetUser],
              lastMessage: 'Say hello! 👋',
              timestamp: 'Just now',
              unreadCount: 0,
              isGroup: false
            };

            const updatedConvs = [newConv, ...conversations.filter(c => c.id !== newConv.id)];
            setConversations(updatedConvs);
            localStorage.setItem('friends_bd_conversations', JSON.stringify(updatedConvs));
            setActiveChat(newConv);
            setSearchParams({});
          }
        }).catch(err => console.warn('Failed to load user for chat:', err));
      }
    }
  }, [targetUserId, isConversationsLoaded]);

  // 3. Real-time Firestore message listener
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const convId = activeChat.id;

    const unsub = mongoService.listenMessages(convId, async (rawMsgs) => {
      if (rawMsgs.length === 0) return; // Never wipe messages on empty result

      const myId = currentUserRef.current.id;

      const decrypted: Message[] = await Promise.all(
        rawMsgs.map(async (m: any) => {
          const isMe = m.senderId === myId;
          let displayText = m.text; // default: show raw text

          try {
            if (m.isEncrypted && !isMe && m.senderPublicKey) {
              displayText = await decryptMessage(m.text, m.senderPublicKey);
            } else if (m.isEncrypted && isMe) {
              displayText = localStorage.getItem(`msg_display_${m.id}`) || m.text;
            }
          } catch {
            // Decryption failed — show text as-is
            displayText = m.text;
          }

          return {
            id: m.id,
            senderId: m.senderId,
            sender: m.senderName || (isMe ? currentUserRef.current.name : 'User'),
            senderAvatar: m.senderAvatar,
            senderPublicKey: m.senderPublicKey,
            text: m.text,
            displayText,
            time: m.time || new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: m.timestamp,
            isMe,
            isRead: m.isRead,
            isEncrypted: m.isEncrypted,
          };
        })
      );

      // Merge: keep any optimistic messages not yet in Firestore
      setMessages(prev => {
        const firestoreIds = new Set(decrypted.map(m => m.id));
        const localOnly = prev.filter(m => !firestoreIds.has(m.id));
        const merged = [...decrypted, ...localOnly].sort(
          (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
        );
        return merged;
      });

      // Mark incoming messages as read
      rawMsgs.forEach((m: any) => {
        if (!m.isRead && m.senderId !== myId) {
          mongoService.markMessageRead(convId, m.id);
        }
      });

      // Reset unread count
      setConversations(prev => {
        const updated = prev.map(c =>
          c.id === convId ? { ...c, unreadCount: 0 } : c
        );
        localStorage.setItem('friends_bd_conversations', JSON.stringify(updated));
        return updated;
      });
    });

    return () => unsub();
  }, [activeChat?.id]);

  // 4. Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  }, [messages]);

  // 5. Send message (encrypted, real user-to-user)
  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !activeChat || isSending) return;

    setIsSending(true);
    if (!textToSend) setInputText('');

    const msgId = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const myPubKey = myPublicKey || getStoredPublicKeyJwk();

    let ciphertext = text;
    let encrypted = false;
    const recipientId = activeChat.isGroup ? null : activeChat.participants[0]?.id;

    // Attempt E2E encryption if we have recipient's public key
    if (recipientId && !activeChat.isGroup) {
      try {
        // Fetch recipient's public key from Firestore
        const recipientUser = await mongoService.getUser(recipientId);
        const recipientPubKey = (recipientUser as any)?.e2ePublicKey;

        if (recipientPubKey && myPubKey) {
          ciphertext = await encryptMessage(text, recipientPubKey);
          encrypted = true;
        }
      } catch (err) {
        console.warn('E2E encryption failed, sending plaintext:', err);
      }
    }

    // Store plaintext locally for display (my own message)
    if (encrypted) {
      localStorage.setItem(`msg_display_${msgId}`, text);
    }

    const firestoreMsg = {
      id: msgId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar || `https://picsum.photos/seed/${currentUser.id}/100`,
      senderPublicKey: myPubKey, // recipient needs this to decrypt
      text: ciphertext,
      time: nowTime,
      timestamp: Date.now(),
      isMe: false, // from recipient's perspective
      isRead: false,
      convId: activeChat.id,
      isEncrypted: encrypted,
    };

    // Optimistically add to local state immediately
    setMessages(prev => [
      ...prev,
      {
        id: msgId,
        senderId: currentUser.id,
        sender: currentUser.name,
        senderAvatar: currentUser.avatar,
        text: ciphertext,
        displayText: text, // always show plaintext to self
        time: nowTime,
        timestamp: Date.now(),
        isMe: true,
        isRead: false,
        isEncrypted: encrypted,
      }
    ]);

    // Save to Firestore
    await mongoService.sendMessage(activeChat.id, firestoreMsg);

    // Award AP for chat message
    apTransactionService.adjustUserAP(currentUser.id, 'MAIN_CHAT_POSTED')
      .then(({ newBalance }) => {
        const saved = localStorage.getItem('user_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.balance_ap = newBalance;
          localStorage.setItem('user_session', JSON.stringify(parsed));
          window.dispatchEvent(new Event('storage'));
        }
      })
      .catch(err => console.warn('Failed to reward chat AP:', err));

    // Update conversation metadata
    const participantIds = recipientId
      ? [currentUser.id, recipientId]
      : [currentUser.id];

    mongoService.saveConversation(activeChat.id, {
      id: activeChat.id,
      participantIds,
      lastMessage: encrypted ? '🔒 Encrypted message' : text,
      lastTimestamp: Date.now(),
      lastSenderId: currentUser.id,
      ...(recipientId ? { [`unread_${recipientId}`]: 1 } : {}),
    });

    // Update local conversations list
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === activeChat.id
          ? { ...c, lastMessage: encrypted ? '🔒 Encrypted message' : text, timestamp: 'Just now' }
          : c
      );
      localStorage.setItem('friends_bd_conversations', JSON.stringify(updated));
      return updated;
    });

    // Notify recipient via Firestore notification
    if (recipientId && recipientId !== currentUser.id) {
      mongoService.sendMessageNotification(
        recipientId,
        currentUser.id,
        currentUser.name,
        currentUser.avatar || `https://picsum.photos/seed/${currentUser.id}/100`,
        text, // send plaintext in notification preview
        activeChat.id
      );
    }

    setIsSending(false);
  }, [activeChat, currentUser, inputText, myPublicKey, isSending]);

  // Filter sidebar list
  const filteredConversations = conversations.filter(c => {
    const name = c.isGroup ? c.groupName : c.participants[0]?.name;
    const user = c.isGroup ? '' : c.participants[0]?.username;
    return (
      name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="h-[calc(100vh-90px)] md:h-screen bg-[#0F0F1A] flex text-white font-inter">
      {/* Sidebar */}
      <div
        className={`${
          activeChat ? 'hidden md:flex' : 'flex'
        } w-full md:w-[360px] border-r border-white/5 bg-[#141424] flex-col shrink-0 h-full`}
      >
        {/* Sidebar Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-black italic bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
                Chats
              </h2>
              <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest flex flex-wrap items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                End-to-End Encrypted
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/members')}
            className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/30 active:scale-95 transition-all hover:opacity-90"
            title="Start New Chat"
          >
            ➕
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="bg-[#1C1C2E] border border-white/5 rounded-xl flex items-center px-3 focus-within:border-purple-500/40 transition-colors">
            <span className="text-sm mr-2 opacity-40">🔍</span>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-white/80 placeholder-white/20 py-3 outline-none font-medium"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
          {filteredConversations.length > 0 ? (
            filteredConversations
              .sort((a, b) => (b as any).lastTimestamp - (a as any).lastTimestamp || 0)
              .map(conv => {
                const isUnread = conv.unreadCount > 0;
                const isActive = activeChat?.id === conv.id;
                const targetUser = conv.participants[0];
                const chatName = conv.isGroup ? conv.groupName : targetUser?.name;
                const avatar = conv.isGroup ? conv.icon : targetUser?.avatar;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveChat(conv)}
                    className={`w-full flex flex-wrap items-center gap-4 p-3.5 rounded-2xl transition-all border border-transparent ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-900/40 to-indigo-900/30 border-purple-500/20'
                        : 'hover:bg-white/5'
                    } active:scale-[0.98] text-left`}
                  >
                    <div className="relative shrink-0">
                      {conv.isGroup ? (
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl font-bold shadow-md">
                          {avatar || '👥'}
                        </div>
                      ) : (
                        <>
                          <img
                            src={avatar}
                            className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-md"
                            alt=""
                          />
                          {targetUser?.isOnline && (
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#141424] rounded-full" />
                          )}
                        </>
                      )}
                      {isUnread && (
                        <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center border border-white font-black shadow-md">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="text-xs font-black truncate text-white leading-tight">{chatName}</h4>
                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{conv.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-white/50 truncate font-medium flex flex-wrap items-center gap-1">
                        {conv.lastMessage?.startsWith('🔒') && <span className="text-emerald-400/70">🔒</span>}
                        {conv.lastMessage?.replace('🔒 ', '') || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
          ) : (
            <div className="py-12 text-center opacity-30">
              <span className="text-3xl block mb-2">💬</span>
              <p className="text-xs font-bold uppercase tracking-wider">No chats found</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Pane */}
      <div
        className={`${
          activeChat ? 'flex' : 'hidden md:flex'
        } flex-1 flex-col h-full bg-[#0F0F1A] relative`}
      >
        {activeChat ? (
          <>
            {/* Chat Header */}
            <header className="p-4 bg-[#141424] border-b border-white/5 flex items-center justify-between shrink-0 shadow-xl relative z-10">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setActiveChat(null)}
                  className="md:hidden p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95 border border-white/5"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    {activeChat.isGroup ? (
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-lg font-bold">
                        {activeChat.icon || '👥'}
                      </div>
                    ) : (
                      <>
                        <img
                          src={activeChat.participants[0].avatar}
                          className="w-10 h-10 rounded-lg object-cover border border-white/10"
                          alt=""
                        />
                        {activeChat.participants[0].isOnline && (
                          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-[#141424] rounded-full animate-pulse" />
                        )}
                      </>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white leading-tight">
                      {activeChat.isGroup ? activeChat.groupName : activeChat.participants[0].name}
                    </h3>
                    <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest flex flex-wrap items-center gap-1 mt-0.5">
                      🔒 End-to-End Encrypted
                    </p>
                  </div>
                </div>
              </div>

              {!activeChat.isGroup && (
                <button
                  onClick={() => navigate(`/profile/${activeChat.participants[0].username}`)}
                  className="bg-white/5 border border-white/5 px-4 py-2 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                >
                  View Profile
                </button>
              )}
            </header>

            {/* E2E Notice Banner */}
            <div className="px-4 py-2 bg-emerald-500/5 border-b border-emerald-500/10 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] text-emerald-400/70 font-bold">
                🔒 Messages are end-to-end encrypted. Only you and the recipient can read them.
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-30 gap-3">
                  <span className="text-4xl">🔒</span>
                  <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
                  <p className="text-[10px] text-center">Send a message to start an encrypted conversation</p>
                </div>
              )}
              {messages.map((m, index) => (
                <div key={`${m.id}-${index}`} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex flex-wrap items-end gap-2.5 max-w-[75%]">
                    {!m.isMe && (
                      <img
                        src={m.senderAvatar || activeChat.participants[0].avatar}
                        className="w-7 h-7 rounded-lg object-cover border border-white/10 shrink-0"
                        alt=""
                      />
                    )}
                    <div
                      className={`px-4 py-3.5 rounded-[1.8rem] text-sm relative ${
                        m.isMe
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-lg shadow-purple-950/20'
                          : 'bg-[#1C1C2E] border border-white/5 text-white/80 rounded-bl-none shadow-md'
                      }`}
                    >
                      <div className="font-medium leading-relaxed whitespace-pre-wrap">
                        <BBCodeParser rawText={m.displayText || m.text} />
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1 mt-1.5">
                        {m.isEncrypted && (
                          <span className="text-[8px] opacity-50" title="End-to-end encrypted">🔒</span>
                        )}
                        <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">
                          {m.time}
                          {m.isMe && (m.isRead ? ' · Read ✓✓' : ' · Sent ✓')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Quick Emoji Bar */}
            <div className="px-5 py-2 bg-[#0F0F1A] border-t border-white/5 flex flex-wrap gap-2 overflow-x-auto no-scrollbar shrink-0">
              {QUICK_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => handleSendMessage(e)}
                  className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm transition-all active:scale-90"
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-5 bg-[#141424] border-t border-white/5 shrink-0">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 bg-[#1C1C2E] border border-white/5 rounded-[1.8rem] px-5 py-1 flex items-center focus-within:border-purple-500/40 transition-colors">
                  <input
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Write an encrypted message..."
                    className="flex-1 bg-transparent border-none text-sm font-medium py-3.5 outline-none text-white/80 placeholder-white/20"
                  />
                  <button
                    onClick={() => setInputText(prev => prev + '😊')}
                    className="text-lg opacity-40 hover:opacity-100 transition-opacity active:scale-90"
                  >
                    😊
                  </button>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isSending}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white w-13 h-13 rounded-[1.4rem] flex items-center justify-center shadow-lg shadow-purple-900/30 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  {isSending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-30">
            <span className="text-6xl mb-4">🔒</span>
            <h3 className="text-lg font-black uppercase tracking-widest">Secure Messaging</h3>
            <p className="text-xs font-medium mt-2">
              Choose a conversation or start a new one.<br/>
              All messages are end-to-end encrypted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

