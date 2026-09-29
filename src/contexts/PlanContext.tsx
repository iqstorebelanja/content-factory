import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { usePlan, UsePlanReturn } from '../hooks/usePlan';
import { UpgradeModal } from '../components/UpgradeModal';

interface PlanContextType extends UsePlanReturn {
  openUpgradeModal: (featureName?: string, reason?: string) => void;
  closeUpgradeModal: () => void;
}

const PlanContext = createContext<PlanContextType | null>(null);

interface PlanProviderProps {
  children: ReactNode;
  onNavigateToPlans?: () => void;
}

export const PlanProvider: React.FC<PlanProviderProps> = ({ children, onNavigateToPlans }) => {
  const planState = usePlan();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    featureName?: string;
    reason?: string;
  }>({
    isOpen: false
  });

  const openUpgradeModal = useCallback((featureName?: string, reason?: string) => {
    setModalState({
      isOpen: true,
      featureName,
      reason
    });
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <PlanContext.Provider
      value={{
        ...planState,
        openUpgradeModal,
        closeUpgradeModal
      }}
    >
      {children}

      {/* Global Upgrade Modal (FREE + PRO Only) */}
      <UpgradeModal
        isOpen={modalState.isOpen}
        onClose={closeUpgradeModal}
        currentPlan={planState.plan}
        featureName={modalState.featureName}
        reason={modalState.reason}
        onSelectFreePlan={planState.selectFreePlan}
        onNavigateToPlans={() => {
          closeUpgradeModal();
          onNavigateToPlans?.();
        }}
      />
    </PlanContext.Provider>
  );
};

export const usePlanContext = (): PlanContextType => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlanContext must be used within a PlanProvider');
  }
  return context;
};
