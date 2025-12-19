import React from 'react';
import { X } from 'lucide-react';

const FilterPill = ({ user, label, isActive, onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`
                flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border transition-all group focus:outline-none cursor-pointer
                ${isActive
          ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300 ring-1 ring-blue-500/20"
          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600 shadow-sm"
        }
                ${className}
            `}
      title={isActive ? "Click to clear filter" : "Click to filter"}
    >
      <span className="text-sm font-medium leading-none pb-0.5">{label}</span>

      {/* Avatar / X Action Area */}
      <div className="relative w-6 h-6 flex-shrink-0">
        {/* Avatar - Hidden on hover ONLY if active (to show X) */}
        <div className={`w-6 h-6 rounded-full overflow-hidden transition-opacity flex items-center justify-center bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 ${isActive ? "group-hover:opacity-0" : ""}`}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300">
              {user?.displayName?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>

        {/* X Icon - Shown on hover ONLY if active */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-400">
            <X size={14} />
          </div>
        )}
      </div>
    </button>
  );
};

export default FilterPill;
