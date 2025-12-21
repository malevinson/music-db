import React from 'react';

const LogoutButton = ({ onLogout, user }) => {
  if (!onLogout) return null;

  return (
    <button
      onClick={onLogout}
      style={{
        position: 'absolute',
        top: '5px',
        right: '10px',
        padding: '5px 100px',
        backgroundColor: '#c62828',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        zIndex: 1000,

      }}
      onMouseOver={(e) => {
        e.target.style.backgroundColor = '#b71c1c';
      }}
      onMouseOut={(e) => {
        e.target.style.backgroundColor = '#c62828';
      }}
    >
      Logout {user && user.email ? ` (${user.email})` : ''}
    </button>
  );
};

export default LogoutButton;

