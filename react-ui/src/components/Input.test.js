import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from './Input';

describe('Input', () => {
  it('reads its value from the input-state object by name', () => {
    render(<Input name="artist" value={{ artist: 'Muse' }} handleChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('Muse');
  });

  it('uses the name as placeholder when none is given', () => {
    render(<Input name="Filter" value={{ Filter: '' }} handleChange={() => {}} />);
    expect(screen.getByPlaceholderText('Filter')).toBeInTheDocument();
  });

  it('uses an explicit placeholder', () => {
    render(<Input name="rating" value={{ rating: '' }} placeholder="35" handleChange={() => {}} />);
    expect(screen.getByPlaceholderText('35')).toBeInTheDocument();
  });

  it('calls handleChange with the event', () => {
    // React 16 pools synthetic events, so read fields inside the handler
    const seen = [];
    const handleChange = vi.fn((e) => seen.push([e.target.name, e.target.value]));
    render(<Input name="artist" value={{ artist: '' }} handleChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Blur' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([['artist', 'Blur']]);
  });

  it('passes through extra props', () => {
    render(<Input name="x" value={{ x: '' }} handleChange={() => {}} className="cls" style={{ color: 'red' }} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('cls');
    expect(input.style.color).toBe('red');
  });
});
