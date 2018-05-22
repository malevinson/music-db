import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            message: null,
            fetching: true
        };
    }

    componentDidMount() {
        fetch('/api')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`status ${response.status}`);
                }
                return response.json();
            })
            .then(json => {
                this.setState({
                    message: json.message,
                    fetching: false
                });
            })
            .catch(e => {
                this.setState({
                    message: `API call failed: ${e}`,
                    fetching: false
                });
            });
    }

    handleClick() {
        // const url = 'https://secure-peak-81421.herokuapp.com/api/artists';
        // const url = 'http://localhost:3000/api/artists';
        const url = '/api/artists';
        fetch(url, {
            body: JSON.stringify({
                name: 'LCD soundsystem',
                rating: '90'
            }), // must match 'Content-Type' header
            headers: {
                // 'user-agent': 'Mozilla/4.0 MDN Example',
                'content-type': 'application/json'
            },
            method: 'POST' // *GET, POST, PUT, DELETE, etc.
            // mode: 'cors', // no-cors, cors, *same-origin
        })
            .then(res => res.json())
            .then(res => {
                console.log(
                    '%c' + '||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||',
                    'background: red; color: #83f52c'
                );
                console.log(res);
                // this.setState(prevState => {
                //     return {
                //         artists: prevState.artists.concat(res.artist)
                //     };
                // });
            });
        // fetch('/artists')
        //     .then(response => {
        //         if (!response.ok) {
        //             throw new Error(`status ${response.status}`);
        //         }
        //         return response.json();
        //     })
        //     .then(json => {
        //         this.setState({
        //             message: json.message,
        //             fetching: false
        //         });
        //     })
        //     .catch(e => {
        //         this.setState({
        //             message: `API call failed: ${e}`,
        //             fetching: false
        //         });
        //     });
    }

    getArtists = () => {
        fetch('/api/artists')
            .then(res => res.json())
            .then(res => {
                console.log(
                    '%c' + '||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||',
                    'background: red; color: #83f52c'
                );
                console.log(res);
            });
    };

    render() {
        return (
            <div className="App">
                <div className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <h2>Welcome to React</h2>
                </div>
                <p className="App-intro">{this.state.fetching ? 'Fetching message from API' : this.state.message}</p>
                <button onClick={this.handleClick}>button</button>
                <button onClick={this.getArtists}>get all artists</button>
            </div>
        );
    }
}

export default App;
