import React from 'react';


const Modal = ({ title, onClose, children, footer }) => {
    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white p-5 rounded-lg w-[90%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-[0_4px_6px_rgba(0,0,0,0.1)] flex flex-col gap-[15px]">
                <div className="flex justify-between items-center border-b border-[#eee] pb-2.5">
                    <h2 className="m-0 text-xl">{title}</h2>
                    {onClose && (
                        <button onClick={onClose} className="border-none bg-transparent text-2xl cursor-pointer">
                            &times;
                        </button>
                    )}
                </div>
                <div className="flex-1">{children}</div>
                {footer && <div className="border-t border-[#eee] pt-2.5 flex justify-end gap-2.5">{footer}</div>}
            </div>
        </div>
    );

};

export default Modal;
