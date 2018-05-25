import React from 'react';
import './View.css';

const View = props => {
    const {
        //UI VALUES
        inputArtist,
        inputRating,
        activeSortButton,
        inputReminder,
        checkboxPopup,
        inputRatingEdit,
        checkboxSound,
        sortArrowUp,
        currentEdit,
        reminderText,
        //FUNCTIONS
        handleClickNumber,
        handleAddPin,
        handleRemoveArtist,
        handleRemovePin,
        handleUpdateArtist,
        handleClickName,
        handleClickRating,
        handleChangeArtist,
        handleChangeReminder,
        handleChangeRating,
        handleEditRating,
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
                    Popup (steals browser focus)
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
                    if (activeSortButton === 'Rating') {
                        if (sortArrowUp) {
                            return b.rating - a.rating;
                        }
                        return a.rating - b.rating;
                    } else if (activeSortButton === 'Name') {
                        if (sortArrowUp) {
                            return b.name - a.name;
                        }
                        return a.name - b.name;
                    }
                })
                .map(artist => {
                    console.log(artist);
                    // console.log(artist._id);
                    return (
                        <div className="container" key={artist._id}>
                            <div
                                onClick={() => {
                                    handleRemoveArtist(artist._id);
                                }}
                            >
                                Remove
                            </div>
                            {currentEdit === artist._id ? (
                                <label>
                                    edit rating<input
                                        placeholder={artist.rating}
                                        name="editrating"
                                        value={inputRatingEdit}
                                        onChange={handleEditRating}
                                    />
                                    <button onClick={e => handleUpdateArtist(e, artist._id)}>Update Rating</button>
                                </label>
                            ) : (
                                <div onClick={() => handleClickNumber(artist._id)} className="rating">
                                    {artist.rating}
                                </div>
                            )}
                            <img src={artist.image} alt="album art" className="photo" />
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

export default View;
