import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ArtistList from './ArtistList';

const artists = [
  { _id: 'a', name: 'Muse', rating: 80, createdAt: '2024-01-02', image: 'muse.jpg' },
  { _id: 'b', name: 'Blur', rating: 95, createdAt: '2024-01-03', image: 'blur.jpg' },
  { _id: 'c', name: 'Coldplay', rating: 60, createdAt: '2024-01-01', image: 'cold.jpg' },
];

const renderList = (props = {}) => {
  const handlers = {
    onEdit: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onTogglePin: vi.fn(),
    onInputChange: vi.fn(),
  };
  const utils = render(
    <ArtistList
      artists={artists}
      pinned={[]}
      input={{ Filter: '', edit: '' }}
      sort={{ activeSort: 'Rating', sortUp: false }}
      currentEdit=""
      {...handlers}
      {...props}
    />
  );
  const names = () => Array.from(utils.container.querySelectorAll('.artist .name')).map((n) => n.textContent);
  const card = (name) => screen.getByText(name).closest('.artist');
  return { ...utils, handlers, names, card };
};

describe('ArtistList', () => {
  it('shows an empty-state message with no artists', () => {
    renderList({ artists: [] });
    expect(screen.getByText('Add some artists to get started')).toBeInTheDocument();
  });

  it('renders each artist with rating and image', () => {
    const { card } = renderList();
    const muse = card('Muse');
    expect(within(muse).getByText('80')).toHaveClass('artist-rating');
    expect(within(muse).getByAltText('album art')).toHaveAttribute('src', 'muse.jpg');
  });

  describe('sorting', () => {
    it('sorts ascending by rating when sortUp is false', () => {
      const { names } = renderList({ sort: { activeSort: 'Rating', sortUp: false } });
      expect(names()).toEqual(['Coldplay', 'Muse', 'Blur']);
    });

    it('sorts descending by rating when sortUp is true', () => {
      const { names } = renderList({ sort: { activeSort: 'Rating', sortUp: true } });
      expect(names()).toEqual(['Blur', 'Muse', 'Coldplay']);
    });

    it('sorts by name', () => {
      const { names } = renderList({ sort: { activeSort: 'Name', sortUp: false } });
      expect(names()).toEqual(['Blur', 'Coldplay', 'Muse']);
    });

    it('sorts by date added', () => {
      const { names } = renderList({ sort: { activeSort: 'Date', sortUp: false } });
      expect(names()).toEqual(['Coldplay', 'Muse', 'Blur']);
    });

    it('shuffles without dropping anyone, and without mutating the prop', () => {
      const original = [...artists];
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const { names } = renderList({ sort: { activeSort: 'Shuffle', sortUp: false } });
      expect([...names()].sort()).toEqual(['Blur', 'Coldplay', 'Muse']);
      // Fisher–Yates with random() === 0 rotates the list left by one
      expect(names()).toEqual(['Blur', 'Coldplay', 'Muse']);
      expect(artists).toEqual(original);
    });
  });

  describe('filtering', () => {
    it('filters by name, case-insensitively', () => {
      const { names } = renderList({ input: { Filter: 'MU' } });
      expect(names()).toEqual(['Muse']);
    });

    it('shows nothing when no artist matches', () => {
      const { names } = renderList({ input: { Filter: 'zzz' } });
      expect(names()).toEqual([]);
    });

    it('skips malformed artists with no name', () => {
      const { names } = renderList({ artists: [...artists, { _id: 'x', rating: 1 }] });
      expect(names()).toHaveLength(3);
    });
  });

  describe('editing', () => {
    it('clicking a rating starts editing that artist', () => {
      const { handlers, card } = renderList();
      fireEvent.click(within(card('Muse')).getByText('80'));
      expect(handlers.onEdit).toHaveBeenCalledWith('a');
    });

    it('shows an edit box and Update button for the artist being edited', () => {
      const { handlers, card } = renderList({ currentEdit: 'a', input: { Filter: '', edit: '85' } });
      const muse = card('Muse');
      expect(within(muse).getByRole('textbox')).toHaveValue('85');

      fireEvent.change(within(muse).getByRole('textbox'), { target: { value: '86' } });
      expect(handlers.onInputChange).toHaveBeenCalled();

      fireEvent.click(within(muse).getByRole('button', { name: 'Update' }));
      expect(handlers.onUpdate).toHaveBeenCalledWith('a');

      expect(within(card('Blur')).queryByRole('textbox')).toBeNull();
    });
  });

  it('deletes via the X', () => {
    const { handlers, card } = renderList();
    fireEvent.click(within(card('Blur')).getByTitle('Remove artist'));
    expect(handlers.onDelete).toHaveBeenCalledWith('b');
  });

  it('pins via the pin icon, and hides it for already-pinned artists', () => {
    const { handlers, card } = renderList({ pinned: [{ id: 'a', pinnedMeta: {} }] });
    expect(within(card('Muse')).queryByTitle('Add to queue')).toBeNull();

    fireEvent.click(within(card('Blur')).getByTitle('Add to queue'));
    expect(handlers.onTogglePin).toHaveBeenCalledWith('b');
  });

  it('shrinks the font for long names', () => {
    const { container } = renderList({
      artists: [
        { _id: 's', name: 'Short', rating: 1 },
        { _id: 'l', name: 'A Very Long Band Name', rating: 2 },
      ],
    });
    const [short, long] = container.querySelectorAll('.artist .name');
    expect(short.style.fontSize).toBe('14px');
    expect(long.style.fontSize).toBe(`${Math.round((9 / 21) * 20)}px`);
  });
});
