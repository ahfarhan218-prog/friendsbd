/**
 * Professional Markdown and BBCode to HTML Parsing Engine
 * Supports headers, bold, italic, blockquotes, inline/block code, links, images, highlights, @mentions,
 * and all legacy BBCode formats.
 */
export const parseMarkdown = (text: string): string => {
  if (!text) return "";

  // 1. Escaping to prevent XSS (escapes raw HTML tags)
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // 2. Code Blocks (```lang ... ```) - parse first to prevent internal markdown/bbcode parsing
  const codeBlocks: string[] = [];
  html = html.replace(/```([\s\S]*?)```/gm, (match, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(
      `<pre class="bg-[#090d16] border border-[#1f293d] p-4 rounded-2xl overflow-x-auto text-xs font-mono text-slate-300 my-4"><code>${code.trim()}</code></pre>`
    );
    return placeholder;
  });

  // 3. Inline Code (`code`)
  const inlineCodes: string[] = [];
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
    inlineCodes.push(
      `<code class="bg-[#090d16] border border-[#1f293d] px-1.5 py-0.5 rounded-md font-mono text-purple-400 text-[11px]">${code}</code>`
    );
    return placeholder;
  });

  // 4. LEGACY BBCODE PARSING RULES (stylized for dark mode)
  html = html.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>");
  html = html.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>");
  html = html.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>");
  html = html.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, "<div class='text-center w-full'>$1</div>");
  html = html.replace(/\[big\]([\s\S]*?)\[\/big\]/gi, "<span class='text-base font-black text-white tracking-tight leading-tight block my-3'>$1</span>");
  
  // BBCode Quote (with optional author)
  html = html.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, "<blockquote class='bg-[#090d16]/40 border-l-2 border-indigo-500 pl-3 py-1.5 rounded-r-xl italic text-slate-400 my-2'>$1</blockquote>");
  html = html.replace(/\[quote=(.*?)\]([\s\S]*?)\[\/quote\]/gi, "<blockquote class='bg-[#090d16]/40 border-l-2 border-indigo-500 pl-3 py-1.5 rounded-r-xl italic text-slate-400 my-2'><span class='block text-[9px] font-black uppercase text-indigo-400 mb-1'>$1 wrote:</span>$2</blockquote>");
  
  // URL and Image BBCode
  html = html.replace(/\[url=(.*?)\]([\s\S]*?)\[\/url\]/gi, "<a href='$1' target='_blank' rel='noopener noreferrer' class='text-purple-400 font-bold hover:underline transition-all inline-flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20'>🔗 $2</a>");
  html = html.replace(/\[img\]([\s\S]*?)\[\/img\]/gi, "<img src='$1' alt='BBCode image' class='max-w-full rounded-2xl border border-[#1f293d] my-3 shadow-lg' />");
  
  // Framed Photo BBCode (sphoto)
  html = html.replace(/\[sphoto\]([\s\S]*?)\[\/sphoto\]/gi, `
    <div class='my-6 p-1 bg-gradient-to-tr from-amber-400 via-purple-500 to-rose-500 rounded-[2rem] shadow-xl max-w-sm mx-auto'>
      <img src='$1' class='w-full rounded-[1.8rem] border-2 border-white' style='margin:0' />
    </div>
  `);
  html = html.replace(/\[sphoto=(.*?)\]\[\/sphoto\]/gi, `
    <div class='my-6 p-1 bg-gradient-to-tr from-amber-400 via-purple-500 to-rose-500 rounded-[2rem] shadow-xl max-w-sm mx-auto'>
      <img src='$1' class='w-full rounded-[1.8rem] border-2 border-white' style='margin:0' />
    </div>
  `);
  
  // Custom Color and Topic link tags
  html = html.replace(/\[clr=(.*?)\]([\s\S]*?)\[\/clr\]/gi, "<span style='color: $1'>$2</span>");
  html = html.replace(/\[topic=(.*?)\]([\s\S]*?)\[\/topic\]/gi, "<a href='#/forum/thread/$1' class='bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-xl font-black hover:bg-indigo-500/20 transition-all inline-flex items-center gap-2 my-1 shadow-sm border border-indigo-500/20'>🔗 $2</a>");

  // 5. STANDARD MARKDOWN PARSING RULES
  // Headers (# Heading)
  html = html.replace(/^### (.*?)$/gm, "<h3 class='text-sm font-black text-white mt-4 mb-2'>$1</h3>");
  html = html.replace(/^## (.*?)$/gm, "<h2 class='text-base font-black text-white mt-5 mb-2'>$1</h2>");
  html = html.replace(/^# (.*?)$/gm, "<h1 class='text-lg font-black text-white mt-6 mb-3'>$1</h1>");

  // Blockquotes (> Quote)
  html = html.replace(/^\s*&gt;\s+(.*?)$/gm, "<blockquote class='bg-[#090d16]/40 border-l-2 border-indigo-500 pl-3 py-1.5 rounded-r-xl italic text-slate-400 my-2'>$1</blockquote>");

  // Bold & Italic
  html = html.replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([\s\S]*?)__/g, "<strong>$1</strong>");
  html = html.replace(/\*([\s\S]*?)\*/g, "<em>$1</em>");
  html = html.replace(/_([\s\S]*?)_/g, "<em>$1</em>");

  // Highlights (==text==) -> renders as modern glowing badge bubble
  html = html.replace(/==([^=]+)==/g, "<mark class='bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-semibold text-xs shadow-sm'>$1</mark>");

  // Images (![alt](url))
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "<img src='$2' alt='$1' class='max-w-full rounded-2xl border border-[#1f293d] my-3 shadow-lg' />");

  // Links ([label](url))
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' target='_blank' rel='noopener noreferrer' class='text-purple-400 font-bold hover:underline transition-all inline-flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20'>🔗 $1</a>");

  // Mentions (@username)
  html = html.replace(/(?<!\w)@(\w+)/g, "<a href='#/profile/$1' class='text-indigo-400 font-bold hover:underline decoration-2 transition-all'>@$1</a>");

  // Unordered lists
  html = html.replace(/^\s*-\s+(.*?)$/gm, "<li class='list-disc list-inside ml-4 my-1 text-slate-300'>$1</li>");

  // 6. Restore Inline Code & Code Blocks
  inlineCodes.forEach((codeHTML, idx) => {
    html = html.replace(`__INLINE_CODE_${idx}__`, codeHTML);
  });
  codeBlocks.forEach((codeHTML, idx) => {
    html = html.replace(`__CODE_BLOCK_${idx}__`, codeHTML);
  });

  // 7. Convert remaining line breaks to paragraph formatting
  const lines = html.split("\n");
  if (lines.length > 1) {
    return lines
      .map(line => {
        const trimmed = line.trim();
        if (trimmed === "") return "<div class='h-4'></div>";
        // If it's already an HTML block element (pre, h1, h2, h3, blockquote, li, div), don't wrap
        if (trimmed.startsWith("<pre") || trimmed.startsWith("<h") || trimmed.startsWith("<blockquote") || trimmed.startsWith("<li") || trimmed.startsWith("<div") || trimmed.startsWith("<a")) {
          return line;
        }
        return `<div class='my-1.5 leading-relaxed text-slate-300 text-xs'>${line}</div>`;
      })
      .join("");
  }

  return html;
};
