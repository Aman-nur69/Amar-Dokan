// ==============================================================================
// MudiDokan (মুদিদোকান) Quick Pin Lock / Cashier Verification Modal
// Note: Bypassed for MVP to eliminate redundant PIN prompts on cashbox
// ==============================================================================

import React, { useEffect } from 'react';

interface QuickPinAuthProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
  title?: string;
  expectedPin?: string;
}

export const QuickPinAuth: React.FC<QuickPinAuthProps> = ({
  isOpen,
  onSuccess,
}) => {
  // Redundant PIN prompt eliminated for friction-free cashier operation:
  useEffect(() => {
    if (isOpen) {
      onSuccess();
    }
  }, [isOpen, onSuccess]);

  return null;
};

