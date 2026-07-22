import React from 'react';
import { RouterProvider as ReactRouterProvider } from 'react-router-dom';
import router from '../routes/router';

/**
 * RouterProvider Component
 * Exposes React Router contexts under our core provider stack.
 */
export const RouterProvider: React.FC = () => {
  return <ReactRouterProvider router={router} />;
};

export default RouterProvider;
