import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders children and handles clicks', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} className="primary">Go</Button>);
    const btn = screen.getByRole('button', { name: 'Go' });
    expect(btn).toHaveClass('primary');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes through extra props', () => {
    render(<Button type="submit" disabled>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toHaveAttribute('type', 'submit');
    expect(btn).toBeDisabled();
  });
});
