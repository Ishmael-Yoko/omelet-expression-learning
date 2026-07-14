const { safeStorage } = require('electron');

const ENCRYPTED_PREFIX = 'enc:v1:';

function canEncrypt() {
  return Boolean(safeStorage && safeStorage.isEncryptionAvailable());
}

function encryptSecret(value) {
  if (!value) {
    return '';
  }
  if (!canEncrypt()) {
    throw new Error('System credential encryption is not available.');
  }

  const encrypted = safeStorage.encryptString(value);
  return `${ENCRYPTED_PREFIX}${encrypted.toString('base64')}`;
}

function decryptSecret(value) {
  if (!value) {
    return '';
  }
  if (!value.startsWith(ENCRYPTED_PREFIX)) {
    return value;
  }
  if (!canEncrypt()) {
    throw new Error('System credential encryption is not available.');
  }

  const encoded = value.slice(ENCRYPTED_PREFIX.length);
  return safeStorage.decryptString(Buffer.from(encoded, 'base64'));
}

function maskSecret(value) {
  if (!value) {
    return '';
  }
  const visible = value.slice(-4);
  return `****${visible}`;
}

module.exports = {
  canEncrypt,
  decryptSecret,
  encryptSecret,
  maskSecret,
};
