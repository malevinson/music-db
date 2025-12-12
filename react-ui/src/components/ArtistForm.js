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
        </div>
      </form>
    </div>
  );
};

export default ArtistForm;

