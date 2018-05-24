import React, { Component } from 'react';
import View from './components/View';

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            /*UI VALUES */
            inputArtist: '',
            inputRating: '',
            inputRatingEdit: '',
            inputReminder: '',
            checkboxPopup: false,
            checkboxSound: true,
            ratingArrowUp: false,
            reminderText: 'Start Timer',
            timerStartTime: null,
            currentEdit: '',
            /*APP STATE */
            pinned: [],
            artists: [],
            ids: {}
        };
    }

    componentDidMount() {
        const url = '/api/artists';
        fetch(url)
            .then(res => res.json())
            .then(res => {
                let ids = {};
                res.forEach((artist, index) => {
                    ids[artist._id] = index;
                });
                this.setState({
                    ids,
                    artists: res
                });
            });
        // fetch('/users', {
        //     method: 'GET'
        // }).then(function(response) {
        //     if (response.status >= 400) {
        //         throw new Error("Bad response from server");
        //     }
        //     return response.json();
        // }).then(function(data) {
        //     self.setState({users: data});
        // }).catch(err => {
        // console.log('caught it!',err);
        // })
    }

    handleChangeArtist = e => {
        this.setState({
            inputArtist: e.target.value
        });
    };

    handleChangeReminder = e => {
        this.setState({
            inputReminder: e.target.value
        });
    };

    handleClickRating = e => {
        e.preventDefault();
        this.setState(prevState => {
            return { ratingArrowUp: !prevState.ratingArrowUp };
        });
    };

    handleChangeRating = e => {
        this.setState({
            inputRating: e.target.value
        });
    };

    handleClickNumber = id => {
        this.setState({ currentEdit: id });
    };

    handleClickName = e => {
        //sort by name
    };

    handleSubmitArtist = e => {
        e.preventDefault();

        const { inputArtist, inputRating } = this.state;
        const url = '/api/artists';

        const requestBody = { name: inputArtist, rating: inputRating };

        this.buildRequest(url, requestBody, 'POST', data => {
            this.setState(prevState => {
                return {
                    artists: prevState.artists.concat(data.artist),
                    ids: {
                        ...this.state.ids,
                        [data.artist._id]: prevState.artists.length
                    }
                };
            });
        });

        // fetch(url, {
        //     body: JSON.stringify({
        //         name: inputArtist,
        //         rating: inputRating
        //     }),
        //     headers: {
        //         'content-type': 'application/json'
        //     },
        //     method: 'POST'
        // })
        //     .then(res => res.json())
        //     .then(res => {
        //         this.setState(prevState => {
        //             return {
        //                 artists: prevState.artists.concat(res.artist),
        //                 ids: {
        //                     ...this.state.ids,
        //                     [res.artist._id]: prevState.artists.length
        //                 }
        //             };
        //         });
        //     });
    };

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

    handleChangeCheckboxPopup = e => {
        this.setState(prevState => {
            return { checkboxPopup: !prevState.checkboxPopup };
        });
    };

    handleChangeCheckboxSound = e => {
        this.setState(prevState => {
            return { checkboxSound: !prevState.checkboxSound };
        });
    };

    handleRemovePin = id => {
        const prevPins = this.state.pinned;
        const index = prevPins.indexOf(id);
        prevPins.splice(index, 1);

        this.setState({
            pinned: prevPins
        });
    };

    handleAddPin = artist => {
        const prevPins = this.state.pinned;
        if (prevPins.includes(artist)) {
            //check before handling click instead of here?
            return;
        }
        this.setState({
            pinned: prevPins.concat(artist)
        });
    };

    handleRemoveArtist = id => {
        const url = '/api/artist/';

        fetch(url + id, { method: 'delete' })
            .then(res => {
                return res.json();
            })
            .then(res => {
                let prevState = this.state.artists;
                // prevState.forEach((artist, i) => {
                //     if (artist._id === res._id) {
                //         index = i;
                //     }
                // });

                let idList = this.state.ids;
                let index = idList[id];
                delete idList[id];
                prevState.splice(index, 1);
                this.setState({ artists: prevState, ids: idList });
            });
    };

    handleUpdateArtist = (e, id) => {
        e.preventDefault();

        const { inputRatingEdit } = this.state;

        const url = '/api/artist/';
        const stateIdArtist = this.state.ids[id];
        const currentArtistData = this.state.artists[this.state.ids[id]];
        const newData = {
            ...currentArtistData,
            rating: inputRatingEdit
        };
        fetch(url + id, {
            body: JSON.stringify(newData),
            headers: {
                'content-type': 'application/json'
            },
            method: 'PUT'
        })
            .then(res => res.json())
            .then(res => {
                const newList = this.state.artists;
                newList[stateIdArtist] = newData;

                this.setState(prevState => {
                    return {
                        artists: newList,
                        currentEdit: ''
                    };
                });
            });

        // fetch('/users/new', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(data)
        // })
        //     .then(function(response) {
        //         if (response.status >= 400) {
        //             throw new Error('Bad response from server');
        //         }
        //         return response.json();
        //     })
        //     .then(function(data) {
        //         console.log(data);
        //         if (data == 'success') {
        //             this.setState({ msg: 'Thanks for registering' });
        //         }
        //     })
        //     .catch(function(err) {
        //         console.log(err);
        //     });
    };

    buildRequest(url, requestBody, method, callback) {
        let status;
        fetch(url, {
            body: JSON.stringify(requestBody),
            headers: {
                'content-type': 'application/json'
            },
            method
        })
            .then(res => {
                status = res.status;
                return res.json();
            })
            .then(data => {
                if (status >= 400) {
                    throw new Error(data.error);
                }
                callback(data);
            })
            .catch(err => {
                console.log(err);
            });
    }

    handleEditRating = e => {
        this.setState({ inputRatingEdit: e.target.value });
    };

    render() {
        const {
            //UI VALUES
            inputArtist,
            inputRating,
            inputReminder,
            checkboxPopup,
            inputRatingEdit,
            checkboxSound,
            currentEdit,
            //APP STATE
            artists,
            pinned,
            ratingArrowUp,
            reminderText
        } = this.state;

        console.log('State |||||||---------->');
        console.log(this.state);

        return (
            <View
                {...{
                    /*UI VALUES*/
                    inputArtist,
                    inputRating,
                    inputReminder,
                    inputRatingEdit,
                    checkboxPopup,
                    checkboxSound,
                    ratingArrowUp,
                    reminderText,
                    currentEdit,
                    /*APP STATE*/
                    artists,
                    pinned
                }}
                /*FUNCTIONS*/
                handleClickNumber={this.handleClickNumber}
                handleClickArtist={this.handleClickArtist}
                handleChangeArtist={this.handleChangeArtist}
                handleChangeReminder={this.handleChangeReminder}
                handleAddPin={this.handleAddPin}
                handleRemoveArtist={this.handleRemoveArtist}
                handleEditRating={this.handleEditRating}
                handleRemovePin={this.handleRemovePin}
                handleChangeRating={this.handleChangeRating}
                handleClickName={this.handleClickName}
                handleClickRating={this.handleClickRating}
                handleSubmitArtist={this.handleSubmitArtist}
                handleSubmitReminder={this.handleSubmitReminder}
                handleChangeCheckboxPopup={this.handleChangeCheckboxPopup}
                handleChangeCheckboxSound={this.handleChangeCheckboxSound}
                handleUpdateArtist={this.handleUpdateArtist}
            >
                {/*  */}
            </View>
        );
    }
}

export default App;
