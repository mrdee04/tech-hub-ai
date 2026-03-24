import React from 'react';

export const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'phone', label: 'Điện thoại' },
  { id: 'tablet', label: 'Máy tính bảng' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'accessory', label: 'Phụ kiện' },
  { id: 'other', label: 'Khác' }
];

interface CategoryTabsProps {
  activeCategory: string;
  onSelect: (id: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeCategory, onSelect }) => {
  return (
    <div className="category-tabs">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
          onClick={() => onSelect(cat.id)}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
