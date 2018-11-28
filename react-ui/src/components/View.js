import React from 'react';
import Input from './Input';
import Button from './Button';
import classNames from 'classnames';
import { uiMap, sortMap } from '../App.js';
import pinRed from '../images/pin.png';
import pinBlack from '../images/pin2.png';
import HoverImage from 'react-hover-image';

const View = props => {
    const { handleEvent, uiState, app, time } = props;
    const { artists, ids } = app;
    const { pinned, input, sort, currentEdit, showFlashMsg, flashMsg, timer } = uiState;
    const { activeSort, sortUp } = sort;

    const shuffle = array => {
        if (activeSort !== 'Shuffle') return array;
        const length = array.length;

        for (let i = length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const getArtistNameFontSize = name => {
        const length = name.length;
        if (length < 13) {
            return '14px';
        } else {
            return Math.round((9 / length) * 20) + 'px';
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
                    <img className="header-img" alt="pin" src={pinRed} />
                    <img className="header-img" alt="pin" src={pinRed} />
                    <img className="header-img" alt="pin" src={pinRed} />
                </div>
                <div className="artist-well">
                    <div className="flex">
                        {pinned.map(pin => {
                            const id = pin.id;
                            const artist = artists[ids[id]];
                            return (
                                <div className="relative-wrapper" key={artist._id}>
                                    <div className="name">{artist.name}</div>
                                    <img src={artist.image} alt="album art" className="pinned" />
                                    <div className="pin">
                                        <HoverImage
                                            src={pinRed}
                                            hoverSrc={pinBlack}
                                            onClick={() => {
                                                handleEvent({ action: 'togglePin', id: artist._id });
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section>
                <div className="inline-block2">
                    <div className="timer-wrapper">
                        <div className="timer-active">
                            <div
                                className={classNames({ showTimer: !timer.isStopped }, { hideTimer: timer.isStopped })}
                            >
                                <div id="bars">
                                    <div className="bar movement" />
                                    <div className="bar movement" />
                                    <div className="bar movement" />
                                    <div className="bar movement" />
                                    <div className="bar movement" />
                                    <div className="bar movement" />
                                    <div className="bar movement" />
                                    <div className="bar movement" />
                                    <div className="bar movement" />
                                </div>
                                <div className="stopwatch">
                                    <span>{time.hours}:</span>
                                    <span>{time.minutes}:</span>
                                    <span>{time.seconds}.</span>
                                    <span>{time.tenths}</span>
                                </div>
                            </div>
                        </div>
                        Mins
                        <Input
                            name="timer"
                            className="timer-form"
                            value={input}
                            placeholder="25"
                            handleChange={e => {
                                handleEvent({ action: 'inputChange', e });
                            }}
                        />
                        <Button
                            onClick={() => {
                                handleEvent({ action: 'toggleTimer' });
                            }}
                            className="button timer"
                        >
                            {timer.isStopped ? <span>Start</span> : <span>Stop</span>}timer
                        </Button>
                    </div>
                </div>

                <div className="artist-input-wrapper">
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
                                handleChange={e => {
                                    handleEvent({ action: 'inputChange', e });
                                }}
                            />
                            <button className="primary">Add Artist</button>
                        </div>
                    </form>
                </div>
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
                                            'fas fa-arrow-up',
                                        )}
                                    />
                                    {buttonName}
                                    <i
                                        className={classNames(
                                            { show: isActive && !sortUp && buttonName !== 'Shuffle' },
                                            'fas fa-arrow-down',
                                        )}
                                    />
                                </Button>
                            );
                        })}
                        <div className="filter">
                            <Input
                                name="filter"
                                value={input}
                                handleChange={e => {
                                    handleEvent({ action: 'inputChange', e });
                                }}
                            />
                        </div>
                    </div>
                </div>
                {shuffle([].concat(artists))
                    .sort((a, b) => {
                        if (activeSort === 'Shuffle') return 0;
                        if (sortUp) {
                            return a[sortMap[activeSort]] < b[sortMap[activeSort]] ? 1 : -1;
                        }
                        return a[sortMap[activeSort]] > b[sortMap[activeSort]] ? 1 : -1;
                    })
                    .filter(artist => {
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
                                        <div
                                            className="artist-rating"
                                            onClick={() => handleEvent({ action: 'edit', id: artist._id })}
                                        >
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
                                    {pinned.findIndex(pinned => pinned.id === artist._id) === -1 && (
                                        <div
                                            className="pin"
                                            onClick={() => {
                                                handleEvent({ action: 'togglePin', id: artist._id });
                                            }}
                                        >
                                            <HoverImage src={pinBlack} hoverSrc={pinRed} />
                                        </div>
                                    )}
                                </div>
                                <div className="name" style={{ fontSize: getArtistNameFontSize(artist.name) }}>
                                    {artist.name}
                                </div>
                            </div>
                        );
                    })}
            </section>
        </div>
    );
};

export default View;
