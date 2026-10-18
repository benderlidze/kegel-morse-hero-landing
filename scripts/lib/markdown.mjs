// Minimal markdown renderer for the article bodies (same output shape as scripts/build-blog.mjs, but language-aware:
// unicode-safe heading ids, configurable table label, and a hook to rewrite internal links to localized URLs).
export function createRenderer({ site, appStore, tableLabel = 'Scrollable data table', mapHref = (href) => href }) {
  const esc = (value = '') => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const plain = (value = '') => value.replace(/[*_`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  const idFor = (value) => plain(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');

  function inline(source) {
    const tokens = [];
    let value = source.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      let url = href;
      if (/apps\.apple\.com\/.+id6761460873/.test(url)) url = appStore;
      if (url.startsWith(site)) url = url.slice(site.length) || '/';
      url = mapHref(url);
      const external = /^https?:\/\//.test(url);
      const english = !external && /^\/articles\//.test(url) ? ' hreflang="en" lang="en"' : '';
      tokens.push(`<a href="${esc(url)}"${external ? ' target="_blank" rel="noopener"' : ''}${english}>${esc(label)}</a>`);
      return `\u0000${tokens.length - 1}\u0000`;
    });
    value = esc(value)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
    return value;
  }

  function markdown(body) {
    const lines = body.split('\n');
    const output = [];
    const headings = [];
    const usedIds = new Set();
    let paragraph = [];
    let list = null;

    const flushParagraph = () => {
      if (!paragraph.length) return;
      const text = paragraph.join(' ');
      const isCta = /Kegel Morse Hero/.test(text) && /App Store|kegelmorsehero\.com/.test(text);
      output.push(`<p${isCta ? ' class="article-cta"' : ''}>${inline(text)}</p>`);
      paragraph = [];
    };
    const flushList = () => {
      if (!list) return;
      output.push(`<${list.type}>${list.items.map((item) => `<li>${inline(item)}</li>`).join('')}</${list.type}>`);
      list = null;
    };
    const flush = () => { flushParagraph(); flushList(); };

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trimEnd();
      if (!line.trim()) { flush(); continue; }
      if (/^#\s+/.test(line)) { flush(); continue; }
      const heading = line.match(/^(##|###)\s+(.+)$/);
      if (heading) {
        flush();
        const level = heading[1].length;
        const text = heading[2];
        let id = idFor(text) || `section-${headings.length + 1}`;
        while (usedIds.has(id)) id += '-2';
        usedIds.add(id);
        if (level === 2) headings.push({ text: plain(text), id });
        output.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
        continue;
      }
      if (line.startsWith('> ')) {
        flush();
        output.push(`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`);
        continue;
      }
      const bullet = line.match(/^[-*]\s+(.+)$/);
      const numbered = line.match(/^\d+\.\s+(.+)$/);
      if (bullet || numbered) {
        flushParagraph();
        const type = numbered ? 'ol' : 'ul';
        if (list && list.type !== type) flushList();
        if (!list) list = { type, items: [] };
        list.items.push((bullet || numbered)[1]);
        continue;
      }
      if (line.startsWith('|') && lines[i + 1]?.trim().match(/^\|?\s*:?-{3,}/)) {
        flush();
        const rows = [];
        const splitRow = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
        const header = splitRow(line);
        i += 2;
        while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(splitRow(lines[i])); i += 1; }
        i -= 1;
        output.push(`<div class="table-wrap" role="region" aria-label="${esc(tableLabel)}" tabindex="0"><table><thead><tr>${header.map((cell) => `<th scope="col">${inline(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
        continue;
      }
      paragraph.push(line.trim());
    }
    flush();
    return { html: output.join('\n'), headings };
  }

  return { markdown, inline, esc, plain };
}

export function parseFrontMatter(source) {
  const normalized = source.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Missing front matter');
  const data = {};
  for (const line of match[1].split('\n')) {
    const field = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!field) continue;
    let value = field[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    data[field[1]] = value;
  }
  return { data, body: match[2].trim() };
}
