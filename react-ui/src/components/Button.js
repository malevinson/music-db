import React from 'react';

const Button = ({ ...rest,children, onClick,className }) => {
    return (
        <button
            {...rest}
            onClick={onClick}
            className={className}
        >
            {children}
        </button>
    );
};

export default Button;
