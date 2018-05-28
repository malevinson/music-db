import React, { Component } from 'react';

// import produce from 'immer';
import update from 'immutability-helper';
import View from './components/View';

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            /*UI VALUES */
            // checkboxPopup: false,
            // checkboxSound: true,
            // sortUp: false,
            // activeSortButton: 'Rating',
            // activeSort: 'rating',
            // reminderText: 'Start Timer',
            // timerStartTime: null,
            // currentEdit: '',
            /*APP STATE */
            // pinned: [],
            // artists: [],
            // ids: {},
            //
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
                // ids,
                // artists: data
                app: {
                    artists: data,
                    ids
                }
            });
        });
    }

    handleEvent = ({ action, e, id, type }) => {
        //
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
            default:
                break;
        }
    };

    handleSort(type) {
        if (this.state.uiState.sort.activeSort === type) {
            // this.setState(prevState => {
            //     return { sortUp: !prevState.sortUp };
            // });
            const newState = update(this.state, {
                uiState: { sort: { sortUp: { $set: !this.state.uiState.sort.sortUp } } }
            });
            this.setState(newState);
        } else {
            const newState = update(this.state, {
                uiState: { sort: { activeSort: { $set: type } } }
            });
            // this.setState({
            //     // uiState.sort.activeSort: type
            //     uiState:{
            //         sort:
            //     }
            // });
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
            // this.setState({
            //     pinned: currPins
            // });
        } else {
            this.setState({
                uiState: {
                    ...this.state.uiState,
                    pinned: currPins.concat(id)
                }

                // pinned: currPins.concat(id)
            });
        }
    }

    handleClickRating = e => {
        e.preventDefault();
        this.setState(prevState => {
            return {
                sortArrowUp: !prevState.sortArrowUp,
                activeSortButton: 'Rating'
            };
        });
    };

    handleEdit = id => {
        const newState = update(this.state, {
            uiState: { currentEdit: { $set: id } }
        });
        this.setState(newState);
    };

    handleClickName = e => {
        e.preventDefault();
        this.setState(prevState => {
            return {
                sortArrowUp: !prevState.sortArrowUp,
                activeSortButton: 'Name'
            };
        });
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

    triggerReminder() {
        console.log('BEEP!!');
    }

    handleSubmitReminder = e => {
        e.preventDefault();
        this.setState({ timerStartTime: Date.now() }, () => {
            const { inputReminder, reminderText } = this.state;
            let timerId;
            let stopwatchId;
            let storedTimer;
            if (reminderText === 'Start Timer' && inputReminder.length && !isNaN(inputReminder)) {
                function renderTime() {
                    // console.log((storedTimer * 1000 - (Date.now() - timerStartTime)) / 1000);
                }
                storedTimer = inputReminder;
                timerId = setInterval(this.triggerReminder, 1000 * storedTimer);
                renderTime();
                stopwatchId = setInterval(renderTime, 100);

                this.setState({
                    reminderText: 'Stop Timer',
                    timerId,
                    stopwatchId
                });
            } else if (reminderText === 'Stop Timer') {
                clearInterval(this.state.timerId);
                clearInterval(this.state.stopwatchId);
                this.setState({
                    reminderText: 'Start Timer'
                });
            }
        });
    };

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
                // ,{artists: {$set: newList}}
            });
            // this.setState(prevState => {
            //     return {
            //         artists: newList,
            //         currentEdit: ''
            //     };
            // });
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
        //
        // TODO, client facing error msg
    }

    handleEditRating = e => {
        this.setState({ inputRatingEdit: e.target.value });
    };

    render() {
        const {
            //UI VALUES
            // checkboxPopup,
            // checkboxSound,
            // currentEdit,
            // activeSortButton,
            //APP STATE
            // artists,
            // activeSort,
            // sortUp,
            // pinned,
            app,
            // sortArrowUp,
            // ids,
            uiState
            // reminderText
        } = this.state;

        console.log('State |||||||---------->');
        console.log(this.state);

        return (
            <View
                {...{
                    /*UI VALUES*/
                    // activeSortButton,
                    // checkboxPopup,
                    // chekboxSound,
                    // sortArrowUp,
                    // reminderText,
                    uiState,

                    // activeSort,
                    // sortUp,
                    // currentEdit,
                    /*APP STATE*/
                    // artists,
                    app
                    // pinned,
                    // ids
                }}
                /*FUNCTIONS*/
                // handleClickNumber={this.handleClickNumber}
                // handleClickArtist={this.handleClickArtist}
                // handleClickName={this.handleClickName}
                // handleClickRating={this.handleClickRating}
                // handleSubmitReminder={this.handleSubmitReminder}
                // handleChangeCheckboxPopup={this.handleChangeCheckboxPopup}
                // handleChangeCheckboxSound={this.handleChangeCheckboxSound}
                handleEvent={this.handleEvent}
                // handleUpdateArtist={this.handleUpdateArtist}
            >
                {/*  */}
            </View>
        );
    }
}

export default App;
