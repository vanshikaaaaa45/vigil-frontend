// Global toast notification system
// Usage: import { toast } from '../utils/toast'
// toast.success('Monitor created!')
// toast.error('Something went wrong')
// toast.info('Copied to clipboard')
// toast.warn('Near plan limit')

let container = null;

const getContainer = () => {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
};

const show = (message, type = 'info', duration = 3000) => {
  const c = getContainer();
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;

  const icons = {
    success: '✓',
    error:   '✕',
    info:    'ℹ',
    warn:    '⚠',
  };

  el.innerHTML = `
    <span style="font-size:14px;flex-shrink:0">${icons[type] || 'ℹ'}</span>
    <span>${message}</span>
  `;

  c.appendChild(el);

  setTimeout(() => {
    el.style.animation = 'toastIn .2s cubic-bezier(.16,1,.3,1) reverse';
    setTimeout(() => el.remove(), 200);
  }, duration);
};

export const toast = {
  success: (msg, d) => show(msg, 'success', d),
  error:   (msg, d) => show(msg, 'error',   d),
  info:    (msg, d) => show(msg, 'info',    d),
  warn:    (msg, d) => show(msg, 'warn',    d),
};