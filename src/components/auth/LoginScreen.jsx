import React from 'react';

const LoginScreen = ({ onLogin }) => {
    return (
        <div className="login-screen">
            <div className="login-card">
                <h1 className="login-title">Prompt Gallery</h1>
                <p className="login-subtitle">Please sign in to view and manage prompts.</p>
                <button onClick={onLogin} className="btn btn-google">
                    Sign in with Google
                </button>
            </div>
        </div>
    );
};

export default LoginScreen;
