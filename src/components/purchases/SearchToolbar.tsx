import React from 'react';
import SearchBox from '../ui/SearchBox';

interface SearchToolbarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  value,
  onChange,
  placeholder = 'Search purchase bills, invoice, product, supplier name...',
}) => {
  return (
    <div className="flex-1">
      <SearchBox
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
};

export default SearchToolbar;
