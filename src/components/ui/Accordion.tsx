import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  className = '',
}) => {
  const [openIds, setOpenIds] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setOpenIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className={`space-y-2 w-full ${className}`}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);

        return (
          <div
            key={item.id}
            className="border border-slate-100 dark:border-slate-800/80 rounded-xl bg-white dark:bg-slate-900 overflow-hidden transition-all duration-200"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="flex w-full items-center justify-between p-4 text-left font-bold text-slate-900 dark:text-slate-100 text-sm cursor-pointer select-none"
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-250 ${
                  isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-4 pb-4 border-t border-slate-50 dark:border-slate-800/30 pt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-left animate-fade-in">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
