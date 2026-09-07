import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import theme from './dashboard/theme/theme';
import './firebase/config';
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('capacitor-native');
  document.body.classList.add('capacitor-native');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          style={{ zIndex: 99999 }}
        />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
