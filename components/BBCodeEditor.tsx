
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BBCodeParser } from './BBCodeParser';

interface BBCodeEditorProps {
  initialValue?: string;
  onPublish: (content: string) => void;
  title: string;
}

const BBCodeEditor: React.FC<BBCodeEditorProps> = ({ initialValue = "", onPublish, title }) => {
  const [content, setContent] = useState(initialValue);
  const [view, setView] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (tag: string, value: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let textToInsert = "";
    if (tag.includes('=')) {
      const [tagName] = tag.split('=');
      textToInsert = `[${tag}]${selectedText || value}[/${tagName}]`;
    } else {
      textToInsert = `[${tag}]${selectedText || value}[/${tag}]`;
    }

    const newContent = content.substring(0, start) + textToInsert + content.substring(end);
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      const pos = start + textToInsert.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  const toolbar = [
    { icon: 'B', tag: 'b', label: 'Bold' },
    { icon: 'I', tag: 'i', label: 'Italic' },
    { icon: 'U', tag: 'u', label: 'Underline' },
    { icon: '🎯', tag: 'center', label: 'Center' },
    { icon: 'H', tag: 'big', label: 'Big' },
    { icon: '🎨', tag: 'clr=#7F00FF', label: 'Color' },
    { icon: '🖼️', tag: 'img', value: 'https://', label: 'Image' },
    { icon: '📸', tag: 'sphoto', value: 'https://', label: 'S-Photo' },
  ];

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col ring-1 ring-purple-50">
      {/* TOOLBAR */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar pb-1">
          {toolbar.map(btn => (
            <button 
              key={btn.label}
              onClick={() => insertTag(btn.tag, btn.value)}
              className="w-10 h-10 shrink-0 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black text-slate-600 hover:border-purple-400 hover:text-purple-600 transition-all active:scale-90 shadow-sm"
            >
              {btn.icon}
            </button>
          ))}
        </div>
        <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-inner ml-4 shrink-0">
          <button onClick={() => setView('write')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'write' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Write</button>
          <button onClick={() => setView('preview')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'preview' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Preview</button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 relative bg-white">
        <AnimatePresence mode="wait">
          {view === 'write' ? (
            <motion.textarea
              key="write"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Construct your thoughts with BBCode..."
              className="w-full h-full p-8 text-sm font-bold text-slate-700 bg-transparent outline-none resize-none leading-relaxed no-scrollbar"
            />
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full h-full p-8 overflow-y-auto bg-slate-50/30"
            >
              <div className="bbcode-render prose prose-purple max-w-none">
                <BBCodeParser rawText={content || "[i]Visualizing content...[/i]"} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER */}
      <div className="p-6 bg-slate-900 border-t border-white/5 flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest">Character Metrics</p>
          <p className="text-xs font-mono text-purple-400 font-black">{content.length} chars</p>
        </div>
        <button 
          onClick={() => onPublish(content)}
          disabled={!content.trim()}
          className="bg-[#7F00FF] text-white px-10 py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 disabled:opacity-30 transition-all"
        >
          Publish 🚀
        </button>
      </div>
    </div>
  );
};

export default BBCodeEditor;

