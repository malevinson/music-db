import React from 'react';
import Input from './Input';
import './View.css';
import Button from './Button';
import classNames from 'classnames';
import { uiMap, sortMap } from '../App.js';

const View = props => {
    const { handleEvent, uiState, app } = props;
    const { artists, ids } = app;
    const { pinned, input, sort, currentEdit, showFlashMsg, flashMsg } = uiState;
    const { activeSort, sortUp } = sort;

    return (
        <div>
            <header>Music Dashboard</header>
            <div className={classNames('flash-msg', { show: showFlashMsg }, { hide: !showFlashMsg })}>
                <div>{flashMsg}</div>
            </div>
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
                <div className="pinned-artist-wrapper">
                    {pinned.map(id => {
                        const artist = artists[ids[id]];
                        return (
                            <div className="pinned-artist" key={artist._id}>
                                {/* <div className="relative-wrapper">
                                <img src={artist.image} alt="album art" className="photo pinned" />
                                {artist.name}

                                <div
                                    className="x"
                                    onClick={() => {
                                        handleEvent({ action: 'togglePin', id: artist._id });
                                    }}
                                >
                                    X
                                </div>
                            </div> */}
                                <div>
                                    <div className="relative-wrapper">
                                        {/* <div className="relative-wrapper"> */}
                                        <img src={artist.image} alt="album art" className="photo pinned" />
                                        <div
                                            className="x"
                                            onClick={() => {
                                                handleEvent({ action: 'togglePin', id: artist._id });
                                            }}
                                        >
                                            X
                                        </div>
                                    </div>
                                </div>
                                <div className="pinned-name">{artist.name}</div>
                                {/* </div> */}
                            </div>
                        );
                    })}
                </div>
            </section>
            <section>
                <form
                    onSubmit={e => {
                        handleEvent({ action: 'create', e });
                    }}
                    method="post"
                >
                    <label>
                        Rating
                        <Input
                            name="rating"
                            value={input}
                            handleChange={e => {
                                handleEvent({ action: 'inputChange', e });
                            }}
                        />
                    </label>
                    <label>
                        Artist
                        <Input
                            name="artist"
                            value={input}
                            handleChange={e => {
                                handleEvent({ action: 'inputChange', e });
                            }}
                        />
                    </label>
                    <button className="secondary-color">Add Artist</button>
                </form>
            </section>
            <section>
                <div className="controls">
                    SORT
                    <br />
                    <div className="button-wrapper">
                        {Object.keys(uiMap).map(key => {
                            const buttonName = uiMap[key];
                            const isActive = activeSort === buttonName;
                            // let stylesIcon = isActive && sortUp ? 'show' : 'hide';
                            // const stylesIcon = sortUp => {
                            //     isActive && sortUp ? 'show' : 'hide';
                            // };

                            return (
                                <Button
                                    className={classNames({ active: isActive })}
                                    onClick={() => {
                                        handleEvent({ action: 'sort', type: buttonName });
                                    }}
                                >
                                    <i className={classNames({ show: isActive && sortUp }, 'fas fa-arrow-up')} />
                                    {buttonName}
                                    <i className={classNames({ show: isActive && !sortUp }, 'fas fa-arrow-down')} />
                                </Button>
                            );
                        })}
                        {/* <button
                            onClick={() => {
                                handleEvent({ action: 'sort', type: 'rating' });
                            }}
                            className="active"
                        >
                            <i className="fas fa-arrow-up" />
                            Rating
                            <i className="fas fa-arrow-down" />
                        </button>

                        <button
                            onClick={() => {
                                handleEvent({ action: 'sort', type: 'name' });
                            }}
                        >
                            Name
                        </button>
                        <button
                            onClick={() => {
                                handleEvent({ action: 'sort', type: 'createdAt' });
                            }}
                        >
                            Date Added
                        </button> */}
                    </div>
                </div>
                {[]
                    .concat(artists)
                    .sort((a, b) => {
                        if (sortUp) {
                            return a[sortMap[activeSort]] < b[sortMap[activeSort]] ? 1 : -1;
                        }
                        return a[sortMap[activeSort]] > b[sortMap[activeSort]] ? 1 : -1;
                    })
                    .map(artist => {
                        return (
                            <div className="artist" key={artist._id}>
                                {currentEdit === artist._id ? (
                                    <div>
                                        <label>
                                            <Input
                                                name="edit"
                                                value={input}
                                                handleChange={e => {
                                                    handleEvent({ action: 'inputChange', e });
                                                }}
                                                className="input-edit"
                                            />
                                            <button onClick={e => handleEvent({ action: 'update', id: artist._id })}>
                                                Update
                                            </button>
                                        </label>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => handleEvent({ action: 'edit', id: artist._id })}
                                        className="rating"
                                    >
                                        {artist.rating}
                                    </div>
                                )}
                                <div className="relative-wrapper">
                                    <img src={artist.image} alt="album art" className="photo" />
                                    <div
                                        className="x"
                                        onClick={() => {
                                            handleEvent({ action: 'delete', id: artist._id });
                                        }}
                                    >
                                        X
                                    </div>
                                </div>
                                <div className="name">{artist.name}</div>
                                {pinned.indexOf(artist._id) === -1 && (
                                    <button
                                        onClick={() => {
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
