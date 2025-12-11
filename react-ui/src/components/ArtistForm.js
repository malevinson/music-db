import React from 'react';
import Input from './Input';

const ArtistForm = ({ input, onInputChange, onSubmit }) => {
  return (
    <div className="artist-input-wrapper">
      <form onSubmit={onSubmit} method="post">
        <div className="main">
        <div className="column" style={{ fontSize: '11px' }}>
          <label>
            YouTube Music
            <input name="googleMusic" type="checkbox" />
          </label>
          <label>
            Spotify
            <input name="spotify" type="checkbox" />
          </label>
          <label>
            Pandora
            <input name="pandora" type="checkbox" />
          </label>
        </div>
          <label>Artist</label>
          <Input
            name="artist"
            placeholder="The Beatles"
            value={input}
            handleChange={onInputChange}
          />
          <label>Rating</label>
          <Input
            name="rating"
            className="rating-form"
            value={input}
            placeholder="35"
            handleChange={onInputChange}
          />
          <button className="primary">Add Artist</button>
          <label>Notification Message</label>
          <Input
            name="notifMsg"
            className="rating-form"
            value={input}
            placeholder="Time to change artists?"
            style={{ width: '150px' }}
            handleChange={onInputChange}
          />
        </div>
      </form>
    </div>
  );
};

export default ArtistForm;

