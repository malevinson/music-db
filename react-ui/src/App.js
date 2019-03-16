import React, { Component } from 'react';
import View from './components/View';
import update from 'immutability-helper';
import { titleCaseString } from './helpers';
import './styles/css/App.css';

export const uiMap = {
    rating: 'Rating',
    name: 'Name',
    date: 'Date',
    shuffle: 'Shuffle',
};

export const sortMap = {
    Rating: 'rating',
    Name: 'name',
    Date: 'createdAt',
    // Shuffle: 'shuffle'
};

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isShowingNofication: false,
            uiState: {
                input: {
                    rating: '',
                    artist: '',
                    edit: '',
                    filter: '',
                    timer: '25',
                },
                sort: {
                    sortUp: false,
                    activeSort: uiMap.rating,
                },
                pinned: [],
                currentEdit: '',
                showFlashMsg: false,
                flashMsg: null,
                timer: {
                    isStopped: true,
                    time: { hours: '', minutes: '', seconds: '', tenths: '' },
                },
            },
            app: { artists: [], ids: {} },
        };
    }

    componentDidMount() {
        const url = '/artists';

        document.addEventListener('DOMContentLoaded', function() {
            if (!Notification) {
                alert('Desktop notifications not available in your browser. Try Chromium.');
                return;
            }

            if (Notification.permission !== 'granted') Notification.requestPermission();
        });

        this.buildRequest(url).then(data => {
            let ids = {};
            let pinned = [];
            data.forEach((artist, index) => {
                ids[artist._id] = index;
                if (artist.pinned) {
                    pinned.push({
                        id: artist._id,
                        pinnedMeta: {
                            ...artist.pinnedMeta,
                        },
                    });
                }
            });
            this.setState({
                app: {
                    artists: data,
                    ids,
                },
                uiState: {
                    ...this.state.uiState,
                    pinned,
                },
            });
        });
    }

    showFlashMsg(msg) {
        const newState = update(this.state, {
            uiState: {
                showFlashMsg: { $set: !this.state.uiState.showFlashMsg },
                flashMsg: { $set: msg },
            },
        });
        this.setState(newState);

        setTimeout(() => {
            const newState = update(this.state, {
                uiState: { showFlashMsg: { $set: !this.state.uiState.showFlashMsg } },
            });
            this.setState(newState);
        }, 2000);
    }

    renderTimer(time) {
        console.log('in renderTimers');

        let displayedTime = time - (Date.now() - this.state.uiState.timer.startTime) / 1000;

        const tenths = Math.floor((displayedTime * 10) % 10);
        let seconds = Math.floor(displayedTime % 60);
        if (seconds.toString().length < 2) {
            seconds = '0' + seconds;
        }
        let minutes = Math.floor((displayedTime / 60) % 60);
        if (minutes.toString().length < 2) {
            minutes = '0' + minutes;
        }

        const hours = Math.floor(displayedTime / (60 * 60));
        // let isAlreadyShowingNotification = false;
        if (displayedTime < 0) {
            // !showNotif;
            // if (!this.state.isAlreadyShowingNotification) {
            this.handleNotification();
            // }
            // let startTime = Date.now();
            // isAlreadyShowingNotification = true;

            // //hack to get shorter beep length since couldn't find beep that was shorter and not annoying
            // setTimeout(() => {
            //     this.setState({
            //         uiState: {
            //             ...this.state.uiState,
            //             timer: {
            //                 ...this.state.uiState.timer,
            //                 startTime,
            //             },
            //         },
            //     });
            // }, 100);
        }
        this.setState({
            uiState: {
                ...this.state.uiState,
                timer: {
                    ...this.state.uiState.timer,
                    time: {
                        hours,
                        minutes,
                        seconds,
                        tenths,
                    },
                },
            },
        });
    }

    handleToggleTimer() {
        if (this.state.uiState.input.timer.length < 1) {
            this.showFlashMsg(`Error: enter a number`);
            return;
        }
        let runningTimer;
        let startTime;
        let shouldShowNotif = true;
        if (this.state.uiState.timer.isStopped) {
            shouldShowNotif = false;
            runningTimer = setInterval(() => this.renderTimer(this.state.uiState.input.timer * 60), 100);
            startTime = Date.now();
        } else {
            clearInterval(this.state.uiState.timer.runningTimer);
        }
        // const isShowingNofication = this.state.isShowingNofication;
        // let temp;
        // if (isShowingNofication) {
        //     temp = false;
        // } else if (this.state.uiState.timer.isStopped) {
        //     temp = true;
        // }
        // console.log({ temp });

        this.setState({
            isShowingNofication: shouldShowNotif,
            uiState: {
                ...this.state.uiState,
                timer: {
                    time: { ...this.state.uiState.timer.time },
                    isStopped: !this.state.uiState.timer.isStopped,
                    startTime,
                    runningTimer,
                },
            },
        });
    }

    handleEvent = ({ action, e, id, type }) => {
        switch (action) {
            case 'inputChange':
                this.handleInputChange(e);
                break;
            case 'toggleTimer':
                this.handleToggleTimer();
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
            case 'toggleCheckbox':
                this.handleCheckbox(e,id);
                break;
            default:
                break;
        }
    };

    handleCheckbox(e,id){
        const { app } = this.state;
        const { artists, ids } = app;
        const pins = this.state.uiState.pinned
        const artistIndex2 = ids[id];
        const mainArtistData = artists[artistIndex2]
        const artistIndex = pins.findIndex(pin=>
            pin.id ===id
         )
        const currentArtistData = pins[artistIndex];
        const isChecked = e.target.checked ? true : false;
        const name = e.target.name      

        let key = 'artist'
        if (name === 'radio' )key = 'radio'
        if (name === 'album' )key = 'album'

         const requestBody = {
            ...currentArtistData,
            ...mainArtistData,
            pinnedMeta: {
                ...currentArtistData.pinnedMeta,
                [key]: isChecked
            }
        };

        this.setState(prevState=> {
            pins[artistIndex].pinnedMeta[key] = isChecked
               return { ...prevState, uiState: {...prevState.uiState,    pinned: pins}} 
            })

        const url = '/artist/' + id;
        this.buildRequest(url, 'PUT', requestBody); 
    }

    handleSort(type) {
        const { sort } = this.state.uiState;
        if (sort.activeSort === type) {
            const newState = update(this.state, {
                uiState: { sort: { sortUp: { $set: !sort.sortUp } } },
            });
            this.setState(newState);
        } else {
            const newState = update(this.state, {
                uiState: { sort: { activeSort: { $set: type } } },
            });
            this.setState(newState);
        }
    }

    handleInputChange(e) {
        const newState = update(this.state, {
            uiState: { input: { [e.target.name]: { $set: e.target.value } } },
        });
        this.setState(newState);
    }

    handleTogglePin(id) {
        let currPins = this.state.uiState.pinned;
        const pinIndex = currPins.findIndex(pinned => pinned.id === id);
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
                    pinned: currPins,
                },
            });
        } else {
            pinned = true;
            this.setState({
                uiState: {
                    ...this.state.uiState,
                    pinned: currPins.concat({ id: id, pinnedMeta: { ...currentArtistData.pinnedMeta } }),
                },
            });
        }

        const requestBody = {
            ...currentArtistData,
            pinned,
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
                    edit: { $set: currentRating },
                },
            },
        });

        this.setState(newState);
    };

    createArtist() {
        const { input } = this.state.uiState;
        const formatedArtist = titleCaseString(input.artist).trim();
        const formatedRating = parseInt(input.rating.trim(), 10);

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
                            [data.artist._id]: prevState.app.artists.length,
                        },
                    },
                    uiState: {
                        ...prevState.uiState,
                        input: {
                            ...prevState.uiState.input,
                            artist: '',
                        },
                    },
                };
            });
            this.showFlashMsg(`Artist "${data.artist.name}" added!`);
        });
    }

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

            let pinIndex = pinned.findIndex(pinned => pinned.id === id);
            let pins = this.state.uiState.pinned;
            pins.splice(pinIndex, 1);

            this.setState({
                app: { artists: prevState, ids: idList },
                uiState: { ...this.state.uiState, pinned: pins },
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
            rating: uiState.input.edit,
        };
        const url = '/artist/' + id;

        this.buildRequest(url, 'PUT', requestBody).then(data => {
            let newList = artists;
            newList[artistIndex] = requestBody;

            const newState = update(this.state, {
                uiState: {
                    currentEdit: { $set: '' },
                },
                app: { artists: { $set: newList } },
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
                        'content-type': 'application/json',
                    },

                    method,
                };
            } else if (method === 'DELETE' || method === null) {
                fetchParams = {
                    method,
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

    handleNotification = () => {
        const { isShowingNofication } = this.state;
        // console.log({  });
        if (!isShowingNofication) {
            if (Notification.permission !== 'granted') Notification.requestPermission();
            else {
                var notification = new Notification('', {
                    icon: './Music-icon.png',
                    body: ' ',
                    requireInteraction: true,
                });
            }
            this.setState({ ...this.state, isShowingNofication: true });
        }
    };

    handleError(err) {
        // TODO, client facing error msg
    }

    render() {
        const { app, uiState } = this.state;
        const { time } = this.state.uiState.timer;

        console.log('State |||||||---------->');
        console.log(this.state);

        return (
            <View
                {...{
                    uiState,
                    app,
                    time,
                }}
                handleEvent={this.handleEvent}
            />
        );
    }
}

export default App;
