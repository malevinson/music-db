import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import PinnedArtists from './PinnedArtists';

const artists = [
  { _id: 'a', name: 'Sigur Rós', image: 'sr.jpg' },
  { _id: 'b', name: 'Muse', image: 'muse.jpg' },
];
const ids = { a: 0, b: 1 };
const pinned = [
  { id: 'a', pinnedMeta: { artist: true, radio: false, album: true } },
  { id: 'b', pinnedMeta: { artist: false, radio: true, album: false } },
];

const renderPinned = (props = {}) => {
  const handlers = { onTogglePin: vi.fn(), onToggleCheckbox: vi.fn(), onReorderPinned: vi.fn() };
  const utils = render(
    <PinnedArtists pinned={pinned} artists={artists} ids={ids} musicService="googleMusic" {...handlers} {...props} />
  );
  const card = (name) => screen.getByText(name).closest('.relative-wrapper');
  return { ...utils, handlers, card };
};

describe('PinnedArtists', () => {
  it('shows an empty-state message with nothing pinned', () => {
    renderPinned({ pinned: [] });
    expect(screen.getByText('Pin an artist to start your queue')).toBeInTheDocument();
  });

  it('treats a missing pinned list as empty', () => {
    renderPinned({ pinned: undefined });
    expect(screen.getByText('Pin an artist to start your queue')).toBeInTheDocument();
  });

  it('renders pinned artists in queue order', () => {
    const { container } = renderPinned();
    const names = Array.from(container.querySelectorAll('.relative-wrapper > .name')).map((n) => n.textContent);
    expect(names).toEqual(['Sigur Rós', 'Muse']);
  });

  it('skips pins whose artist no longer exists or are malformed', () => {
    const { container } = renderPinned({
      pinned: [...pinned, { id: 'gone', pinnedMeta: {} }, null, { pinnedMeta: {} }],
    });
    expect(container.querySelectorAll('.relative-wrapper')).toHaveLength(2);
  });

  it('reflects the Songs / Mix / Albums checkboxes', () => {
    const { card } = renderPinned();
    const [songs, mix, albums] = within(card('Sigur Rós')).getAllByRole('checkbox');
    expect(songs).toBeChecked();
    expect(mix).not.toBeChecked();
    expect(albums).toBeChecked();
  });

  it('reports checkbox toggles with the pin id and field name', () => {
    const seen = [];
    const onToggleCheckbox = vi.fn((e, id) => seen.push([e.target.name, e.target.checked, id]));
    const { card } = renderPinned({ onToggleCheckbox });
    const [, mix] = within(card('Muse')).getAllByRole('checkbox');
    fireEvent.click(mix);
    expect(seen).toEqual([['radio', false, 'b']]);
  });

  it('unpins when the pin is clicked', () => {
    const { card, handlers } = renderPinned();
    fireEvent.click(within(card('Muse')).getByTitle('unpin').querySelector('img'));
    expect(handlers.onTogglePin).toHaveBeenCalledWith('b');
  });

  it.each([
    ['googleMusic', 'https://music.youtube.com/search?q=Sigur%20R%C3%B3s'],
    ['spotify', 'https://open.spotify.com/search/Sigur%20R%C3%B3s'],
    ['pandora', 'https://www.pandora.com/search/Sigur%20R%C3%B3s/all'],
    ['appleMusic', 'https://music.apple.com/us/search?term=Sigur%20R%C3%B3s'],
    ['unknown', 'https://music.youtube.com/search?q=Sigur%20R%C3%B3s'],
  ])('links to the %s search page', (musicService, url) => {
    const { card } = renderPinned({ musicService });
    const link = within(card('Sigur Rós')).getByTitle('open in new window');
    expect(link).toHaveAttribute('href', url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has a drag handle on every pinned artist', () => {
    const { container } = renderPinned();
    expect(container.querySelectorAll('.drag-handle')).toHaveLength(2);
  });
});
