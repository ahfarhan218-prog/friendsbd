import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mongoService } from '../services/mongoService';

interface BBCodeParserProps {
  rawText: string;
}

export const BBCodeParser: React.FC<BBCodeParserProps> = ({ rawText }) => {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('user_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Listen to storage changes to update currentUser reactively
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('user_session');
        if (saved) {
          setCurrentUser(JSON.parse(saved));
        }
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Load all users for mentions resolution
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem('friends_bd_users');
      if (savedUsers) {
        setAllUsers(JSON.parse(savedUsers));
      }
    } catch (e) {
      // ignore
    }

    // Set up a listener for users changes if available
    const unsub = mongoService.listenUsers((users) => {
      setAllUsers(users);
    });
    return () => unsub();
  }, []);

  // Regex to match tags, @mentions, and #hashtags
  const TAG_REGEX = /(?:\[member\]|\[\/user\]|\[user\]|@\w+@|@\w+|#\w+|\[[^\]]+\]\([^)]+\)|\[avatar\]|\[onmood\]|\[marry\]|\[inventory\]|\[mshop\]|\[extset\]|\[helpown\]|\[br\/\]|\[youtube=[^\]]+\][\s\S]*?\[\/youtube\]|\[b\][\s\S]*?\[\/b\]|\[u\][\s\S]*?\[\/u\]|\[i\][\s\S]*?\[\/i\]|\[big\][\s\S]*?\[\/big\]|\[small\][\s\S]*?\[\/small\]|\[center\][\s\S]*?\[\/center\]|\[quote(?:=[^\]]+)?\][\s\S]*?\[\/quote\]|\[url(?:=[^\]]+)?\][\s\S]*?\[\/url\]|\[img\][\s\S]*?\[\/img\]|\[sphoto(?:=[^\]]+)?\][\s\S]*?\[\/sphoto\]|\[clr=[^\]]+\][\s\S]*?\[\/clr\]|\[color=[^\]]+\][\s\S]*?\[\/color\]|\[size=[^\]]+\][\s\S]*?\[\/size\]|\[topic=[^\]]+\][\s\S]*?\[\/topic\]|\[archive=\d+\][\s\S]*?\[\/(?:archive|topic)\]|\[blog=\d+\][\s\S]*?\[\/blog\]|\[club=\d+\][\s\S]*?\[\/club\]|\[user=[^\]]+\][\s\S]*?\[\/user\]|\[gb=\d+\][\s\S]*?\[\/gb\]|\[poll=\d+\][\s\S]*?\[\/poll\]|\[room=\d+\][\s\S]*?\[\/room\])/i;

  const parseMatch = (token: string, index: number): React.ReactNode => {
    const lower = token.toLowerCase();

    // Category A: Viewer Context Aware Tags (Dynamic Real-time)
    if (lower === '[member]') {
      const name = currentUser?.username || currentUser?.name || 'Guest';
      return <span key={index} className="font-extrabold text-indigo-300">{name}</span>;
    }

    if (lower === '[/user]' || lower === '[user]') {
      const name = currentUser?.username || currentUser?.name || 'Guest';
      const uid = currentUser?.id || 'me';
      return (
        <Link
          key={index}
          to={`/profile/${uid}`}
          className="font-extrabold text-indigo-400 hover:underline hover:text-indigo-300 transition-colors"
        >
          {name}
        </Link>
      );
    }

    // Markdown link support: [text](url)
    if (token.startsWith('[') && token.includes('](')) {
      const textMatch = token.match(/\[([^\]]+)\]/);
      const urlMatch = token.match(/\(([^)]+)\)/);
      if (textMatch && urlMatch) {
        const linkText = textMatch[1];
        const linkUrl = urlMatch[1];
        return (
          <Link
            key={index}
            to={linkUrl}
            className="text-indigo-400 font-bold hover:underline transition-all inline-flex flex-wrap items-center gap-1 bg-[#121824]/30 px-2 py-0.5 rounded-lg border border-[#1f293d]"
          >
            🔗 {linkText}
          </Link>
        );
      }
    }

    // Category B: User Mention & Social Tags
    if (token.startsWith('@') && token.endsWith('@')) {
      const username = token.slice(1, -1);
      const matched = allUsers.find(
        (u) =>
          u.username?.toLowerCase() === username.toLowerCase() ||
          u.name?.toLowerCase() === username.toLowerCase()
      );
      const uid = matched ? matched.id : username;
      return (
        <Link
          key={index}
          to={`/profile/${uid}`}
          className="text-indigo-400 font-extrabold hover:underline transition-colors"
        >
          @{username}
        </Link>
      );
    }

    // Hashtag support
    if (token.startsWith('#')) {
      const tag = token.substring(1);
      return (
        <Link
          key={index}
          to={`/search?q=%23${tag}`}
          className="text-sky-400 font-bold hover:underline transition-colors"
        >
          #{tag}
        </Link>
      );
    }

    // Standard @username mention support (no trailing @)
    if (token.startsWith('@')) {
      const username = token.substring(1);
      const matched = allUsers.find(
        (u) =>
          u.username?.toLowerCase() === username.toLowerCase() ||
          u.name?.toLowerCase() === username.toLowerCase()
      );
      const uid = matched ? matched.id : username;
      return (
        <Link
          key={index}
          to={`/profile/${uid}`}
          className="text-indigo-400 font-extrabold hover:underline transition-colors"
        >
          @{username}
        </Link>
      );
    }

    if (lower === '[avatar]') {
      const avatarUrl = currentUser?.avatar || 'https://picsum.photos/seed/anon/100';
      return (
        <img
          key={index}
          src={avatarUrl}
          className="w-7 h-7 rounded-full border border-[#1f293d] inline-block align-middle mx-1 shadow-sm object-cover"
          alt="User Avatar"
        />
      );
    }

    if (lower === '[onmood]') {
      return (
        <Link
          key={index}
          to="/settings"
          className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-[#121824] hover:bg-slate-800 border border-[#1f293d] rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider text-slate-300 hover:text-white transition-all active:scale-95 mx-0.5 shadow-sm"
          title="Mood Status"
        >
          🎭 Mood
        </Link>
      );
    }

    if (lower === '[marry]') {
      return (
        <Link
          key={index}
          to="/friends"
          className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-[#121824] hover:bg-slate-800 border border-[#1f293d] rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider text-slate-300 hover:text-white transition-all active:scale-95 mx-0.5 shadow-sm"
          title="Relationship"
        >
          💍 Relationship
        </Link>
      );
    }

    if (lower === '[inventory]') {
      return (
        <Link
          key={index}
          to="/shop"
          className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-[#121824] hover:bg-slate-800 border border-[#1f293d] rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider text-slate-300 hover:text-white transition-all active:scale-95 mx-0.5 shadow-sm"
          title="My Inventory"
        >
          🎒 Inventory
        </Link>
      );
    }

    if (lower === '[mshop]') {
      return (
        <Link
          key={index}
          to="/shop"
          className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-[#121824] hover:bg-slate-800 border border-[#1f293d] rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider text-slate-300 hover:text-white transition-all active:scale-95 mx-0.5 shadow-sm"
          title="Member Shop"
        >
          🏪 Shop
        </Link>
      );
    }

    if (lower === '[extset]') {
      return (
        <Link
          key={index}
          to="/settings"
          className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-[#121824] hover:bg-slate-800 border border-[#1f293d] rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider text-slate-300 hover:text-white transition-all active:scale-95 mx-0.5 shadow-sm"
          title="Extended Settings"
        >
          ⚙️ Settings
        </Link>
      );
    }

    if (lower === '[helpown]') {
      return (
        <Link
          key={index}
          to="/support"
          className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-[#121824] hover:bg-slate-800 border border-[#1f293d] rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider text-slate-300 hover:text-white transition-all active:scale-95 mx-0.5 shadow-sm"
          title="Help Support"
        >
          🎧 Support
        </Link>
      );
    }

    if (lower === '[br/]') {
      return <br key={index} />;
    }

    // Category C: Media & Formatting Blocks
    const ytMatch = token.match(/^\[youtube=([^\]]+)\]([\s\S]*?)\[\/youtube\]$/i);
    if (ytMatch) {
      const videoId = ytMatch[1];
      const label = ytMatch[2];
      return (
        <div key={index} className="my-4 max-w-lg rounded-3xl overflow-hidden border border-[#1f293d] bg-slate-950/40 shadow-inner group">
          <div className="relative aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={label || "YouTube Video"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          {label && (
            <div className="p-3 bg-[#121824]/50 border-t border-[#1f293d]/50 text-left">
              <span className="text-xs font-black text-indigo-400 uppercase tracking-wider block mb-0.5">YouTube Video</span>
              <span className="text-xs font-bold text-slate-300">{label}</span>
            </div>
          )}
        </div>
      );
    }

    const boldMatch = token.match(/^\[b\]([\s\S]*?)\[\/b\]$/i);
    if (boldMatch) {
      return <strong key={index} className="font-extrabold text-white">{renderRecursive(boldMatch[1])}</strong>;
    }

    const underlineMatch = token.match(/^\[u\]([\s\S]*?)\[\/u\]$/i);
    if (underlineMatch) {
      return <span key={index} className="underline decoration-indigo-500/50 decoration-2 underline-offset-2">{renderRecursive(underlineMatch[1])}</span>;
    }

    const italicMatch = token.match(/^\[i\]([\s\S]*?)\[\/i\]$/i);
    if (italicMatch) {
      return <em key={index} className="italic text-slate-300">{renderRecursive(italicMatch[1])}</em>;
    }

    const bigMatch = token.match(/^\[big\]([\s\S]*?)\[\/big\]$/i);
    if (bigMatch) {
      return <span key={index} className="text-xl font-bold tracking-tight text-white">{renderRecursive(bigMatch[1])}</span>;
    }

    const smallMatch = token.match(/^\[small\]([\s\S]*?)\[\/small\]$/i);
    if (smallMatch) {
      return <span key={index} className="text-xs text-slate-400 font-medium">{renderRecursive(smallMatch[1])}</span>;
    }

    const centerMatch = token.match(/^\[center\]([\s\S]*?)\[\/center\]$/i);
    if (centerMatch) {
      return (
        <div key={index} className="text-center w-full my-2">
          {renderRecursive(centerMatch[1])}
        </div>
      );
    }

    const quoteMatch = token.match(/^\[quote(?:=([^\]]+))?\]([\s\S]*?)\[\/quote\]$/i);
    if (quoteMatch) {
      const author = quoteMatch[1];
      const text = quoteMatch[2];
      return (
        <blockquote key={index} className="border-l-4 border-indigo-500/40 bg-white/5 pl-4 py-2 pr-2 my-3 rounded-r-xl italic text-slate-300">
          {author && (
            <span className="block text-xs sm:text-sm font-black uppercase text-indigo-400 mb-1 not-italic">
              {author} wrote:
            </span>
          )}
          {renderRecursive(text)}
        </blockquote>
      );
    }

    const urlMatch = token.match(/^\[url(?:=([^\]]+))?\]([\s\S]*?)\[\/url\]$/i);
    if (urlMatch) {
      const url = urlMatch[1] || urlMatch[2];
      const text = urlMatch[2] || urlMatch[1];
      const isInternal = url.startsWith('/') || (typeof window !== 'undefined' && url.includes(window.location.host));
      if (isInternal) {
        const path = (typeof window !== 'undefined' && url.includes(window.location.host))
          ? url.split(window.location.host)[1]
          : url;
        return (
          <Link key={index} to={path} className="text-indigo-400 hover:underline font-bold transition-all">
            {renderRecursive(text)}
          </Link>
        );
      }
      return (
        <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-bold transition-all inline-flex flex-wrap items-center gap-1">
          {renderRecursive(text)} 🔗
        </a>
      );
    }

    const imgMatch = token.match(/^\[img\]([\s\S]*?)\[\/img\]$/i);
    if (imgMatch) {
      const src = imgMatch[1];
      return (
        <img key={index} src={src} alt="BBCode Attachment" className="max-w-full h-auto rounded-2xl border border-white/10 my-3 inline-block shadow-md" />
      );
    }

    const sphotoMatch = token.match(/^\[sphoto(?:=([^\]]+))?\]([\s\S]*?)\[\/sphoto\]$/i);
    if (sphotoMatch) {
      const src = sphotoMatch[1] || sphotoMatch[2];
      return (
        <div key={index} className="my-6 p-1 bg-gradient-to-tr from-amber-400 via-purple-500 to-rose-500 rounded-[2.2rem] shadow-xl max-w-sm mx-auto">
          <img src={src} className="w-full rounded-[2rem] border-2 border-white object-cover" alt="S-Photo" />
        </div>
      );
    }

    const clrMatch = token.match(/^\[clr=([^\]]+)\]([\s\S]*?)\[\/clr\]$/i);
    if (clrMatch) {
      const color = clrMatch[1];
      const text = clrMatch[2];
      return <span key={index} style={{ color }}>{renderRecursive(text)}</span>;
    }

    const colorMatch = token.match(/^\[color=([^\]]+)\]([\s\S]*?)\[\/color\]$/i);
    if (colorMatch) {
      const color = colorMatch[1];
      const text = colorMatch[2];
      return <span key={index} style={{ color }}>{renderRecursive(text)}</span>;
    }

    const sizeMatch = token.match(/^\[size=([^\]]+)\]([\s\S]*?)\[\/size\]$/i);
    if (sizeMatch) {
      const size = sizeMatch[1];
      const text = sizeMatch[2];
      const styleSize = /^\d+$/.test(size) ? `${size}px` : size;
      return <span key={index} style={{ fontSize: styleSize }}>{renderRecursive(text)}</span>;
    }

    // Category D: Relational Database Route Builders
    const topicMatch = token.match(/^\[topic=([^\]]+)\]([\s\S]*?)\[\/topic\]$/i);
    if (topicMatch) {
      const topicId = topicMatch[1];
      const text = topicMatch[2];
      return (
        <Link key={index} to={`/forum/thread/${topicId}`} className="text-indigo-400 hover:underline hover:text-indigo-300 font-bold transition-all">
          {renderRecursive(text)}
        </Link>
      );
    }

    const archiveMatch = token.match(/^\[archive=(\d+)\]([\s\S]*?)\[\/(?:archive|topic)\]$/i);
    if (archiveMatch) {
      const archiveId = archiveMatch[1];
      const text = archiveMatch[2];
      return (
        <Link key={index} to={`/timeline?archiveId=${archiveId}`} className="text-indigo-400 hover:underline hover:text-indigo-300 font-bold transition-all">
          {renderRecursive(text)}
        </Link>
      );
    }

    const blogMatch = token.match(/^\[blog=(\d+)\]([\s\S]*?)\[\/blog\]$/i);
    if (blogMatch) {
      const blogId = blogMatch[1];
      const text = blogMatch[2];
      return (
        <Link key={index} to={`/blog/${blogId}`} className="text-indigo-400 hover:underline hover:text-indigo-300 font-bold transition-all">
          {renderRecursive(text)}
        </Link>
      );
    }

    const clubMatch = token.match(/^\[club=(\d+)\]([\s\S]*?)\[\/club\]$/i);
    if (clubMatch) {
      const clubId = clubMatch[1];
      const text = clubMatch[2];
      return (
        <Link key={index} to={`/club/${clubId}`} className="text-indigo-400 hover:underline hover:text-indigo-300 font-bold transition-all">
          {renderRecursive(text)}
        </Link>
      );
    }

    const userMatch = token.match(/^\[user=([^\]]+)\]([\s\S]*?)\[\/user\]$/i);
    if (userMatch) {
      const userId = userMatch[1];
      const text = userMatch[2];
      return (
        <Link key={index} to={`/profile/${userId}`} className="text-indigo-400 hover:underline hover:text-indigo-300 font-bold transition-all">
          {renderRecursive(text)}
        </Link>
      );
    }

    const gbMatch = token.match(/^\[gb=(\d+)\]([\s\S]*?)\[\/gb\]$/i);
    if (gbMatch) {
      const gbId = gbMatch[1];
      const text = gbMatch[2];
      return (
        <Link key={index} to={`/profile/${gbId}?tab=Guestbook`} className="text-indigo-400 hover:underline hover:text-indigo-300 font-bold transition-all">
          {renderRecursive(text)}
        </Link>
      );
    }

    const pollMatch = token.match(/^\[poll=(\d+)\]([\s\S]*?)\[\/poll\]$/i);
    if (pollMatch) {
      const pollId = pollMatch[1];
      const text = pollMatch[2];
      return (
        <Link key={index} to={`/poll/${pollId}`} className="text-indigo-400 hover:underline hover:text-indigo-300 font-bold transition-all">
          {renderRecursive(text)}
        </Link>
      );
    }

    const pollMatchShort = token.match(/^\[poll=(\d+)\]([\s\S]*?)\[\/topic\]$/i);
    if (pollMatchShort) {
      const pollId = pollMatchShort[1];
      const text = pollMatchShort[2];
      return (
        <Link key={index} to={`/poll/${pollId}`} className="text-indigo-400 hover:underline hover:text-indigo-300 font-bold transition-all">
          {renderRecursive(text)}
        </Link>
      );
    }

    const roomMatch = token.match(/^\[room=(\d+)\]([\s\S]*?)\[\/room\]$/i);
    if (roomMatch) {
      const roomId = roomMatch[1];
      const text = roomMatch[2];
      return (
        <Link key={index} to={`/conference/${roomId}`} className="text-indigo-400 hover:underline hover:text-indigo-300 font-bold transition-all">
          {renderRecursive(text)}
        </Link>
      );
    }

    return token;
  };

  const renderRecursive = (text: string): React.ReactNode[] => {
    if (!text) return [];

    const nodes: React.ReactNode[] = [];
    let remaining = text;
    let index = 0;

    while (remaining.length > 0) {
      const match = remaining.match(TAG_REGEX);
      if (!match) {
        nodes.push(remaining);
        break;
      }

      const matchIdx = match.index || 0;
      if (matchIdx > 0) {
        nodes.push(remaining.substring(0, matchIdx));
      }

      const matchedToken = match[0];
      nodes.push(parseMatch(matchedToken, index++));
      remaining = remaining.substring(matchIdx + matchedToken.length);
    }

    return nodes;
  };

  return <div className="whitespace-pre-wrap leading-relaxed select-text break-words">{renderRecursive(rawText)}</div>;
};

export default BBCodeParser;

