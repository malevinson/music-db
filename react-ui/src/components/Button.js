import React from 'react';

const Button = ({ children, onClick, className, ...rest }) => {
    return (
        <button {...rest} onClick={onClick} className={className}>
            {children}
        </button>
    );
};

export default Button;
