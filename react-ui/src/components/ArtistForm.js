import React from 'react';
import Input from './Input';

const ArtistForm = ({ input, onInputChange, onSubmit }) => {
  return (
    <div className="artist-input-wrapper">
      <form onSubmit={onSubmit} method="post">
        <div className="main">
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
            placeholder="Timer is up!"
            style={{ width: '100%' }}
            handleChange={onInputChange}
          />
        </div>
      </form>
    </div>
  );
};

export default ArtistForm;

