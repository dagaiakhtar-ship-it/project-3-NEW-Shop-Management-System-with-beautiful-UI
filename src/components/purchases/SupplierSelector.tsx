import React, { useState, useEffect } from 'react';
import { db, type Supplier } from '../../database/db';
import Select from '../ui/Select';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { User, Phone, MapPin, Mail, DollarSign } from 'lucide-react';

interface SupplierSelectorProps {
  selectedSupplierId?: number;
  onChange: (id: number) => void;
  error?: string;
}

export const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  selectedSupplierId,
  onChange,
  error,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const list = await db.suppliers.filter((s) => s.status === 'Active').toArray();
      setSuppliers(list);
    };
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (selectedSupplierId) {
      db.suppliers.get(Number(selectedSupplierId)).then((s) => {
        setSelectedSupplier(s || null);
      });
    } else {
      setSelectedSupplier(null);
    }
  }, [selectedSupplierId]);

  const supplierOptions = suppliers.map((s) => ({
    value: String(s.id),
    label: s.companyName || s.name || 'Unnamed Supplier',
  }));

  return (
    <div className="flex flex-col gap-4 text-left">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Select Supplier <span className="text-red-500">*</span>
        </label>
        <Select
          options={supplierOptions}
          value={selectedSupplierId ? String(selectedSupplierId) : ''}
          onChange={(val) => onChange(Number(val))}
          placeholder="Choose a supplier..."
          error={error}
        />
      </div>

      {selectedSupplier && (
        <Card className="p-4 border-l-4 border-indigo-500 bg-indigo-50/15 dark:bg-indigo-950/10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-500" />
                {selectedSupplier.companyName || selectedSupplier.name}
              </h4>
              <Badge variant={selectedSupplier.status === 'Active' ? 'success' : 'warning'} size="sm">
                {selectedSupplier.supplierCode}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
              {selectedSupplier.contactPerson && (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-450">Contact:</span>
                  <span>{selectedSupplier.contactPerson}</span>
                </div>
              )}
              {selectedSupplier.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-slate-400" />
                  <span>{selectedSupplier.phone}</span>
                </div>
              )}
              {selectedSupplier.email && (
                <div className="flex items-center gap-1.5 col-span-full md:col-span-1">
                  <Mail className="h-3 w-3 text-slate-400" />
                  <span>{selectedSupplier.email}</span>
                </div>
              )}
              {selectedSupplier.address && (
                <div className="flex items-center gap-1.5 col-span-full">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  <span>
                    {selectedSupplier.address}
                    {selectedSupplier.city ? `, ${selectedSupplier.city}` : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400">Current Outstanding Balance:</span>
              <span className="font-mono font-black text-slate-900 dark:text-white flex items-center text-sm">
                <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                {parseFloat((selectedSupplier.currentBalance || 0).toFixed(2)).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SupplierSelector;
