import React from 'react';

const Input = ({ name, value, handleChange, placeholder, ...rest }) => {
    return (
        <input
            {...rest}
            name={name}
            type="text"
            value={value[name]}
            placeholder={placeholder ? placeholder : name}
            onChange={handleChange}
        />
    );
};

export default Input;
