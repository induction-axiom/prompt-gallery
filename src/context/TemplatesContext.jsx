import React, { createContext, useContext, useEffect } from 'react';
import { useTemplates } from '../hooks/useTemplates';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { syncUserInfo } from '../services/firestore';

const TemplatesContext = createContext();

export const TemplatesProvider = ({ children }) => {
    const [user, setUser] = React.useState(null);
    const [isAuthLoading, setIsAuthLoading] = React.useState(true);

    const { state, actions } = useTemplates(user);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthLoading(false);

            if (currentUser) {
                syncUserInfo(currentUser);
                actions.fetchTemplates();
            }
        });
        return () => unsubscribe();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const value = {
        state,
        actions,
        user,
        isAuthLoading,
        setUser // exposed if needed for logout etc, though usually handled by auth lib
    };

    return (
        <TemplatesContext.Provider value={value}>
            {children}
        </TemplatesContext.Provider>
    );
};

export const useTemplatesContext = () => {
    const context = useContext(TemplatesContext);
    if (!context) {
        throw new Error('useTemplatesContext must be used within a TemplatesProvider');
    }
    return context;
};
