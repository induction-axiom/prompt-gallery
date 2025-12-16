import React from 'react';

const LoginScreen = ({ onLogin }) => {
    return (
        <div className="h-screen flex items-center justify-center bg-[#f5f5f5]">
            <div className="bg-white p-10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-center">
                <h1 className="mb-5 text-2xl font-bold">Prompt Gallery</h1>
                <p className="mb-[30px] text-[#666]">Please sign in to view and manage prompts.</p>
                <button onClick={onLogin} className="bg-[#4285F4] text-white mx-auto py-3 px-6 rounded-md hover:opacity-90 border-none cursor-pointer text-base">
                    Sign in with Google
                </button>
            </div>
        </div>
    );
};

export default LoginScreen;
