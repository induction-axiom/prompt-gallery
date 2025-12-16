import React from 'react';

const Header = ({ user, status, onLogout, onCreate }) => {
    return (
        <header className="app-header">
            <div className="header-left">
                <h1 className="app-title">Prompt Gallery</h1>
                <div className="header-meta">
                    <small className="status-badge">Status: {status}</small>
                    <span className="separator">|</span>
                    <small className="user-email">User: {user?.email}</small>
                </div>
            </div>

            <div className="header-actions">
                <button onClick={onCreate} className="btn btn-primary">
                    + New Template
                </button>
                <button onClick={onLogout} className="btn btn-secondary">
                    Sign Out
                </button>
            </div>
        </header>
    );
};

export default Header;
