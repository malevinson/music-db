import React, { Component } from 'react';
import View from './components/View';
import update from 'immutability-helper';
import { titleCaseString } from './helpers';
import './styles/css/App.css';

export const uiMap = {
    rating: 'Rating',
    name: 'Name',
    date: 'Date',
    shuffle: 'Shuffle'
};

export const sortMap = {
    Rating: 'rating',
    Name: 'name',
    Date: 'createdAt'
    // Shuffle: 'shuffle'
};

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            uiState: {
                input: {
                    rating: '',
                    artist: '',
                    edit: '',
                    filter: ''
                },
                sort: {
                    sortUp: false,
                    activeSort: uiMap.rating
                },
                pinned: [],
                currentEdit: '',
                showFlashMsg: false,
                flashMsg: null
            },
            app: { artists: [], ids: {} }
        };
    }

    componentDidMount() {
        const url = '/artists';

        this.buildRequest(url).then(data => {
            let ids = {};
            let pinned = [];
            data.forEach((artist, index) => {
                ids[artist._id] = index;
                if (artist.pinned) {
                    pinned.push(artist._id);
                }
            });
            this.setState({
                app: {
                    artists: data,
                    ids
                },
                uiState: {
                    ...this.state.uiState,
                    pinned
                }
            });
        });
    }

    showFlashMsg(msg) {
        const newState = update(this.state, {
            uiState: {
                showFlashMsg: { $set: !this.state.uiState.showFlashMsg },
                flashMsg: { $set: msg }
            }
        });
        this.setState(newState);

        setTimeout(() => {
            const newState = update(this.state, {
                uiState: { showFlashMsg: { $set: !this.state.uiState.showFlashMsg } }
            });
            this.setState(newState);
        }, 2000);
    }

    handleEvent = ({ action, e, id, type }) => {
        switch (action) {
            case 'inputChange':
                this.handleInputChange(e);
                break;
            case 'edit':
                this.handleEdit(id);
                break;
            case 'create':
                e.preventDefault();
                this.createArtist();
                break;
            case 'delete':
                this.deleteArtist(id);
                break;
            case 'update':
                this.updateArtist(id);
                break;
            case 'togglePin':
                this.handleTogglePin(id);
                break;
            case 'sort':
                this.handleSort(type);
                break;
            default:
                break;
        }
    };

    handleSort(type) {
        const { sort } = this.state.uiState;
        if (sort.activeSort === type) {
            const newState = update(this.state, {
                uiState: { sort: { sortUp: { $set: !sort.sortUp } } }
            });
            this.setState(newState);
        } else {
            const newState = update(this.state, {
                uiState: { sort: { activeSort: { $set: type } } }
            });
            this.setState(newState);
        }
    }

    handleInputChange(e) {
        const newState = update(this.state, {
            uiState: { input: { [e.target.name]: { $set: e.target.value } } }
        });
        this.setState(newState);
    }

    handleTogglePin(id) {
        let currPins = this.state.uiState.pinned;
        const pinIndex = currPins.indexOf(id);
        let pinned;

        const { app } = this.state;
        const { artists, ids } = app;
        const artistIndex = ids[id];
        const currentArtistData = artists[artistIndex];

        if (pinIndex !== -1) {
            currPins.splice(pinIndex, 1);
            this.setState({
                uiState: {
                    ...this.state.uiState,
                    pinned: currPins
                }
            });
        } else {
            pinned = true;
            this.setState({
                uiState: {
                    ...this.state.uiState,
                    pinned: currPins.concat(id)
                }
            });
        }

        const requestBody = {
            ...currentArtistData,
            pinned
        };

        const url = '/artist/' + id;
        this.buildRequest(url, 'PUT', requestBody);
    }

    handleEdit = id => {
        const { artists, ids } = this.state.app;
        const currentRating = artists[ids[id]].rating;

        const newState = update(this.state, {
            uiState: {
                currentEdit: { $set: id },
                input: {
                    edit: { $set: currentRating }
                }
            }
        });

        this.setState(newState);
    };

    createArtist() {
        const { input } = this.state.uiState;
        const formatedArtist = titleCaseString(input.artist).trim();
        const formatedRating = parseInt(input.rating.trim());

        if (formatedArtist.length < 2) {
            let err = 'Enter at least 2 characters';
            console.log(err);
            this.showFlashMsg(`Error: ${err}`);
            this.handleError(err);
            return;
        }

        if (formatedRating < 1 || formatedRating > 100) {
            let err = 'Invalid rating';
            console.log(err);
            this.showFlashMsg(`Error: ${err}`);
            this.handleError(err);
            return;
        }

        let isValidArtist = true;

        this.state.app.artists.forEach(artist => {
            if (artist.name === formatedArtist) {
                let err = 'Duplicate artist, try again';
                isValidArtist = false;
                console.log(err);
                this.showFlashMsg(`Error: ${err}`);
                this.handleError(err);
            }
        });

        if (!isValidArtist) return;

        const requestBody = { name: formatedArtist, rating: formatedRating };
        const url = '/artists';

        this.buildRequest(url, 'POST', requestBody).then(data => {
            this.setState(prevState => {
                return {
                    app: {
                        artists: prevState.app.artists.concat(data.artist),
                        ids: {
                            ...prevState.app.ids,
                            [data.artist._id]: prevState.app.artists.length
                        }
                    },
                    uiState: {
                        ...prevState.uiState,
                        input: {
                            ...prevState.uiState.input,
                            artist: ''
                        }
                    }
                };
            });
            this.showFlashMsg(`Artist "${data.artist.name}" added!`);
        });
    }

    // triggerReminder() {
    //     console.log('BEEP!!');
    // }

    // handleSubmitReminder = e => {
    //     e.preventDefault();
    //     this.setState({ timerStartTime: Date.now() }, () => {
    //         const { inputReminder, reminderText } = this.state;
    //         let timerId;
    //         let stopwatchId;
    //         let storedTimer;
    //         if (reminderText === 'Start Timer' && inputReminder.length && !isNaN(inputReminder)) {
    //             function renderTime() {
    //                 // console.log((storedTimer * 1000 - (Date.now() - timerStartTime)) / 1000);
    //             }
    //             storedTimer = inputReminder;
    //             timerId = setInterval(this.triggerReminder, 1000 * storedTimer);
    //             renderTime();
    //             stopwatchId = setInterval(renderTime, 100);

    //             this.setState({
    //                 reminderText: 'Stop Timer',
    //                 timerId,
    //                 stopwatchId
    //             });
    //         } else if (reminderText === 'Stop Timer') {
    //             clearInterval(this.state.timerId);
    //             clearInterval(this.state.stopwatchId);
    //             this.setState({
    //                 reminderText: 'Start Timer'
    //             });
    //         }
    //     });
    // };

    deleteArtist(id) {
        const url = '/artist/' + id;
        const { app, uiState } = this.state;
        const { ids, artists } = app;
        const { pinned } = uiState;

        this.buildRequest(url, 'DELETE').then(res => {
            const idList = ids;
            const index = idList[id];
            const deletedArtistName = artists[index].name;
            let prevState = artists;
            delete idList[id];
            prevState.splice(index, 1);

            let pinIndex = pinned.indexOf(id);
            let pins = this.state.uiState.pinned;
            pins.splice(pinIndex, 1);

            this.setState({
                app: { artists: prevState, ids: idList },
                uiState: { ...this.state.uiState, pinned: pins }
            });

            this.showFlashMsg(`Artist "${deletedArtistName}" deleted!`);
        });
    }

    updateArtist(id) {
        const { app, uiState } = this.state;
        const { artists, ids } = app;
        const artistIndex = ids[id];
        const currentArtistData = artists[artistIndex];

        if (currentArtistData.rating === uiState.input.edit) {
            const newState = update(this.state, { uiState: { currentEdit: { $set: '' } } });
            this.setState(newState);
            return;
        }

        const requestBody = {
            ...currentArtistData,
            rating: uiState.input.edit
        };
        const url = '/artist/' + id;

        this.buildRequest(url, 'PUT', requestBody).then(data => {
            let newList = artists;
            newList[artistIndex] = requestBody;

            const newState = update(this.state, {
                uiState: {
                    currentEdit: { $set: '' }
                },
                app: { artists: { $set: newList } }
            });

            this.setState(newState);
            this.showFlashMsg(`Artist "${currentArtistData.name}" updated!`);
        });
    }

    buildRequest(urlSuffix, method, requestBody) {
        return new Promise((resolve, reject) => {
            let fetchParams;

            if (method === 'POST' || method === 'PUT') {
                fetchParams = {
                    body: JSON.stringify(requestBody),
                    headers: {
                        'content-type': 'application/json'
                    },
                    method
                };
            } else if (method === 'DELETE' || method === null) {
                fetchParams = {
                    method
                };
            }

            const url = '/api' + urlSuffix;
            let status;
            fetch(url, fetchParams)
                .then(res => {
                    status = res.status;
                    return res.json();
                })
                .then(data => {
                    if (status >= 400) {
                        throw new Error(data.error);
                    }
                    resolve(data);
                })
                .catch(err => {
                    console.log(err);
                    this.showFlashMsg(`Error: ${err}`);
                    this.handleError(err);
                });
        });
    }

    handleError(err) {
        // TODO, client facing error msg
    }

    render() {
        const { app, uiState } = this.state;

        console.log('State |||||||---------->');
        console.log(this.state);

        return (
            <View
                {...{
                    uiState,
                    app
                }}
                handleEvent={this.handleEvent}
            />
        );
    }
}

export default App;
