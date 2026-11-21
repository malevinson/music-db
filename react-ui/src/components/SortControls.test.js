import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SortControls from './SortControls';

const renderControls = (props = {}) =>
  render(
    <SortControls
      activeSort="Rating"
      sortUp={false}
      input={{ Filter: '' }}
      onSort={() => {}}
      onInputChange={() => {}}
      {...props}
    />
  );

describe('SortControls', () => {
  it('renders a button for every sort mode', () => {
    renderControls();
    ['Rating', 'Name', 'Date', 'Shuffle'].forEach((name) =>
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    );
  });

  it('marks the active sort', () => {
    renderControls({ activeSort: 'Name' });
    expect(screen.getByRole('button', { name: 'Name' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Rating' })).not.toHaveClass('active');
  });

  it('shows the down arrow when sorting descending', () => {
    renderControls({ activeSort: 'Rating', sortUp: false });
    const btn = screen.getByRole('button', { name: 'Rating' });
    expect(btn.querySelector('.fa-arrow-down')).toHaveClass('show');
    expect(btn.querySelector('.fa-arrow-up')).not.toHaveClass('show');
  });

  it('shows the up arrow when sortUp is set', () => {
    renderControls({ activeSort: 'Rating', sortUp: true });
    const btn = screen.getByRole('button', { name: 'Rating' });
    expect(btn.querySelector('.fa-arrow-up')).toHaveClass('show');
  });

  it('never shows arrows for Shuffle', () => {
    renderControls({ activeSort: 'Shuffle', sortUp: true });
    const btn = screen.getByRole('button', { name: 'Shuffle' });
    expect(btn.querySelectorAll('.show')).toHaveLength(0);
  });

  it('calls onSort with the button label', () => {
    const onSort = vi.fn();
    renderControls({ onSort });
    fireEvent.click(screen.getByRole('button', { name: 'Date' }));
    expect(onSort).toHaveBeenCalledWith('Date');
  });

  it('highlights the filter box when a filter is active', () => {
    renderControls({ input: { Filter: 'mu' } });
    expect(screen.getByPlaceholderText('Filter').style.border).toBe('4px dashed red');
  });

  it('does not highlight an empty filter', () => {
    renderControls();
    expect(screen.getByPlaceholderText('Filter').style.border).toBe('');
  });
});
