import React from 'react';
import Card from './Card';

const Modal = ({ title, onClose, children, footer }) => {
    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-[1000] p-5 box-border">
            <Card className="w-full max-w-[600px] max-h-[90vh] shadow-[0_4px_6px_rgba(0,0,0,0.1)] !rounded-lg border-none flex flex-col">
                <Card.Header className="border-b border-[#eee] flex justify-between items-center py-3">
                    <h2 className="m-0 text-xl font-bold text-[#333]">{title}</h2>
                    {onClose && (
                        <button onClick={onClose} className="border-none bg-transparent text-2xl cursor-pointer text-gray-500 hover:text-gray-700 transition-colors">
                            &times;
                        </button>
                    )}
                </Card.Header>
                <Card.Body className="p-5 overflow-y-auto">
                    {children}
                </Card.Body>
                {footer && (
                    <Card.Footer className="justify-end gap-2.5 bg-white border-t border-[#eee]">
                        {footer}
                    </Card.Footer>
                )}
            </Card>
        </div>
    );
};

export default Modal;
