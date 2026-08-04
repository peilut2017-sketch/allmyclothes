import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { applyTheme, getTheme, watchSystemTheme } from './lib/theme';
import './index.css';

applyTheme(getTheme());
watchSystemTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
