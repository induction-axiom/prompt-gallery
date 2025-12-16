import React from 'react';
import '../../App.css'; // Ensure styles are available

const Modal = ({ title, onClose, children, footer }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    {onClose && (
                        <button onClick={onClose} className="modal-close-btn">
                            &times;
                        </button>
                    )}
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
};

export default Modal;
