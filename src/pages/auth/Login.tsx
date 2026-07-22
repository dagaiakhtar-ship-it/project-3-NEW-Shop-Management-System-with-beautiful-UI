import React from 'react';
import LoginForm from '../../components/auth/LoginForm';

/**
 * Login Page Component
 * Mounts the core offline-first LoginForm inside the layout structure.
 */
export const Login: React.FC = () => {
  return (
    <div className="flex w-full items-center justify-center">
      <LoginForm />
    </div>
  );
};

export default Login;
