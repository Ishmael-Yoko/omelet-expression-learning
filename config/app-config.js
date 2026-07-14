const path = require('path');

const APP_DISPLAY_NAME = 'omelet-表达训练系统';
const APP_PACKAGE_NAME = 'omelet-expression-trainer';
const REPORT_FILE_PREFIX = 'omelet-表达训练';

function getRendererPath(...segments) {
  return path.join(__dirname, '..', 'src', ...segments);
}

module.exports = {
  APP_DISPLAY_NAME,
  APP_PACKAGE_NAME,
  REPORT_FILE_PREFIX,
  WINDOW_CONFIG: {
    main: {
      width: 1200,
      height: 800,
      backgroundColor: '#101113',
      titleBarStyle: 'hiddenInset',
      title: APP_DISPLAY_NAME,
    },
    settings: {
      width: 600,
      height: 500,
      resizable: false,
      backgroundColor: '#17191C',
      titleBarStyle: 'hiddenInset',
      title: `${APP_DISPLAY_NAME} - 设置`,
    },
    promptEditor: {
      width: 720,
      height: 700,
      resizable: true,
      backgroundColor: '#17191C',
      titleBarStyle: 'hiddenInset',
      title: `${APP_DISPLAY_NAME} - 训练规则`,
    },
  },
  getRendererPath,
};
