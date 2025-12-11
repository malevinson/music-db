import React from 'react';
import HoverImage from 'react-hover-image';
import pinRed from '../images/pin.png';
import pinBlack from '../images/pin2.png';

const PinnedArtists = ({ pinned, artists, ids, onTogglePin, onToggleCheckbox }) => {
  const renderPins = () => {
    return pinned.map((pin) => {
      const id = pin.id;
      const artist = artists[ids[id]];
      const { pinnedMeta: { artist: checkboxArtist, radio, album } } = pin;

      if (!artist) return null;

      return (
        <div className="relative-wrapper" key={artist._id}>
          <div className="relative-for-checkboxes" />
          <div className="name">{artist.name}</div>
          <img src={artist.image} alt="album art" className="pinned" />
          <div className="pin">
            <HoverImage
              src={pinRed}
              hoverSrc={pinBlack}
              onClick={() => onTogglePin(artist._id)}
            />
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

