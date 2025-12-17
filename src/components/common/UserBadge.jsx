import React from 'react';

const UserBadge = ({ user, className = "", showAvatar = true, showName = true }) => {
    if (!user) return null;

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs text-gray-500 dark:text-gray-300 font-semibold select-none shadow-sm ${className}`}>
            {showName && <span>{user.displayName || 'Anonymous'}</span>}
            {showAvatar && (
                user.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-5 h-5 rounded-full border border-gray-200 dark:border-gray-600 object-cover"
                    />
                ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-300 font-bold border border-gray-300 dark:border-gray-600">
                        {user.displayName ? user.displayName[0].toUpperCase() : '?'}
                    </div>
                )
            )}
        </div>
    );
};

export default UserBadge;
