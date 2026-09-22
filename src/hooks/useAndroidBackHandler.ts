/**
 * Android System Back Button & Escape Key Navigation Handler
 * Hierarchy:
 * 1. Open Modal -> Close active modal
 * 2. Active Subscreen (Create Post / Share Confirmation) -> Return to previous screen
 * 3. Non-home Tab -> Return to Home
 * 4. Root Home Screen -> Standard system behavior
 */

import { useEffect, useCallback } from 'react';
import { logger } from '../services/logger';

export interface BackHandlerState {
  hasOpenModal: boolean;
  onCloseModal?: () => void;
  isSubscreen: boolean;
  onExitSubscreen?: () => void;
  activeTab: string;
  onGoHome?: () => void;
}

export function useAndroidBackHandler({
  hasOpenModal,
  onCloseModal,
  isSubscreen,
  onExitSubscreen,
  activeTab,
  onGoHome
}: BackHandlerState) {
  const handleBackAction = useCallback(() => {
    logger.debug('Android back action triggered', { hasOpenModal, isSubscreen, activeTab });

    // 1. Highest priority: Close modal if open
    if (hasOpenModal && onCloseModal) {
      onCloseModal();
      return true;
    }

    // 2. Second priority: Exit subscreen
    if (isSubscreen && onExitSubscreen) {
      onExitSubscreen();
      return true;
    }

    // 3. Third priority: Return to Home if on another tab
    if (activeTab !== 'home' && onGoHome) {
      onGoHome();
      return true;
    }

    // 4. At root: Allow natural system behavior
    return false;
  }, [hasOpenModal, onCloseModal, isSubscreen, onExitSubscreen, activeTab, onGoHome]);

  useEffect(() => {
    // Listen for Escape key on desktop/keyboard
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const handled = handleBackAction();
        if (handled) {
          e.preventDefault();
        }
      }
    };

    // Push a dummy state to browser history when entering a modal or subscreen
    // so hardware back button pops history rather than exiting webview
    const hasActiveLayer = hasOpenModal || isSubscreen || activeTab !== 'home';
    if (hasActiveLayer && typeof window !== 'undefined') {
      window.history.pushState({ sssLayer: true }, '');
    }

    const handlePopState = (e: PopStateEvent) => {
      const handled = handleBackAction();
      if (!handled && hasActiveLayer) {
        // Keep history stack stable
        window.history.pushState({ sssLayer: true }, '');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleBackAction, hasOpenModal, isSubscreen, activeTab]);
}
