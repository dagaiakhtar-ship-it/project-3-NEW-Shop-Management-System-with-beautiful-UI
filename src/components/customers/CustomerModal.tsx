import React from 'react';
import Modal from '../ui/Modal';
import CustomerForm from './CustomerForm';
import { type Customer } from '../../database/db';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialData?: Customer | null;
  onSubmit: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'name' | 'balance'>) => Promise<any>;
  isSubmitting?: boolean;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  title,
  initialData,
  onSubmit,
  isSubmitting = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <CustomerForm
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
};

export default CustomerModal;
