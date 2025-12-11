import React from 'react';
import Input from './Input';
import HoverImage from 'react-hover-image';
import pinRed from '../images/pin.png';
import pinBlack from '../images/pin2.png';
import { sortMap } from '../constants';

const ArtistList = ({ artists, pinned, input, sort, currentEdit, onEdit, onUpdate, onDelete, onTogglePin, onInputChange }) => {
  const { activeSort, sortUp } = sort;

  const shuffle = (array) => {
    if (activeSort !== 'Shuffle') return array;
    const length = array.length;
    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const getArtistNameFontSize = (name) => {
    const length = name.length;
    return length < 13 ? '14px' : `${Math.round((9 / length) * 20)}px`;
  };

  const sortedAndFilteredArtists = shuffle([...artists])
    .sort((a, b) => {
      if (activeSort === 'Shuffle') return 0;
      if (sortUp) {
        return a[sortMap[activeSort]] < b[sortMap[activeSort]] ? 1 : -1;
      }
      return a[sortMap[activeSort]] > b[sortMap[activeSort]] ? 1 : -1;
    })
    .filter((artist) => {
      const filterText = input && input.filter ? input.filter.toLowerCase() : '';
      return artist && artist.name && artist.name.toLowerCase().indexOf(filterText) > -1;
    });

  return (
    <section>
      {sortedAndFilteredArtists.map((artist) => (
        <div className="artist" key={artist._id}>
          <div className="artist-header">
            {currentEdit === artist._id ? (
              <React.Fragment>
                <Input
                  name="edit"
                  value={input}
                  handleChange={(e) => onInputChange(e)}
                  className="input-edit"
                />
                <button
                  onClick={() => onUpdate(artist._id)}
                  className="button-edit"
                >
                  Update
                </button>
              </React.Fragment>
            ) : (
              <div
                className="artist-rating"
                onClick={() => onEdit(artist._id)}
              >
                {artist.rating}
              </div>
            )}
          </div>
          <div className="relative-wrapper">
            <img src={artist.image} alt="album art" className="photo" />
            <div className="x" onClick={() => onDelete(artist._id)} title="Remove artist">
              X
            </div>
            {pinned.findIndex((pinned) => pinned.id === artist._id) === -1 && (
              <div className="pin" onClick={() => onTogglePin(artist._id)} title="Add to queue">
                <HoverImage src={pinBlack} hoverSrc={pinRed} />
              </div>
            )}
          </div>
          <div className="name" style={{ fontSize: getArtistNameFontSize(artist.name) }}>
            {artist.name}
          </div>
        </div>
      ))}
    </section>
  );
};

export default ArtistList;

