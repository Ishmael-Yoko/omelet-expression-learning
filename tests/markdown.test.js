const test = require('node:test');
const assert = require('node:assert/strict');
const { renderMarkdown } = require('../lib/markdown');

test('renderMarkdown renders common markdown blocks', () => {
  const html = renderMarkdown('# 标题\n\n- 一\n- 二\n\n**重点** `code`');

  assert.match(html, /<h1>标题<\/h1>/);
  assert.match(html, /<li>一<\/li>/);
  assert.match(html, /<strong>重点<\/strong>/);
  assert.match(html, /<code>code<\/code>/);
});

test('renderMarkdown strips raw HTML and script content as executable markup', () => {
  const html = renderMarkdown('# 安全\n\n<script>alert(1)</script>\n<img src=x onerror=alert(1)>');

  assert.equal(html.includes('<script>'), false);
  assert.equal(html.includes('onerror'), false);
  assert.equal(html.includes('<img'), false);
  assert.equal(html.includes('&lt;script'), false);
});

test('renderMarkdown sanitizes dangerous links', () => {
  const html = renderMarkdown('[bad](javascript:alert(1))\n\n[ok](https://example.com)');

  assert.equal(html.includes('javascript:'), false);
  assert.match(html, /href="https:\/\/example\.com"/);
});

test('renderMarkdown handles empty input', () => {
  assert.equal(renderMarkdown(''), '');
  assert.equal(renderMarkdown(null), '');
});
