import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BBCodeParser } from '../components/BBCodeParser';
import { API_BASE } from '../services/mongoService';

const BBCodeEditor: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (tag: string, placeholder: string = '', isClosed: boolean = true) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = isClosed ? `[${tag}]${selectedText || placeholder}[/${tag}]` : `[${tag}]`;
    setContent(content.substring(0, start) + textToInsert + content.substring(end));
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length); }, 0);
  };

  const insertColor = () => {
    const color = prompt('Enter HEX color (e.g. #7F00FF):', '#7F00FF');
    if (color) insertTag(`color=${color}`);
  };

  const handlePublish = async () => {
    if (!content.trim()) return;
    setPublishing(true);
    const raw = localStorage.getItem('user_session');
    const session = raw ? JSON.parse(raw) : {};
    try {
      await fetch(`${API_BASE}/blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: session.id || 'anonymous',
          authorName: session.name || 'Anonymous',
          authorAvatar: session.avatar || '',
          title: title || 'Untitled BBCode Post',
          content,
          tags: ['shout']
        })
      });
      navigate('/bb-dashboard');
    } catch { setPublishing(false); }
  };

  const toolbarButtons = [
    { icon: 'B', tag: 'b', label: 'Bold' },
    { icon: 'I', tag: 'i', label: 'Italic' },
    { icon: 'U', tag: 'u', label: 'Underline' },
    { icon: '🔗', tag: 'url=https://example.com', label: 'URL' },
    { icon: '🖼️', tag: 'img', placeholder: 'https://picsum.photos/400/200', label: 'Image' },
    { icon: '❝', tag: 'quote', label: 'Quote' },
    { icon: '📏', tag: 'size=20px', label: 'Size' },
    { icon: '↔️', tag: 'center', label: 'Center' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B1A] pb-32 font-inter flex flex-col overflow-x-hidden">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#110a2a] via-[#1d0d4a] to-[#0d1a6b] text-white p-6 pb-20 rounded-b-[3.5rem] shadow-xl shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,_#7c3aed33,_transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0B0B1A] to-transparent" />
        <div className="absolute top-8 right-4 w-24 h-24 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-black/20 rounded-xl active:scale-90 backdrop-blur-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h2 className="text-xl font-black italic tracking-tighter">BB EDITOR</h2>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50">Creative Workspace</p>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-10 flex-1 space-y-6">
        <div className="bg-[#1C1C2E] rounded-[2.5rem] border border-white/5 shadow-lg flex flex-col h-[350px] sm:h-[450px] md:h-[550px] overflow-hidden">
          {/* Title input */}
          <div className="px-6 pt-6 pb-2">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title (optional)"
              className="w-full bg-[#161b22] border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-purple-500/40 transition-colors placeholder-white/30" />
          </div>

          {/* Tab selector */}
          <div className="flex bg-[#161b22] p-2 mx-6 border border-white/5 rounded-xl">
            <button onClick={() => setPreviewMode(false)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!previewMode ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-white/40'}`}>Write</button>
            <button onClick={() => setPreviewMode(true)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${previewMode ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-white/40'}`}>Preview</button>
          </div>

          {/* Toolbar */}
          {!previewMode && (
            <div className="px-6 py-3 border-b border-[#30363d] flex gap-2 overflow-x-auto no-scrollbar">
              {toolbarButtons.map(btn => (
                <button key={btn.label} onClick={() => insertTag(btn.tag, btn.placeholder)}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-[#161b22] border border-white/5 text-white/40 text-[11px] font-black hover:border-purple-500/30 hover:text-purple-400 transition-all active:scale-90" title={btn.label}>
                  {btn.icon}
                </button>
              ))}
              <button onClick={insertColor}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-[#161b22] border border-white/5 text-[11px] font-black hover:border-purple-500/30 transition-all active:scale-90">🎨</button>
            </div>
          )}

          {/* Editor */}
          <div className="flex-1 relative overflow-y-auto">
            <AnimatePresence mode="wait">
              {previewMode ? (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-6 text-[13px] text-gray-300 leading-relaxed min-h-full">
                  <BBCodeParser rawText={content || "[i]No content to preview...[/i]"} />
                </motion.div>
              ) : (
                <motion.textarea key="editor" ref={textareaRef} value={content} onChange={e => setContent(e.target.value)}
                  placeholder="Express your thoughts with BBCode... Use buttons above to format!"
                  className="w-full h-full p-6 text-[14px] font-medium text-gray-200 bg-transparent border-none outline-none resize-none" />
              )}
            </AnimatePresence>
          </div>

          {/* Bottom actions */}
          <div className="p-6 bg-[#161b22] border-t border-white/5 flex items-center justify-between">
            <button onClick={() => navigate('/bb-guide')}
              className="text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-purple-400 transition-colors">📖 BBCode Guide</button>
            <button onClick={handlePublish} disabled={!content.trim() || publishing}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3.5 rounded-2xl shadow-xl shadow-purple-900/30 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 hover:opacity-90">
              {publishing ? 'Publishing...' : 'Publish Post 🚀'}
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-[#090d16]/80 backdrop-blur-xl border border-[#30363d] shadow-xl shadow-purple-900/10 rounded-[2.5rem] p-6 relative overflow-hidden">
          <h4 className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <span className="text-lg">💡</span> Pro Tip
          </h4>
          <p className="text-[11px] text-white/50 font-medium leading-relaxed">
            You can use the [color] tag to make your posts stand out! Try combinations like
            [b][color=#FF0000]RED TEXT[/color][/b] to grab attention in the feed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BBCodeEditor;
