
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Parses text and converts @username into clickable Links
 */
export const parseMentions = (text: string) => {
  if (!text) return '';
  // Regex to match either @username or [text](url)
  const regex = /(@\w+|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const username = part.substring(1);
      return (
        <Link 
          key={i} 
          to={`/profile/${username}`} 
          className="text-purple-400 font-black hover:underline decoration-2 transition-all"
        >
          {part}
        </Link>
      );
    }
    if (part.startsWith('[') && part.includes('](')) {
      const textMatch = part.match(/\[([^\]]+)\]/);
      const urlMatch = part.match(/\(([^)]+)\)/);
      if (textMatch && urlMatch) {
        const linkText = textMatch[1];
        const linkUrl = urlMatch[1];
        return (
          <Link
            key={i}
            to={linkUrl}
            className="text-purple-400 font-bold hover:underline transition-all inline-flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20"
          >
            🔗 {linkText}
          </Link>
        );
      }
    }
    return part;
  });
};
