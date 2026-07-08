
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ForumPost, User } from '../types';
import { BBCodeParser } from './BBCodeParser';

interface PostCardProps {
  post: ForumPost;
  currentUser: User;
  index: number;
  onOptionsOpen: (post: ForumPost) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, index, onOptionsOpen }) => {
  if (post.is_deleted) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-4 text-center italic text-slate-400 text-xs sm:text-sm">
        Content purged by authority or user.
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-purple-100 hover:border-purple-200 transition-all group overflow-hidden"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex flex-wrap gap-4 min-w-0">
          <Link to={`/profile/${post.authorUsername || post.authorName}`} className="relative shrink-0">
            <img 
              src={post.authorAvatar} 
              className="w-12 h-12 rounded-2xl shadow-md border-2 border-white ring-2 ring-purple-50 object-cover" 
              alt={post.authorName} 
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" title="Online" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/profile/${post.authorUsername || post.authorName}`} className="text-[14px] font-black text-slate-800 hover:text-purple-600 transition-colors truncate">
                {post.authorName}
              </Link>
              {post.authorId === 'me' && (
                <span className="bg-purple-600 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm shrink-0">Admin</span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mt-0.5 whitespace-nowrap">
              {new Date(post.timestamp).toLocaleDateString()} • {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <button 
          onClick={() => onOptionsOpen(post)}
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-purple-50 hover:text-purple-600 transition-all active:scale-90"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </button>
      </div>

      <div className="bbcode-render px-1 max-w-full">
        <BBCodeParser rawText={post.content} />
      </div>

      <div className="mt-8 pt-5 border-t border-slate-50 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
           {Object.keys(post.reactions || {}).length > 0 ? (
             Object.entries(post.reactions).map(([emoji, count]) => (
               <div key={emoji} className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1 flex flex-wrap items-center gap-1.5 shadow-sm">
                 <span className="text-xs">{emoji}</span>
                 <span className="text-xs sm:text-sm font-black text-slate-500">{count}</span>
               </div>
             ))
           ) : (
             <div className="flex flex-wrap gap-1.5">
               {['❤️', '👍', '🔥'].map(e => (
                 <button key={e} className="w-9 h-9 rounded-xl bg-slate-50 text-sm grayscale hover:grayscale-0 hover:bg-purple-50 hover:shadow-inner transition-all active:scale-125 border border-transparent hover:border-purple-100">{e}</button>
               ))}
             </div>
           )}
        </div>
        <div className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-widest group-hover:text-purple-200 transition-colors">
          #{String(index + 1).padStart(2, '0')}
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;

