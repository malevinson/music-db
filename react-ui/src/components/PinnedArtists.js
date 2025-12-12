import React from 'react';
import HoverImage from 'react-hover-image';
import pinRed from '../images/pin.png';
import pinBlack from '../images/pin2.png';

const PinnedArtists = ({ pinned, artists, ids, musicService, onTogglePin, onToggleCheckbox, onReorderPinned }) => {
  const handleDragStart = (e, index) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.setData('application/json', JSON.stringify({ index }));
    const wrapper = e.currentTarget.closest('.relative-wrapper');
    if (wrapper) {
      wrapper.classList.add('dragging');
    }
    console.log('Drag started', index);
  };

  const handleDragEnd = (e) => {
    const wrapper = e.currentTarget.closest('.relative-wrapper');
    if (wrapper) {
      wrapper.classList.remove('dragging');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    let dragIndexStr = e.dataTransfer.getData('text/plain');
    if (!dragIndexStr) {
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        dragIndexStr = data.index.toString();
      } catch (err) {
        console.log('No drag data found');
        return;
      }
    }
    
    const dragIndex = parseInt(dragIndexStr, 10);
    console.log('Drop', { dragIndex, dropIndex });
    if (!isNaN(dragIndex) && dragIndex !== dropIndex && dragIndex >= 0 && dropIndex >= 0) {
      onReorderPinned(dragIndex, dropIndex);
    }
  };

  const handleDragAreaMouseDown = (e) => {
    e.stopPropagation();
  };

  const renderPins = () => {
    if (!pinned || pinned.length === 0) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '.5rem', 
          color: '#666',
          fontStyle: 'italic'
        }}>
          Pin an artist to start your queue
        </div>
      );
    }
    
    return pinned.map((pin, index) => {
      if (!pin || !pin.id) return null;
      
      const id = pin.id;
      const artist = artists[ids[id]];
      
      if (!artist) return null;
      
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
        <div 
          className="relative-wrapper" 
          key={artist._id}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          style={{ cursor: 'default' }}
        >
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
          <div 
            className="drag-handle"
            draggable="true"
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onMouseDown={handleDragAreaMouseDown}
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="9" y1="11" x2="15" y2="11"></line>
              <line x1="9" y1="7" x2="15" y2="7"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <div className="checkbox-wrap">
            <div className="checkbox-row">
              <div className="checkbox-name">Songs</div>
              <input
                name="artist"
                type="checkbox"
                className="checkbox-check"
                checked={checkboxArtist}
                onChange={(e) => onToggleCheckbox(e, id)}
              />
            </div>
            <div className="checkbox-row">
              <div className="checkbox-name">Mix</div>
              <input
                name="radio"
                type="checkbox"
                checked={radio}
                className="checkbox-check"
                onChange={(e) => onToggleCheckbox(e, id)}
              />
            </div>
            <div className="checkbox-row">
              <div className="checkbox-name">Albums</div>
              <input
                name="album"
                type="checkbox"
                checked={album}
                className="checkbox-check"
                onChange={(e) => onToggleCheckbox(e, id)}
              />
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <section className="pinned-section">
      <div className="header">
        <img className="header-img" alt="pin" src={pinRed} />
      </div>
      <div className="artist-well">
        <div className="flex">{renderPins()}</div>
      </div>
    </section>
  );
};

export default PinnedArtists;

