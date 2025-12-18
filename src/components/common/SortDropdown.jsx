import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useTemplatesContext } from '../../context/TemplatesContext';

const SortDropdown = () => {
    const { state, actions } = useTemplatesContext();
    const currentSort = state.sortBy;
    const onSortChange = actions.setSortBy;

    return (
        <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-gray-500 dark:text-gray-400" />
            <div className="relative">
                <select
                    value={currentSort}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 dark:text-gray-200 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                    <option value="createdAt">Recent</option>
                    <option value="likeCount">Most Liked</option>
                    <option value="viewCount">Most Viewed</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default SortDropdown;
