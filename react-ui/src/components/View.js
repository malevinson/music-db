import React from 'react';
import Input from './Input';
import './View.css';
import Button from './Button';
import classNames from 'classnames';
import { uiMap, sortMap } from '../App.js';
import pinRed from '../images/pin.png';

const View = props => {
    const { handleEvent, uiState, app } = props;
    const { artists, ids } = app;
    const { pinned, input, sort, currentEdit, showFlashMsg, flashMsg } = uiState;
    const { activeSort, sortUp } = sort;

    const shuffle = array => {
        const length = array.length;

        for (let i = length - 1; i > 0; i--) {
            // let j = Math.floor(Math.random() * (i + 1));
            // let temp = array[i];
            // array[i] = array[j];
            // array[j] = temp;
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    return (
        <div>
            <header>Music Dashboard</header>
            <div className={classNames('flash-msg', { show: showFlashMsg }, { hide: !showFlashMsg })}>
                <div>{flashMsg}</div>
            </div>

            <section className="pinned-section">
                <div className="header">
                    <img className="header-img" src={pinRed} />
                    <img className="header-img" src={pinRed} />
                    <img className="header-img" src={pinRed} />
                </div>
                <div className="artist-well">
                    <div className="flex">
                        {pinned.map(id => {
                            console.log(pinned);
                            const artist = artists[ids[id]];
                            return (
                                <div className="relative-wrapper" key={artist._id}>
                                    <img src={artist.image} alt="album art" className="pinned" />
                                    <div
                                        className="x"
                                        onClick={() => {
                                            handleEvent({ action: 'togglePin', id: artist._id });
                                        }}
                                    >
                                        X
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section>
                <form
                    onSubmit={e => {
                        handleEvent({ action: 'create', e });
                    }}
                    method="post"
                >
                    <div className="main">
                        <label>Artist</label>
                        <Input
                            name="artist"
                            placeholder="The Beatles"
                            value={input}
                            handleChange={e => {
                                handleEvent({ action: 'inputChange', e });
                            }}
                        />
                        <label>Rating</label>
                        <Input
                            name="rating"
                            className="rating-form"
                            value={input}
                            placeholder="35"
                            // className="input"
                            handleChange={e => {
                                handleEvent({ action: 'inputChange', e });
                            }}
                        />
                        <button className="primary">Add Artist</button>
                    </div>
                </form>
            </section>
            <section>
                <div className="line" />
                <div className="controls">
                    <div className="button-wrapper">
                        {Object.keys(uiMap).map(key => {
                            const buttonName = uiMap[key];
                            const isActive = activeSort === buttonName;

                            return (
                                <Button
                                    key={buttonName}
                                    className={classNames({ active: isActive })}
                                    onClick={() => {
                                        handleEvent({ action: 'sort', type: buttonName });
                                    }}
                                >
                                    <i
                                        className={classNames(
                                            { show: isActive && sortUp && buttonName !== 'Shuffle' },
                                            'fas fa-arrow-up'
                                        )}
                                    />
                                    {buttonName}
                                    <i
                                        className={classNames(
                                            { show: isActive && !sortUp && buttonName !== 'Shuffle' },
                                            'fas fa-arrow-down'
                                        )}
                                    />
                                </Button>
                            );
                        })}
                    </div>
                    <Input
                        name="filter"
                        // className="rating-form"
                        value={input}
                        handleChange={e => {
                            handleEvent({ action: 'inputChange', e });
                        }}
                    />
                </div>
                {[]
                    .concat(artists)
                    .sort((a, b) => {
                        if (activeSort === 'Shuffle') return shuffle(artists);
                        if (sortUp) {
                            return a[sortMap[activeSort]] < b[sortMap[activeSort]] ? 1 : -1;
                        }
                        return a[sortMap[activeSort]] > b[sortMap[activeSort]] ? 1 : -1;
                    })
                    .filter(artist => {
                        console.log(artist.name);
                        console.log(input.filter);

                        return false || artist.name.toLowerCase().indexOf(input.filter.toLowerCase()) > -1;
                    })
                    .map(artist => {
                        return (
                            <div className="artist" key={artist._id}>
                                <div className="artist-header">
                                    {currentEdit === artist._id ? (
                                        <React.Fragment>
                                            <Input
                                                name="edit"
                                                value={input}
                                                handleChange={e => {
                                                    handleEvent({ action: 'inputChange', e });
                                                }}
                                                className="input-edit"
                                            />
                                            <button
                                                onClick={e => handleEvent({ action: 'update', id: artist._id })}
                                                className="button-edit"
                                            >
                                                Update
                                            </button>
                                        </React.Fragment>
                                    ) : (
                                        <div onClick={() => handleEvent({ action: 'edit', id: artist._id })}>
                                            {artist.rating}
                                        </div>
                                    )}
                                </div>
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
