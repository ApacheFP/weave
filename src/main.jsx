import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { installChunkRecovery } from './chunkRecovery.js';
import './styles.css';
import './onboarding.css';

installChunkRecovery(window);

createRoot(document.getElementById('root')).render(<App />);
