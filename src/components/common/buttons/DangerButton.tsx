import React from 'react';
import Button, { ButtonProps } from '../../ui/Button';

/**
 * Reusable Danger Button Component
 * Standard styled button for destructive actions like deleting, clearing data, or resetting configs.
 */
export const DangerButton: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <Button variant="danger" {...props}>
      {children}
    </Button>
  );
};

export default DangerButton;
