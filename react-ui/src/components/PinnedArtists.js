import React from 'react';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import HoverImage from 'react-hover-image';
import pinRed from '../images/pin.png';
import pinBlack from '../images/pin2.png';

const DragHandle = SortableHandle(() => (
  <div className="drag-handle" title="Drag to reorder">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="11" x2="15" y2="11"></line>
      <line x1="9" y1="7" x2="15" y2="7"></line>
      <line x1="9" y1="15" x2="15" y2="15"></line>
    </svg>
  </div>
));

const SortablePinnedArtist = SortableElement(({ pin, artist, musicService, onTogglePin, onToggleCheckbox }) => {
  const { pinnedMeta: { artist: checkboxArtist, radio, album } } = pin;

  const encodedArtistName = encodeURIComponent(artist.name);
  let musicUrl = '';
  
  if (musicService === 'googleMusic') {
    musicUrl = `https://music.youtube.com/search?q=${encodedArtistName}`;
  } else if (musicService === 'spotify') {
    musicUrl = `https://open.spotify.com/search/${encodedArtistName}`;
  } else if (musicService === 'pandora') {
    musicUrl = `https://www.pandora.com/search/${encodedArtistName}/all`;
  } else if (musicService === 'appleMusic') {
    musicUrl = `https://music.apple.com/us/search?term=${encodedArtistName}`;
  } else {
    musicUrl = `https://music.youtube.com/search?q=${encodedArtistName}`;
  }

  return (
    <div className="relative-wrapper">
      <div className="relative-for-checkboxes" />
      <div className="name">{artist.name}</div>
      <img src={artist.image} alt="album art" className="pinned" />
      <div className="pin" title="unpin">
        <HoverImage
          src={pinRed}
          hoverSrc={pinBlack}
          onClick={() => onTogglePin(artist._id)}
        />
      </div>
      <a 
        href={musicUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="external-link"
        title="open in new window"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
      <DragHandle />
      <div className="checkbox-wrap">
        <div className="checkbox-row">
          <div className="checkbox-name">Songs</div>
          <input
            name="artist"
            type="checkbox"
            className="checkbox-check"
            checked={checkboxArtist}
            onChange={(e) => onToggleCheckbox(e, pin.id)}
          />
        </div>
        <div className="checkbox-row">
          <div className="checkbox-name">Mix</div>
          <input
            name="radio"
            type="checkbox"
            checked={radio}
            className="checkbox-check"
            onChange={(e) => onToggleCheckbox(e, pin.id)}
          />
        </div>
        <div className="checkbox-row">
          <div className="checkbox-name">Albums</div>
          <input
            name="album"
            type="checkbox"
            checked={album}
            className="checkbox-check"
            onChange={(e) => onToggleCheckbox(e, pin.id)}
          />
        </div>
      </div>
    </div>
  );
});

const SortablePinnedList = SortableContainer(({ items, artists, ids, musicService, onTogglePin, onToggleCheckbox }) => {
  return (
    <div className="flex">
      {items.map((pin, index) => {
        if (!pin || !pin.id) return null;
        
        const id = pin.id;
        const artist = artists[ids[id]];
        
        if (!artist) return null;

        return (
          <SortablePinnedArtist
            key={pin.id}
            index={index}
            pin={pin}
            artist={artist}
            musicService={musicService}
            onTogglePin={onTogglePin}
            onToggleCheckbox={onToggleCheckbox}
          />
        );
      })}
    </div>
  );
});

const PinnedArtists = ({ pinned, artists, ids, musicService, onTogglePin, onToggleCheckbox, onReorderPinned }) => {

  const onSortEnd = ({ oldIndex, newIndex }) => {
    if (oldIndex === newIndex) return;
    onReorderPinned(oldIndex, newIndex);
  };

  if (!pinned || pinned.length === 0) {
    return (
      <section className="pinned-section">
        <div className="header">
          <img className="header-img" alt="pin" src={pinRed} />
        </div>
        <div className="artist-well">
          <div style={{ 
            textAlign: 'center', 
            padding: '.5rem', 
            color: '#666',
            fontStyle: 'italic'
          }}>
            Pin an artist to start your queue
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pinned-section">
      <div className="header">
        <img className="header-img" alt="pin" src={pinRed} />
      </div>
      <div className="artist-well">
        <SortablePinnedList
          items={pinned}
          artists={artists}
          ids={ids}
          musicService={musicService}
          onTogglePin={onTogglePin}
          onToggleCheckbox={onToggleCheckbox}
          onSortEnd={onSortEnd}
          axis="x"
          distance={5}
          useDragHandle={true}
          helperClass="pinned-dragging"
          transitionDuration={100}
          getHelperDimensions={({ node }) => ({
            width: node.offsetWidth,
            height: node.offsetHeight,
          })}
        />
      </div>
    </section>
  );
};

export default PinnedArtists;

