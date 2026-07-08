
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BBCodeParser } from '../components/BBCodeParser';

const BBCodeGuide: React.FC = () => {
  const navigate = useNavigate();

  const tags = [
    { tag: '[b]Text[/b]', desc: 'Bold text', example: '[b]Bold Text[/b]' },
    { tag: '[i]Text[/i]', desc: 'Italic text', example: '[i]Italic Text[/i]' },
    { tag: '[u]Text[/u]', desc: 'Underline text', example: '[u]Underlined[/u]' },
    { tag: '[center]Text[/center]', desc: 'Center align', example: '[center]Centered Content[/center]' },
    { tag: '[quote]Text[/quote]', desc: 'Quote block', example: '[quote]Quoted Message[/quote]' },
    { tag: '[url=link]Text[/url]', desc: 'Link to website', example: '[url=https://google.com]Click Me[/url]' },
    { tag: '[img]URL[/img]', desc: 'Embed an image', example: '[img]https://picsum.photos/seed/bb/200/100[/img]' },
    { tag: '[color=hex]Text[/color]', desc: 'Change text color', example: '[color=#7F00FF]Purple Text[/color]' },
    { tag: '[size=px]Text[/size]', desc: 'Change font size', example: '[size=18px]Large Text[/size]' },
  ];

  return (
    <div className="min-h-screen bg-transparent pb-24 font-inter">
      <header className="bg-purple-600 text-white p-4 sm:p-6 pb-16 sm:pb-20 rounded-b-[2rem] sm:rounded-b-[3.5rem] flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate(-1)} className="p-2 bg-purple-500 rounded-xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h2 className="text-xl font-black italic tracking-tighter">BBCODE GUIDE</h2>
          <p className="text-xs font-black uppercase opacity-60">Master the formatting</p>
        </div>
      </header>

      <div className="px-5 -mt-10 space-y-6">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="p-5">BBCode Tag</th>
                  <th className="p-5">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tags.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-5">
                      <code className="text-xs sm:text-sm font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md">{item.tag}</code>
                      <p className="text-xs text-slate-400 mt-1 uppercase font-bold">{item.desc}</p>
                    </td>
                    <td className="p-5">
                      <div className="text-xs sm:text-sm font-medium text-slate-700">
                        <BBCodeParser rawText={item.example} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
           <div className="absolute -top-10 -right-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
           <h4 className="text-xs font-black uppercase tracking-widest mb-2 relative z-10">Complex Example</h4>
           <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 relative z-10">
              <p className="text-xs sm:text-sm font-mono text-purple-300 mb-4 whitespace-pre-wrap">
                [center][b][size=20px]GRAND TOURNAMENT![/size][/b][/center]
                [quote]Join the battle this weekend and win [color=#FFD700]GOLD COINS![/color][/quote]
              </p>
              <div className="bg-white p-4 rounded-xl text-slate-800 text-xs sm:text-sm">
                <BBCodeParser rawText="[center][b][size=18px]GRAND TOURNAMENT![/size][/b][/center]\n[quote]Join the battle this weekend and win [color=#FFD700]GOLD COINS![/color][/quote]" />
              </div>
           </div>
           <button onClick={() => navigate('/bb-editor')} className="w-full bg-purple-600 text-white font-black py-4 rounded-2xl text-xs sm:text-sm uppercase tracking-widest shadow-xl">Try Editor Now 🚀</button>
        </div>
      </div>
    </div>
  );
};

export default BBCodeGuide;

