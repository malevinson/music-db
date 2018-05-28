import React, { Component } from 'react';
import View from './components/View';
import update from 'immutability-helper';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            uiState: {
                input: {
                    rating: '',
                    artist: '',
                    edit: ''
                },
                sort: {
                    sortUp: false,
                    activeSort: 'rating'
                },
                pinned: [],
                currentEdit: ''
            },
            app: { artists: [], ids: {} }
        };
    }

    componentDidMount() {
        const url = '/artists';

        this.buildRequest(url).then(data => {
            let ids = {};
            data.forEach((artist, index) => {
                ids[artist._id] = index;
            });
            this.setState({
                app: {
                    artists: data,
                    ids
                }
            });
        });
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
        if (pinIndex !== -1) {
            currPins.splice(pinIndex, 1);
            this.setState({
                uiState: {
                    ...this.state.uiState,
                    pinned: currPins
                }
            });
        } else {
            this.setState({
                uiState: {
                    ...this.state.uiState,
                    pinned: currPins.concat(id)
                }
            });
        }
    }

    handleEdit = id => {
        const newState = update(this.state, {
            uiState: { currentEdit: { $set: id } }
        });
        this.setState(newState);
    };

    createArtist() {
        const { input } = this.state.uiState;
        const url = '/artists';
        const requestBody = { name: input.artist, rating: input.rating };

        this.buildRequest(url, 'POST', requestBody).then(data => {
            this.setState(prevState => {
                return {
                    app: {
                        artists: prevState.app.artists.concat(data.artist),
                        ids: {
                            ...prevState.app.ids,
                            [data.artist._id]: prevState.app.artists.length
                        }
                    }
                };
            });
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
        const { app } = this.state;
        const { ids, artists } = app;

        this.buildRequest(url, 'DELETE').then(res => {
            const idList = ids;
            const index = idList[id];
            let prevState = artists;
            delete idList[id];
            prevState.splice(index, 1);
            this.setState({ app: { artists: prevState, ids: idList } });
        });
    }

    updateArtist(id) {
        const { app, uiState } = this.state;
        const { artists, ids } = app;
        const artistIndex = ids[id];
        const currentArtistData = artists[artistIndex];
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
