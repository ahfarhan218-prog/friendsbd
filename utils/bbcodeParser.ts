
/**
 * Professional BBCode to HTML Transformation Engine (v5.1)
 * Optimized for layout stability and WAP-legacy stylized elements.
 */
export const parseBBCode = (text: string): string => {
  if (!text) return "";

  // 1. Escaping to prevent XSS
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // 2. Formatting Rules Mapping
  const rules: [RegExp, string][] = [
    [/(?<!\w)@(\w+)/g, "<a href='#/profile/$1' class='text-purple-400 font-black hover:underline decoration-2 transition-all'>@$1</a>"],
    [/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' class='text-purple-400 font-bold hover:underline transition-all inline-flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20'>🔗 $1</a>"],
    [/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>"],
    [/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>"],
    [/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>"],
    [/\[center\]([\s\S]*?)\[\/center\]/gi, "<div class='text-center w-full'>$1</div>"],
    
    // TYPOGRAPHY UPGRADES
    [/\[big\]([\s\S]*?)\[\/big\]/gi, "<span class='text-xl font-black text-slate-900 tracking-tight leading-tight block my-3'>$1</span>"],
    
    // Enhanced Quote with optional author
    [/\[quote\]([\s\S]*?)\[\/quote\]/gi, "<blockquote>$1</blockquote>"],
    [/\[quote=(.*?)\]([\s\S]*?)\[\/quote\]/gi, "<blockquote><span class='block text-[10px] font-black uppercase text-purple-600 mb-2'>$1 wrote:</span>$2</blockquote>"],
    
    [/\[url=(.*?)\]([\s\S]*?)\[\/url\]/gi, "<a href='$1' target='_blank' rel='noopener noreferrer'>$2</a>"],
    [/\[img\]([\s\S]*?)\[\/img\]/gi, "<img src='$1' alt='Content image' />"],
    
    // Stylized framed photo
    [/\[sphoto\]([\s\S]*?)\[\/sphoto\]/gi, `
      <div class='my-6 p-1 bg-gradient-to-tr from-amber-400 via-purple-500 to-rose-500 rounded-[2rem] shadow-xl max-w-sm mx-auto'>
        <img src='$1' class='w-full rounded-[1.8rem] border-2 border-white' style='margin:0' />
      </div>
    `],
    [/\[sphoto=(.*?)\]\[\/sphoto\]/gi, `
      <div class='my-6 p-1 bg-gradient-to-tr from-amber-400 via-purple-500 to-rose-500 rounded-[2rem] shadow-xl max-w-sm mx-auto'>
        <img src='$1' class='w-full rounded-[1.8rem] border-2 border-white' style='margin:0' />
      </div>
    `],
    
    // PREMIUM CUSTOM TAGS
    [/\[clr=(.*?)\]([\s\S]*?)\[\/clr\]/gi, "<span style='color: $1'>$2</span>"],
    [/\[topic=(.*?)\]([\s\S]*?)\[\/topic\]/gi, "<a href='#/forum/thread/$1' class='bg-purple-100 text-purple-700 px-4 py-2 rounded-2xl font-black hover:bg-purple-200 transition-all inline-flex items-center gap-2 my-1 shadow-sm border border-purple-200' style='border-bottom:none'>🔗 $2</a>"],
  ];

  rules.forEach(([regex, replacement]) => {
    html = html.replace(regex, replacement);
  });

  // 3. Safe Handling for forced line breaks
  const lines = html.split('\n');
  if (lines.length > 1) {
    return lines.map(line => {
      const trimmed = line.trim();
      if (trimmed === "") return "<div class='h-4'></div>";
      return `<div class='bb-para'>${line}</div>`;
    }).join('');
  }

  return html;
};
