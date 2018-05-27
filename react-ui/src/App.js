import React, { Component } from 'react';

// import produce from 'immer';
import update from 'immutability-helper';
import View from './components/View';

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            /*UI VALUES */
            checkboxPopup: false,
            checkboxSound: true,
            sortUp: false,
            activeSortButton: 'Rating',
            activeSort: 'rating',
            reminderText: 'Start Timer',
            timerStartTime: null,
            currentEdit: '',
            /*APP STATE */
            pinned: [],
            artists: [],
            ids: {},
            //
            uiState: {
                input: {
                    rating: '',
                    artist: '',
                    edit: ''
                }
            }
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
                ids,
                artists: data
            });
        });
    }

    handleEvent = ({ action, e, id, type }) => {
        //
        switch (action) {
            case 'inputChange':
                //
                console.log(e);
                console.log(e.target.name);
                this.handleInputChange(e);
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
                //
                this.handleTogglePin(id);
                break;
            case 'sort':
                this.handleSort(type);
            default:
                break;
        }
    };

    handleSort(type) {
        if (this.state.activeSort === type) {
            this.setState(prevState => {
                return { sortUp: !prevState.sortUp };
            });
        } else {
            this.setState({
                activeSort: type
            });
        }
    }

    handleInputChange(e) {
        const newState = update(this.state, {
            uiState: { input: { [e.target.name]: { $set: e.target.value } } }
        });
        this.setState(newState);
    }

    handleTogglePin(id) {
        let currPins = this.state.pinned;
        const pinIndex = currPins.indexOf(id);
        if (pinIndex !== -1) {
            currPins.splice(pinIndex, 1);
            this.setState({
                pinned: currPins
            });
        } else {
            this.setState({
                pinned: currPins.concat(id)
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

    handleClickNumber = id => {
        this.setState({ currentEdit: id });
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
                    artists: prevState.artists.concat(data.artist),
                    ids: {
                        ...prevState.ids,
                        [data.artist._id]: prevState.artists.length
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
        const { ids, artists } = this.state;

        this.buildRequest(url, 'DELETE').then(res => {
            const idList = ids;
            const index = idList[id];
            let prevState = artists;
            delete idList[id];
            prevState.splice(index, 1);
            this.setState({ artists: prevState, ids: idList });
        });
    }

    updateArtist(id) {
        const { ids, artists, uiState } = this.state;
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

            this.setState(prevState => {
                return {
                    artists: newList,
                    currentEdit: ''
                };
            });
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
            checkboxPopup,
            checkboxSound,
            currentEdit,
            activeSortButton,
            //APP STATE
            artists,
            activeSort,
            sortUp,
            pinned,
            sortArrowUp,
            ids,
            uiState,
            reminderText
        } = this.state;

        console.log('State |||||||---------->');
        console.log(this.state);

        return (
            <View
                {...{
                    /*UI VALUES*/
                    activeSortButton,
                    checkboxPopup,
                    checkboxSound,
                    sortArrowUp,
                    reminderText,
                    uiState,

                    activeSort,
                    sortUp,
                    currentEdit,
                    /*APP STATE*/
                    artists,
                    pinned,
                    ids
                }}
                /*FUNCTIONS*/
                handleClickNumber={this.handleClickNumber}
                handleClickArtist={this.handleClickArtist}
                handleClickName={this.handleClickName}
                handleClickRating={this.handleClickRating}
                handleSubmitReminder={this.handleSubmitReminder}
                handleChangeCheckboxPopup={this.handleChangeCheckboxPopup}
                handleChangeCheckboxSound={this.handleChangeCheckboxSound}
                handleEvent={this.handleEvent}
                handleUpdateArtist={this.handleUpdateArtist}
            >
                {/*  */}
            </View>
        );
    }
}

export default App;
