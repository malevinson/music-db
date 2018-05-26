import React from 'react';
import Input from './Input';
import './View.css';

const View = props => {
    const {
        //UI VALUES
        activeSortButton,
        sortArrowUp,
        currentEdit,
        //FUNCTIONS
        handleClickNumber,
        handleEvent,
        handleRemoveArtist,
        handleUpdateArtist,
        handleClickName,
        handleClickRating,
        handleSubmitArtist,
        uiState,
        //APP STATE
        artists,
        pinned,
        ids
    } = props;

    return (
        <div>
            {/* <form onSubmit={handleSubmitReminder}>
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
            </form> */}
            <section className="pinned-section">
                <div>Pinned Artists</div>
                {pinned.map(id => {
                    const artist = artists[ids[id]];
                    return (
                        <div key={artist._id}>
                            {artist.name}
                            <button
                                onClick={() => {
                                    // handleRemovePin(artist._id);

                                    handleEvent({ action: 'togglePin', id: artist._id });
                                }}
                            >
                                Unpin
                            </button>
                        </div>
                    );
                })}
            </section>
            <section>
                <form onSubmit={handleSubmitArtist}>
                    <label>
                        Rating
                        <Input
                            name="rating"
                            value={uiState.input}
                            handleChange={e => {
                                handleEvent({ action: 'inputChange', e });
                            }}
                        />
                    </label>
                    <label>
                        Artist
                        <Input
                            name="artist"
                            value={uiState.input}
                            handleChange={e => {
                                handleEvent({ action: 'inputChange', e });
                            }}
                        />
                    </label>
                    <button onClick={handleSubmitArtist}>Add Artist</button>
                </form>
            </section>
            <section>
                <div className="controls">
                    SORT
                    <button onClick={handleClickRating}>Rating</button>
                    <button onClick={handleClickName}>Name</button>
                </div>
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
                        return null;
                    })
                    .map(artist => {
                        // console.log(artist);
                        // console.log(artist._id);
                        return (
                            <div className="artist" key={artist._id}>
                                <div
                                    onClick={() => {
                                        handleRemoveArtist(artist._id);
                                    }}
                                >
                                    Remove
                                </div>
                                {currentEdit === artist._id ? (
                                    <label>
                                        edit rating
                                        <Input
                                            name="edit"
                                            value={uiState.input}
                                            handleChange={e => {
                                                handleEvent({ action: 'inputChange', e });
                                            }}
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
                                {pinned.indexOf(artist._id) === -1 && (
                                    <button
                                        onClick={() => {
                                            // handleAddPin(artist);
                                            handleEvent({ action: 'togglePin', id: artist._id });
                                        }}
                                    >
                                        Pin
                                    </button>
                                )}
                            </div>
                        );
                    })}
            </section>
        </div>
    );
};

export default View;
