const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function getCustomPromptPath() {
  return path.join(app.getPath('userData'), 'custom-prompt.json');
}

function loadCustomPrompt() {
  const promptPath = getCustomPromptPath();
  if (!fs.existsSync(promptPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(promptPath, 'utf-8'));
  } catch {
    return null;
  }
}

function saveCustomPrompt(data) {
  fs.writeFileSync(getCustomPromptPath(), JSON.stringify(data, null, 2));
}

module.exports = {
  getCustomPromptPath,
  loadCustomPrompt,
  saveCustomPrompt,
};
