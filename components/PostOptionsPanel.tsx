import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ForumPost, User } from '../types';

interface PostOptionsPanelProps {
  post: ForumPost;
  currentUser: User;
  onClose: () => void;
  onUpdate: (pid: string, content: string) => void;
  onDelete: (pid: string) => void;
  onQuote: (post: ForumPost) => void;
}

const PostOptionsPanel: React.FC<PostOptionsPanelProps> = ({ 
  post, currentUser, onClose, onUpdate, onDelete, onQuote 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'moderator';
  const isAuthor = currentUser.id === post.authorId;
  const canEdit = isAuthor || isAdmin;

  const handleSave = () => {
    if (!editContent.trim()) return;
    onUpdate(post.id, editContent.trim());
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121824] w-full max-w-md rounded-[2rem] border border-[#1f293d] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 bg-[#0c1017] border-b border-[#1f293d]/50 flex items-center justify-between">
          <div className="text-left">
            <h3 className="font-black text-white tracking-tighter uppercase text-base">Post Options</h3>
            <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">Select an action for this reply</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 bg-[#090d16] hover:bg-slate-800 border border-[#1f293d] rounded-full flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-all text-xs font-black"
          >
            ✕
          </button>
        </div>

        {/* Content Options */}
        <div className="p-5">
          {isEditing ? (
            <div className="flex flex-col gap-3">
              <div className="text-left px-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edit Reply Body</label>
              </div>
              <textarea 
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-40 bg-[#090d16] border border-[#1f293d] rounded-2xl p-4 text-xs text-white outline-none focus:border-indigo-500 transition-colors resize-none font-medium leading-relaxed"
              />
              <div className="flex gap-2.5 mt-1">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 border border-[#1f293d] hover:bg-slate-800 text-slate-400 hover:text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-left">
              {/* Quote Reply */}
              <button 
                onClick={() => { onQuote(post); onClose(); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#090d16] hover:bg-slate-900 border border-[#1f293d] hover:border-slate-800 transition-all active:scale-[0.99]"
              >
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-lg font-black shrink-0">❞</div>
                <div className="min-w-0">
                  <div className="font-black text-white text-xs">Quote Reply</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Insert this message into input box</div>
                </div>
              </button>

              {/* Edit Post */}
              {canEdit && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#090d16] hover:bg-slate-900 border border-[#1f293d] hover:border-slate-800 transition-all active:scale-[0.99]"
                >
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-lg font-black shrink-0">✎</div>
                  <div className="min-w-0">
                    <div className="font-black text-white text-xs">Edit Message</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Modify the text content</div>
                  </div>
                </button>
              )}

              {/* Delete Post */}
              {canEdit && (
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this reply permanently?')) {
                      onDelete(post.id);
                    }
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#090d16] hover:bg-rose-950/20 border border-[#1f293d] hover:border-rose-900/30 transition-all active:scale-[0.99] group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center text-lg font-black group-hover:bg-rose-500 group-hover:text-white transition-colors shrink-0">🗑</div>
                  <div className="min-w-0">
                    <div className="font-black text-white text-xs group-hover:text-rose-400 transition-colors">Delete Reply</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Permanently remove from thread</div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PostOptionsPanel;

