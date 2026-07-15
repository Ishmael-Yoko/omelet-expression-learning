const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { ELEMENT_IDS, getAppElements, getRequiredElement } = require('../src/app-elements');

function createDocument(ids = Object.values(ELEMENT_IDS)) {
  const html = ids.map(id => `<div id="${id}"></div>`).join('');
  return new JSDOM(html).window.document;
}

test('getAppElements returns every required main page element', () => {
  const document = createDocument();

  const elements = getAppElements(document);

  assert.deepEqual(Object.keys(elements), Object.keys(ELEMENT_IDS));
  Object.entries(ELEMENT_IDS).forEach(([key, id]) => {
    assert.equal(elements[key].id, id);
  });
});

test('getRequiredElement throws a clear error for missing elements', () => {
  const document = createDocument([]);

  assert.throws(
    () => getRequiredElement(document, 'missing-id'),
    /Missing required element: #missing-id/,
  );
});

test('getAppElements fails fast when a required element is absent', () => {
  const missingId = ELEMENT_IDS.btnStart;
  const document = createDocument(Object.values(ELEMENT_IDS).filter(id => id !== missingId));

  assert.throws(
    () => getAppElements(document),
    new RegExp(`Missing required element: #${missingId}`),
  );
});
