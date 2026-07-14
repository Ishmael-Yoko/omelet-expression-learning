const fs = require('fs');
const path = require('path');
const { app, dialog } = require('electron');

async function saveMarkdownFile(parentWindow, content, filename) {
  const result = await dialog.showSaveDialog(parentWindow, {
    title: '保存报告',
    defaultPath: path.join(app.getPath('desktop'), filename),
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  });

  if (result.canceled || !result.filePath) {
    return { success: false };
  }

  fs.writeFileSync(result.filePath, content, 'utf-8');
  return { success: true, path: result.filePath };
}

module.exports = {
  saveMarkdownFile,
};
