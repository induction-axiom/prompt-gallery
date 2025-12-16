import React from 'react';

const Header = ({ user, status, onLogout, onCreate }) => {
    return (
        <header className="flex justify-between items-center mb-[30px]">
            <div className="header-left">
                <h1 className="m-0 text-2xl font-bold">Prompt Gallery</h1>
                <div className="flex items-center gap-2.5 mt-1">
                    <small className="status-badge">Status: {status}</small>
                    <span className="text-[#ccc]">|</span>
                    <small className="user-email">User: {user?.email}</small>
                </div>
            </div>

            <div className="flex gap-2.5">
                <button onClick={onCreate} className="px-5 py-2.5 text-base rounded-md border border-transparent cursor-pointer transition-opacity hover:opacity-90 inline-flex items-center justify-center bg-[#1890ff] text-white">
                    + New Template
                </button>
                <button onClick={onLogout} className="px-5 py-2.5 text-base rounded-md border border-[#ccc] cursor-pointer transition-opacity hover:opacity-90 inline-flex items-center justify-center bg-white text-[#666]">
                    Sign Out
                </button>
            </div>
        </header>
    );
};

export default Header;
