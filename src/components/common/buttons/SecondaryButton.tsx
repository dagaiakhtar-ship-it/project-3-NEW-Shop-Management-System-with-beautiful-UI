import React from 'react';
import Button, { ButtonProps } from '../../ui/Button';

/**
 * Reusable Secondary Button Component
 * Standard styled button for secondary actions, cancellations, or auxiliary tasks.
 */
export const SecondaryButton: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <Button variant="outline" {...props}>
      {children}
    </Button>
  );
};

export default SecondaryButton;
