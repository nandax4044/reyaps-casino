import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Suppress benign Dev WebSocket and HMR errors that occur when HMR is disabled or sandboxed
if (typeof window !== 'undefined') {
  const ignorePhrases = [
    'WebSocket',
    'websocket',
    'failed to connect',
    'HMR',
    'sockjs',
    'web-socket'
  ];

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || String(event.reason || '');
    if (ignorePhrases.some(phrase => reason.includes(phrase))) {
      event.preventDefault();
      event.stopPropagation();
      console.info('[HMR Bypassed] Ignored expected websocket disconnection:', reason);
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (ignorePhrases.some(phrase => msg.includes(phrase))) {
      event.preventDefault();
      event.stopPropagation();
      console.info('[HMR Bypassed] Ignored expected websocket error:', msg);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
