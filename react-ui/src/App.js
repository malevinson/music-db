import React, { Component } from 'react';
// import { User, Session, Artist } from 'spotify-client';
import View from './components/View';

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            /*UI VALUES */
            inputArtist: '',
            inputRating: '',
            inputReminder: '',
            checkboxPopup: false,
            checkboxSound: true,
            ratingArrowUp: false,
            reminderText: 'Start Timer',
            timerStartTime: null,
            /*APP STATE */
            pinned: [],
            artists: [
                {
                    name: 'Taylor Swift',
                    id: 0,
                    rating: Math.round(Math.random() * 1000, 2),
                    img: 'https://i.scdn.co/image/33bc9128ad82f7d39847b6db6a49d5416502e7e7',
                    pinned: false
                },
                {
                    name: 'Led Zepplin',
                    id: 1,
                    rating: Math.round(Math.random() * 1000, 2),
                    img: 'https://i.scdn.co/image/33bc9128ad82f7d39847b6db6a49d5416502e7e7',
                    pinned: false
                },
                {
                    name: 'Abba',
                    id: 2,
                    rating: Math.round(Math.random() * 1000, 2),
                    img: 'https://i.scdn.co/image/33bc9128ad82f7d39847b6db6a49d5416502e7e7',
                    pinned: false
                },
                {
                    name: 'Bob Marley',
                    id: 3,
                    rating: Math.round(Math.random() * 1000, 2),
                    img: 'https://i.scdn.co/image/33bc9128ad82f7d39847b6db6a49d5416502e7e7',
                    pinned: false
                }
            ]
        };
    }

    componentDidMount() {
        const url = '/api/artists';
        fetch(url)
            .then(res => res.json())
            .then(res => {
                console.log(
                    '%c' + '||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||',
                    'background: red; color: #83f52c'
                );
                console.log(res);
                this.setState({ artists: res });
            });
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

    handleClickNumber = e => {
        //edit rating
    };

    handleClickName = e => {
        //sort by name
    };

    handleSubmitArtist = e => {
        e.preventDefault();

        const { artists, inputArtist, inputRating } = this.state;
        const num = artists.length;

        console.log(
            '%c' + '||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||',
            'background: red; color: #83f52c'
        );
        console.log(inputArtist);
        const url = '/api/artists';
        fetch(url, {
            body: JSON.stringify({
                name: inputArtist,
                rating: inputRating
            }),
            headers: {
                'content-type': 'application/json'
            },
            method: 'POST'
        })
            .then(res => res.json())
            .then(res => {
                console.log(
                    '%c' + '||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||',
                    'background: red; color: #83f52c'
                );
                console.log(res);
                this.setState(prevState => {
                    return {
                        artists: prevState.artists.concat(res.artist)
                    };
                });
            });
    };

    triggerReminder() {
        console.log('BEEP!!');
    }

    handleSubmitReminder = e => {
        e.preventDefault();
        //reset visual timer, then refactor this
        this.setState({ timerStartTime: Date.now() }, () => {
            const { inputReminder, reminderText } = this.state;
            let timer;
            let timerId;
            let stopwatchId;
            let storedTimer;
            if (reminderText === 'Start Timer' && inputReminder.length && !isNaN(inputReminder)) {
                function renderTime() {
                    console.log((storedTimer * 1000 - (Date.now() - timerStartTime)) / 1000);
                }
                const { timerStartTime } = this.state;
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
        const url = '/api/artist';
        fetch(url + id, { method: 'delete' })
            .then(res => res.json())
            .then(res => {
                console.log('LOG |||||||---------->');
                console.log(res);
                //remove id
                let prevState = this.state.artists;
                // this.setState(prevState => {
                let index;
                prevState.forEach((artist, i) => {
                    console.log(
                        '%c' +
                            '||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||',
                        'background: red; color: #83f52c'
                    );
                    console.log(artist._id);
                    if (artist._id === res._id) {
                        index = i;
                    }
                });
                // var index = prevState.indexOf(res);
                console.log(
                    '%c' + '||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||',
                    'background: red; color: #83f52c'
                );
                console.log(index);
                if (index > -1) {
                    prevState.splice(index, 1);
                    // return { artists: prevState };

                    this.setState({ artists: prevState });
                    // });
                }
            });
    };

    render() {
        const {
            //UI VALUES
            inputArtist,
            inputRating,
            inputReminder,
            checkboxPopup,
            checkboxSound,
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
                    checkboxPopup,
                    checkboxSound,
                    ratingArrowUp,
                    reminderText,
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
                handleRemovePin={this.handleRemovePin}
                handleChangeRating={this.handleChangeRating}
                handleClickName={this.handleClickName}
                handleClickRating={this.handleClickRating}
                handleSubmitArtist={this.handleSubmitArtist}
                handleSubmitReminder={this.handleSubmitReminder}
                handleChangeCheckboxPopup={this.handleChangeCheckboxPopup}
                handleChangeCheckboxSound={this.handleChangeCheckboxSound}
                handleSubmitName={this.handleSubmitName}
                handleSubmitRating={this.handleSubmitRating}
            >
                {/*  */}
            </View>
        );
    }
}

export default App;
