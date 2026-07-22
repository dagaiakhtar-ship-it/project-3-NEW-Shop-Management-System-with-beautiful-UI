import React from 'react';
import Button, { ButtonProps } from '../../ui/Button';

/**
 * Reusable Primary Button Component
 * Standard styled button for main call-to-actions in the system.
 */
export const PrimaryButton: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <Button variant="primary" {...props}>
      {children}
    </Button>
  );
};

export default PrimaryButton;
