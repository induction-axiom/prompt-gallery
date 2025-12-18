import React from 'react';
import Card from './Card';

const Modal = ({ title, onClose, children, footer, maxWidth = 'max-w-[600px]' }) => {
    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 box-border transition-all">
            <Card className={`w-full ${maxWidth} max-h-[90vh] shadow-2xl border-none flex flex-col`}>
                <Card.Header className="flex justify-between items-center py-4">
                    <h2 className="m-0 text-xl font-bold text-[#333] dark:text-gray-100">{title}</h2>
                    {onClose && (
                        <button onClick={onClose} className="border-none bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center w-8 h-8 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </Card.Header>
                <Card.Body className="px-5 py-4 overflow-y-auto">
                    {children}
                </Card.Body>
                {footer && (
                    <Card.Footer className="justify-end gap-3">
                        {footer}
                    </Card.Footer>
                )}
            </Card>
        </div>
    );
};

export default Modal;
