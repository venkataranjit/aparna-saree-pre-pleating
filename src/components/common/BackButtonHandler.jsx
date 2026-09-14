import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { toast } from 'react-toastify';

/**
 * Handles Android hardware back button presses within the Capacitor APK.
 * 
 * Hierarchy of actions on Back Button press:
 * 1. Closes any open modal/dialog/backdrop currently active in DOM.
 * 2. Navigates back in React Router history if on a sub-route.
 * 3. If on root pages ('/' or '/dashboard'), implements a native double-tap-to-exit pattern.
 */
export default function BackButtonHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastBackPressRef = useRef(0);
  const locationRef = useRef(location);

  // Keep locationRef current so the async listener always reads the latest route
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let backListenerHandle = null;

    const setupListener = async () => {
      try {
        backListenerHandle = await CapApp.addListener('backButton', () => {
          // 1. Check if any modal is currently open in the DOM
          const modalCloseButtons = document.querySelectorAll(
            '.app-modal-close, .modal-close, [aria-label="Close"], .MuiDialog-container button[aria-label="close"], .MuiModal-root .MuiBackdrop-root'
          );
          if (modalCloseButtons && modalCloseButtons.length > 0) {
            const lastCloseButton = modalCloseButtons[modalCloseButtons.length - 1];
            if (lastCloseButton && typeof lastCloseButton.click === 'function') {
              lastCloseButton.click();
              return;
            }
          }

          const currentPath = locationRef.current.pathname;

          // 2. Check if we are on a root page
          const isRootPage =
            currentPath === '/' ||
            currentPath === '/dashboard' ||
            currentPath === '/dashboard/' ||
            currentPath === '/dashboard/overview';

          if (!isRootPage) {
            // Check if there is history to go back to
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              // Direct navigation fallback
              if (currentPath.startsWith('/dashboard')) {
                navigate('/dashboard', { replace: true });
              } else {
                navigate('/', { replace: true });
              }
            }
            return;
          }

          // 3. We are on a root page -> handle double press to exit
          const now = Date.now();
          if (now - lastBackPressRef.current < 2000) {
            CapApp.exitApp();
          } else {
            lastBackPressRef.current = now;
            toast.info('Press back again to exit', {
              toastId: 'app-exit-toast',
              autoClose: 2000,
              position: 'bottom-center',
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: false,
              theme: 'dark',
              style: {
                borderRadius: '12px',
                background: 'rgba(20, 17, 12, 0.95)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                color: '#fde68a',
                fontSize: '0.85rem',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              },
            });
          }
        });
      } catch (err) {
        console.warn('[BackButtonHandler] Failed to register backButton listener:', err);
      }
    };

    setupListener();

    return () => {
      if (backListenerHandle && typeof backListenerHandle.remove === 'function') {
        backListenerHandle.remove();
      }
    };
  }, [navigate]);

  return null;
}
