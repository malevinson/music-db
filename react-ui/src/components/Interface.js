import React from 'react';
// import styles from './Interface.css';

const Interface = props => {
    const {
        //UI VALUES
        inputArtist,
        inputRating,
        inputReminder,
        checkboxPopup,
        checkboxSound,
        ratingArrowUp,
        reminderText,
        //FUNCTIONS
        handleClickNumber,
        handleAddPin,
        handleRemoveArtist,
        handleRemovePin,
        handleClickName,
        handleClickRating,
        handleChangeArtist,
        handleChangeReminder,
        handleChangeRating,
        handleSubmitName,
        handleSubmitRating,
        handleSubmitArtist,
        handleSubmitReminder,
        handleChangeCheckboxSound,
        handleChangeCheckboxPopup,
        //APP STATE
        artists,
        pinned
    } = props;

    return (
        <div>
            <form onSubmit={handleSubmitReminder}>
                <label>
                    Popup (steals focus)
                    <input type="checkbox" name="popup" checked={checkboxPopup} onChange={handleChangeCheckboxPopup} />
                </label>
                <br />
                <label>
                    Play Sound
                    <input type="checkbox" name="sound" checked={checkboxSound} onChange={handleChangeCheckboxSound} />
                </label>
                <br />
                <label>
                    Reminder
                    <input type="text" value={inputReminder} placeholder={'Reminder'} onChange={handleChangeReminder} />
                </label>
                <button onClick={handleSubmitReminder}>{reminderText}</button>
            </form>
            <div>Pinned Artists</div>
            {pinned.map(artist => {
                return (
                    <div key={artist._id}>
                        {artist.name}
                        <button
                            onClick={() => {
                                handleRemovePin(artist._id);
                            }}
                        >
                            Unpin
                        </button>
                    </div>
                );
            })}
            <form onSubmit={handleSubmitArtist}>
                <label>
                    Rating
                    <input type="text" value={inputRating} placeholder={'Rating'} onChange={handleChangeRating} />
                </label>
                <label>
                    Artist
                    <input type="text" value={inputArtist} placeholder={'Artist'} onChange={handleChangeArtist} />
                </label>
                <button onClick={handleSubmitArtist}>Add Artist</button>
            </form>
            SORT
            <button onClick={handleClickRating}>Rating</button>
            <button onClick={handleClickName}>Name</button>
            {[]
                .concat(artists)
                .sort((a, b) => {
                    if (ratingArrowUp) {
                        return b.rating - a.rating;
                    }
                    return a.rating - b.rating;
                })
                .map(artist => {
                    return (
                        <div className="container" key={artist._id}>
                            <div
                                onClick={() => {
                                    handleRemoveArtist(artist._id);
                                }}
                            >
                                Remove
                            </div>
                            <div className="rating">{artist.rating}</div>
                            <img src={artist.image} className="photo" />
                            <div className="name">{artist.name}</div>
                            <button
                                onClick={() => {
                                    handleAddPin(artist);
                                }}
                            >
                                Pin
                            </button>
                        </div>
                    );
                })}
        </div>
    );
};

export default Interface;
