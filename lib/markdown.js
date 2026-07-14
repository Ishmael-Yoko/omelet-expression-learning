const MarkdownIt = require('markdown-it');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});
const windowForPurify = new JSDOM('').window;
const DOMPurify = createDOMPurify(windowForPurify);

function normalizeMarkdown(markdown) {
  return String(markdown || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s)]+)/gi, '')
    .replace(/javascript\s*:/gi, '');
}

function renderMarkdown(markdown) {
  return DOMPurify.sanitize(md.render(normalizeMarkdown(markdown)));
}

module.exports = {
  normalizeMarkdown,
  renderMarkdown,
};
