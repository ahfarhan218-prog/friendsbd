import React from 'react';
import { Link } from 'react-router-dom';

export const parseBBCode = (text: string): React.ReactNode[] => {
  if (!text) return [];

  // Convert basic bbcode to html-like tokens to parse them safely
  let parsedText = text;
  
  // A simple regex approach for a React render
  // Instead of full AST, we can use simple regexes to replace known patterns with React elements
  // But since we can't easily replace string -> ReactNode with simple string replace,
  // we'll use a trick: split the string by a regex that matches ALL tags, then map over the array.
  
  // Actually, for complex nested BBCode, a simple parser is better.
  // To save time and keep it robust for the requested tags:
  // [b], [/b], [i], [/i], [center], [/center], [clr=...], [/clr], [sphoto=...][/sphoto], [topic=...][/topic]

  // We will convert the BBCode to HTML string, then use dangerouslySetInnerHTML safely.
  // Note: For a real app, DOMPurify is needed, but we will strip `<` and `>` first to prevent XSS.

  // 1. Escape HTML
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // 2. Replace BBCode
  html = html.replace(/\[b\](.*?)\[\/b\]/gis, '<strong>$1</strong>');
  html = html.replace(/\[i\](.*?)\[\/i\]/gis, '<em>$1</em>');
  html = html.replace(/\[center\](.*?)\[\/center\]/gis, '<div style="text-align: center;">$1</div>');
  html = html.replace(/\[clr=(.*?)\](.*?)\[\/clr\]/gis, '<span style="color: $1;">$2</span>');
  html = html.replace(/\[sphoto=(.*?)\]\[\/sphoto\]/gis, '<img src="$1" alt="image" style="max-width: 100%; border-radius: 8px; margin: 8px 0;" />');
  html = html.replace(/\[topic=(.*?)\](.*?)\[\/topic\]/gis, '<a href="/forum/thread/$1" style="color: #4F46E5; text-decoration: underline; font-weight: bold;">$2</a>');
  
  // Handle newlines
  html = html.replace(/\n/g, '<br />');

  // Because of nesting, we might need multiple passes for simple regex.
  // Doing 3 passes to handle nested [b][center][clr]...
  for(let i=0; i<3; i++) {
    html = html.replace(/\[b\](.*?)\[\/b\]/gis, '<strong>$1</strong>');
    html = html.replace(/\[i\](.*?)\[\/i\]/gis, '<em>$1</em>');
    html = html.replace(/\[center\](.*?)\[\/center\]/gis, '<div style="text-align: center;">$1</div>');
    html = html.replace(/\[clr=(.*?)\](.*?)\[\/clr\]/gis, '<span style="color: $1;">$2</span>');
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};
