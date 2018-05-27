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
        handleClickName,
        handleClickRating,
        uiState,
        //APP STATE
        artists,
        pinned,
        activeSort,
        sortUp,
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
                <form
                    onSubmit={e => {
                        handleEvent({ action: 'create' });
                    }}
                >
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
                    <button>Add Artist</button>
                </form>
            </section>
            <section>
                <div className="controls">
                    SORT
                    <button
                        onClick={() => {
                            handleEvent({ action: 'sort', type: 'rating' });
                        }}
                    >
                        Rating
                    </button>
                    <button
                        onClick={() => {
                            handleEvent({ action: 'sort', type: 'name' });
                        }}
                    >
                        Name
                    </button>
                </div>
                {[]
                    .concat(artists)
                    .sort((a, b) => {
                        if (sortUp) {
                            return a[activeSort] < b[activeSort] ? 1 : -1;
                        }
                        return a[activeSort] > b[activeSort] ? 1 : -1;
                    })
                    .map(artist => {
                        console.log(artist.name);
                        return (
                            <div className="artist" key={artist._id}>
                                <div
                                    onClick={() => {
                                        handleEvent({ action: 'delete', id: artist._id });
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
                                        <button onClick={e => handleEvent({ action: 'update', id: artist._id })}>
                                            Update Rating
                                        </button>
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
