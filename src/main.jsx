import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const savedTheme = localStorage.getItem('theme') || 'light';

if (!localStorage.getItem('theme')) {
  localStorage.setItem('theme', savedTheme);
}

document.documentElement.classList.toggle('dark', savedTheme === 'dark');
document.documentElement.style.colorScheme = savedTheme;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
