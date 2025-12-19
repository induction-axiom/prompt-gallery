import React, { useState, useRef, useEffect } from 'react';
import { subscribeToGlobalTags } from '../../services/firestore';
import { Tag, Check, Filter } from 'lucide-react';
import { useTemplatesContext } from '../../context/TemplatesContext';

const LabelFilter = () => {
    const { state, actions } = useTemplatesContext();
    const { selectedTags, templates } = state;
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Subscribe to global tag list
    const [availableTags, setAvailableTags] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeToGlobalTags((tags) => {
            setAvailableTags(tags);
        });

        return () => unsubscribe();
    }, []);

    const toggleTag = (tag) => {
        const newTags = selectedTags.includes(tag)
            ? selectedTags.filter(t => t !== tag)
            : [...selectedTags, tag];

        actions.setTags(newTags);
    };

    const handleAddManualTag = (e) => {
        e.preventDefault();
        const tag = inputValue.trim();
        if (tag && !selectedTags.includes(tag)) {
            actions.setTags([...selectedTags, tag]);
            setInputValue("");
        }
    };

    const clearFilters = () => {
        actions.setTags([]);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all cursor-pointer ${selectedTags.length > 0
                    ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:border-gray-600"
                    }`}
            >
                <Filter size={16} />
                <span>Filter</span>
                {selectedTags.length > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 ml-1 text-xs text-white bg-blue-500 rounded-full">
                        {selectedTags.length}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                        <form onSubmit={handleAddManualTag} className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filter by tag..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-gray-200"
                                autoFocus
                            />
                        </form>
                    </div>

                    <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                        {/* Selected Tags Section */}
                        {selectedTags.length > 0 && (
                            <div className="mb-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 block mb-1">
                                    Active
                                </span>
                                {selectedTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className="w-full text-left flex items-center justify-between px-2 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md cursor-pointer"
                                    >
                                        <span className="truncate">{tag}</span>
                                        <Check size={14} className="opacity-100" />
                                    </button>
                                ))}
                                <div className="h-px bg-gray-100 dark:bg-gray-700 my-2 mx-2" />
                            </div>
                        )}

                        {/* Suggestions Section */}
                        <div className="px-2">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                Suggestions
                            </span>
                            {availableTags.length === 0 ? (
                                <p className="text-xs text-gray-400 italic py-2">
                                    No tags found in current list.
                                </p>
                            ) : (
                                availableTags
                                    .filter(tag => !selectedTags.includes(tag))
                                    .filter(tag => tag.toLowerCase().includes(inputValue.toLowerCase()))
                                    .map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className="w-full text-left flex items-center justify-between px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md group cursor-pointer"
                                        >
                                            <span className="truncate">{tag}</span>
                                            <Check size={14} className="opacity-0 group-hover:opacity-50" />
                                        </button>
                                    ))
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    {selectedTags.length > 0 && (
                        <div className="p-2 border-t border-gray-100 dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-800/50">
                            <button
                                onClick={clearFilters}
                                className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LabelFilter;
