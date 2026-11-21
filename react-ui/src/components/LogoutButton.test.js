import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LogoutButton from './LogoutButton';

describe('LogoutButton', () => {
  it('renders nothing without an onLogout handler', () => {
    const { container } = render(<LogoutButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the user's email", () => {
    render(<LogoutButton onLogout={() => {}} user={{ email: 'matt@example.com' }} />);
    expect(screen.getByRole('button')).toHaveTextContent('Logout (matt@example.com)');
  });

  it('works without a user', () => {
    render(<LogoutButton onLogout={() => {}} />);
    expect(screen.getByRole('button').textContent.trim()).toBe('Logout');
  });

  it('calls onLogout when clicked', () => {
    const onLogout = vi.fn();
    render(<LogoutButton onLogout={onLogout} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('darkens on hover and restores on mouse out', () => {
    render(<LogoutButton onLogout={() => {}} />);
    const btn = screen.getByRole('button');
    fireEvent.mouseOver(btn);
    expect(btn.style.backgroundColor).toBe('rgb(183, 28, 28)');
    fireEvent.mouseOut(btn);
    expect(btn.style.backgroundColor).toBe('rgb(198, 40, 40)');
  });
});
