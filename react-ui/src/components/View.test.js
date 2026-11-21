import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import View from './View';

const artists = [
  { _id: 'a', name: 'Muse', rating: 80, image: 'm.jpg' },
  { _id: 'b', name: 'Blur', rating: 90, image: 'b.jpg' },
];

const baseUiState = {
  input: { rating: '', artist: '', edit: '', Filter: '', timer: '25' },
  sort: { sortUp: false, activeSort: 'Rating' },
  pinned: [{ id: 'b', pinnedMeta: { artist: true, radio: false, album: false } }],
  currentEdit: '',
  showFlashMsg: false,
  flashMsg: null,
  timer: { isStopped: true, time: {} },
  musicService: 'spotify',
};

const renderView = (uiState = {}) => {
  const handleEvent = vi.fn();
  const onLogout = vi.fn();
  const utils = render(
    <View
      handleEvent={handleEvent}
      uiState={{ ...baseUiState, ...uiState }}
      app={{ artists, ids: { a: 0, b: 1 } }}
      time={{ hours: 0, minutes: '25', seconds: '00', tenths: 0 }}
      onLogout={onLogout}
      user={{ email: 'me@x.com' }}
    />
  );
  const actions = () => handleEvent.mock.calls.map(([arg]) => arg.action);
  return { ...utils, handleEvent, onLogout, actions };
};

describe('View', () => {
  it('renders the header, logout, queue, controls and artist list', () => {
    const { container } = renderView();
    expect(screen.getByText('Playlist Q')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout \(me@x.com\)/ })).toBeInTheDocument();
    expect(container.querySelector('.pinned-section')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Add Artist' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('spotify');
    expect(container.querySelectorAll('.artist')).toHaveLength(2);
  });

  it('no longer has a notification message field', () => {
    renderView();
    expect(screen.queryByText('Notification Message')).toBeNull();
    expect(screen.queryByPlaceholderText('Change artists?')).toBeNull();
  });

  it('shows the flash message', () => {
    renderView({ showFlashMsg: true, flashMsg: 'Saved!' });
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('wires logout', () => {
    const { onLogout } = renderView();
    fireEvent.click(screen.getByRole('button', { name: /Logout/ }));
    expect(onLogout).toHaveBeenCalled();
  });

  it('routes UI events to handleEvent with the right action', () => {
    const { handleEvent, container } = renderView();
    const call = (i) => handleEvent.mock.calls[i][0];

    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    expect(call(0)).toEqual({ action: 'toggleTimer' });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pandora' } });
    expect(call(1).action).toBe('toggleMusicService');

    fireEvent.change(screen.getByPlaceholderText('The Beatles'), { target: { value: 'x' } });
    expect(call(2).action).toBe('inputChange');

    fireEvent.click(screen.getByRole('button', { name: 'Add Artist' }));
    expect(call(3).action).toBe('create');

    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(call(4)).toEqual({ action: 'sort', type: 'Name' });

    const muse = screen.getByText('Muse', { selector: '.artist .name' }).closest('.artist');
    fireEvent.click(within(muse).getByText('80'));
    expect(call(5)).toEqual({ action: 'edit', id: 'a' });

    fireEvent.click(within(muse).getByTitle('Remove artist'));
    expect(call(6)).toEqual({ action: 'delete', id: 'a' });

    fireEvent.click(within(muse).getByTitle('Add to queue'));
    expect(call(7)).toEqual({ action: 'togglePin', id: 'a' });

    const pinnedCard = container.querySelector('.pinned-section .relative-wrapper');
    fireEvent.click(within(pinnedCard).getAllByRole('checkbox')[1]);
    expect(call(8)).toMatchObject({ action: 'toggleCheckbox', id: 'b' });

    fireEvent.click(within(pinnedCard).getByTitle('unpin').querySelector('img'));
    expect(call(9)).toEqual({ action: 'togglePin', id: 'b' });
  });

  it('routes the inline Update button', () => {
    const { handleEvent } = renderView({ currentEdit: 'a', input: { ...baseUiState.input, edit: '81' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    expect(handleEvent).toHaveBeenCalledWith({ action: 'update', id: 'a' });
  });
});
