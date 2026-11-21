import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ArtistForm from './ArtistForm';

describe('ArtistForm', () => {
  const input = { artist: 'Muse', rating: '80' };

  it('renders the artist and rating fields with current values', () => {
    render(<ArtistForm input={input} onInputChange={() => {}} onSubmit={() => {}} />);
    expect(screen.getByPlaceholderText('The Beatles')).toHaveValue('Muse');
    expect(screen.getByPlaceholderText('35')).toHaveValue('80');
  });

  it('forwards input changes', () => {
    const onInputChange = vi.fn();
    render(<ArtistForm input={input} onInputChange={onInputChange} onSubmit={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('35'), { target: { value: '90' } });
    expect(onInputChange).toHaveBeenCalledTimes(1);
  });

  it('submits via the Add Artist button', () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(<ArtistForm input={input} onInputChange={() => {}} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add Artist' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
