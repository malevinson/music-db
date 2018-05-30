import React from 'react';

const Input = ({ name, value, handleChange, ...rest }) => {
    return (
        <span>
            <input {...rest} name={name} type="text" value={value[name]} placeholder={name} onChange={handleChange} />
        </span>
    );
};

export default Input;
