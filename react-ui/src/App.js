import React, { Component } from 'react';
import View from './components/View';
import Auth from './components/Auth';
import update from 'immutability-helper';
import { titleCaseString } from './helpers';
import { uiMap } from './constants';
import { buildRequest } from './services/api';
import './styles/css/App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isAuthenticated: false,
      token: null,
      user: null,
      isShowingNofication: false,
      uiState: {
        input: {
          rating: '',
          artist: '',
          edit: '',
          Filter: '',
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
          startTime: null,
          runningTimer: null,
        },
      },
      app: { artists: [], ids: {} },
    };
  }

  componentDidMount() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.setState({
          isAuthenticated: true,
          token,
          user,
        });
        this.loadArtists(token);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.logout();
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      if (!Notification) {
        alert('Desktop notifications not available in your browser.');
        return;
      }
      if (Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    });
  }

  loadArtists = (token = null) => {
    const authToken = token || this.state.token;
    buildRequest('/artists', 'GET', null, authToken, this.logout, this.showFlashMsg)
      .then((data) => {
        const ids = {};
        const pinned = [];
      data.forEach((artist, index) => {
        ids[artist._id] = index;
        if (artist.pinned) {
          pinned.push({
            id: artist._id,
              pinnedMeta: { ...artist.pinnedMeta },
          });
        }
      });
      this.setState({
          app: { artists: data, ids },
          uiState: { ...this.state.uiState, pinned },
        });
      });
  }

  handleAuthSuccess = (token, user) => {
    this.setState({
      isAuthenticated: true,
      token,
      user,
      });
    this.loadArtists(token);
  }

  logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.setState({
      isAuthenticated: false,
      token: null,
      user: null,
      app: { artists: [], ids: {} },
    });
  }

  showFlashMsg = (msg) => {
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

  renderTimer = (totalSeconds, startTime) => {
    const elapsed = (Date.now() - startTime) / 1000;
    const displayedTime = totalSeconds - elapsed;

    console.log('renderTimer', { totalSeconds, startTime, elapsed, displayedTime });

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

    if (displayedTime <= 0 && !this.state.isShowingNofication) {
      console.log('Timer reached zero, calling handleNotification', {
        displayedTime,
        isShowingNofication: this.state.isShowingNofication,
        notificationPermission: Notification.permission
      });
      this.handleNotification();
    }

    this.setState({
      uiState: {
        ...this.state.uiState,
        timer: {
          ...this.state.uiState.timer,
          time: { hours, minutes, seconds, tenths },
        },
      },
    });
  }

  handleToggleTimer = () => {
    if (this.state.uiState.input.timer.length < 1) {
      this.showFlashMsg('Error: enter a number');
      return;
    }

    let runningTimer;
    let startTime;
    let shouldShowNotif = true;

    if (this.state.uiState.timer.isStopped) {
      shouldShowNotif = false;
      startTime = Date.now();
      const timerInput = this.state.uiState.input.timer;
      const timerMinutes = parseInt(timerInput, 10);
      
      console.log('Starting timer', { timerInput, timerMinutes, startTime });
      
      if (isNaN(timerMinutes) || timerMinutes <= 0) {
        this.showFlashMsg('Error: enter a valid number');
        return;
      }
      
      const totalSeconds = timerMinutes * 60;
      
      this.setState({ 
        isShowingNofication: false,
        uiState: {
          ...this.state.uiState,
          timer: {
            time: { ...this.state.uiState.timer.time },
            isStopped: false,
            startTime,
            runningTimer: null,
          },
        },
      }, () => {
        runningTimer = setInterval(
          () => this.renderTimer(totalSeconds, startTime),
          100
        );
        this.setState({
          uiState: {
            ...this.state.uiState,
            timer: {
              ...this.state.uiState.timer,
              runningTimer,
            },
          },
        });
      });
    } else {
      clearInterval(this.state.uiState.timer.runningTimer);
      this.setState({
        isShowingNofication: shouldShowNotif,
        uiState: {
          ...this.state.uiState,
          timer: {
            time: { ...this.state.uiState.timer.time },
            isStopped: true,
            startTime: null,
            runningTimer: null,
          },
        },
      });
    }
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
        this.handleCheckbox(e, id);
        break;
      default:
        break;
    }
  }

  handleCheckbox = (e, id) => {
    const { artists, ids } = this.state.app;
    const pins = this.state.uiState.pinned;
    const artistIndex2 = ids[id];
    const mainArtistData = artists[artistIndex2];
    const artistIndex = pins.findIndex((pin) => pin.id === id);
    const currentArtistData = pins[artistIndex];
    const isChecked = e.target.checked;
    const name = e.target.name;

    let key = 'artist';
    if (name === 'radio') key = 'radio';
    if (name === 'album') key = 'album';

    const requestBody = {
      ...currentArtistData,
      ...mainArtistData,
      pinnedMeta: {
        ...currentArtistData.pinnedMeta,
        [key]: isChecked,
      },
    };

    this.setState((prevState) => {
      pins[artistIndex].pinnedMeta[key] = isChecked;
      return { ...prevState, uiState: { ...prevState.uiState, pinned: pins } };
    });

    buildRequest(`/artist/${id}`, 'PUT', requestBody, this.state.token, this.logout, this.showFlashMsg);
  }

  handleSort = (type) => {
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

  handleInputChange = (e) => {
    const newState = update(this.state, {
      uiState: { input: { [e.target.name]: { $set: e.target.value } } },
    });
    this.setState(newState);
  }

  handleTogglePin = (id) => {
    let currPins = this.state.uiState.pinned;
    const pinIndex = currPins.findIndex((pinned) => pinned.id === id);
    const { artists, ids } = this.state.app;
    const artistIndex = ids[id];
    const currentArtistData = artists[artistIndex];

    if (pinIndex !== -1) {
      currPins.splice(pinIndex, 1);
      this.setState({
        uiState: { ...this.state.uiState, pinned: currPins },
      });
    } else {
      this.setState({
        uiState: {
          ...this.state.uiState,
          pinned: currPins.concat({
            id: id,
            pinnedMeta: { ...currentArtistData.pinnedMeta },
          }),
        },
      });
    }

    const requestBody = {
      ...currentArtistData,
      pinned: pinIndex === -1,
    };

    buildRequest(`/artist/${id}`, 'PUT', requestBody, this.state.token, this.logout, this.showFlashMsg);
  }

  handleEdit = (id) => {
    const { artists, ids } = this.state.app;
    const currentRating = artists[ids[id]].rating;

    const newState = update(this.state, {
      uiState: {
        currentEdit: { $set: id },
        input: { edit: { $set: currentRating } },
      },
    });
    this.setState(newState);
  }

  createArtist = () => {
    const { input } = this.state.uiState;
    const formatedArtist = titleCaseString(input.artist).trim();
    const formatedRating = parseInt(input.rating.trim(), 10);

    if (formatedArtist.length < 2) {
      this.showFlashMsg('Error: Enter at least 2 characters in the artist field');
      return;
    }

    if (formatedRating < 1 || formatedRating > 100) {
      this.showFlashMsg('Error: Invalid rating');
      return;
    }

    const isDuplicate = this.state.app.artists.some(
      (artist) => artist.name === formatedArtist
    );

    if (isDuplicate) {
      this.showFlashMsg('Error: Duplicate artist, try again');
      return;
    }

    const requestBody = { name: formatedArtist, rating: formatedRating };
    buildRequest('/artists', 'POST', requestBody, this.state.token, this.logout, this.showFlashMsg)
      .then((data) => {
        this.setState((prevState) => ({
          app: {
            artists: prevState.app.artists.concat(data.artist),
            ids: {
              ...prevState.app.ids,
              [data.artist._id]: prevState.app.artists.length,
            },
          },
          uiState: {
            ...prevState.uiState,
            input: { ...prevState.uiState.input, artist: '' },
          },
        }));
      this.showFlashMsg(`Artist "${data.artist.name}" added!`);
    });
  }

  deleteArtist = (id) => {
    const { artists } = this.state.app;
    const { user } = this.state;
    
    // Prevent deletion if demo account has 4 or fewer artists
    if (user && user.email === 'demo@test.com' && artists.length <= 4) {
      this.showFlashMsg('Demo account cannot have less than 4 artists');
      return;
    }

    buildRequest(`/artist/${id}`, 'DELETE', null, this.state.token, this.logout, this.showFlashMsg)
      .then(() => {
        const { ids, artists } = this.state.app;
        const { pinned } = this.state.uiState;
        const index = ids[id];
        const deletedArtistName = artists[index].name;
        const prevState = artists;
      const idList = ids;
      delete idList[id];
      prevState.splice(index, 1);

        const pinIndex = pinned.findIndex((pinned) => pinned.id === id);
        const pins = this.state.uiState.pinned;
        if (pinIndex !== -1) {
      pins.splice(pinIndex, 1);
        }

      this.setState({
        app: { artists: prevState, ids: idList },
        uiState: { ...this.state.uiState, pinned: pins },
      });

      this.showFlashMsg(`Artist "${deletedArtistName}" deleted!`);
    });
  }

  updateArtist = (id) => {
    const { artists, ids } = this.state.app;
    const artistIndex = ids[id];
    const currentArtistData = artists[artistIndex];

    if (currentArtistData.rating === this.state.uiState.input.edit) {
      const newState = update(this.state, {
        uiState: { currentEdit: { $set: '' } },
      });
      this.setState(newState);
      return;
    }

    const requestBody = {
      ...currentArtistData,
      rating: this.state.uiState.input.edit,
    };

    buildRequest(`/artist/${id}`, 'PUT', requestBody, this.state.token, this.logout, this.showFlashMsg)
      .then(() => {
        const newList = artists;
      newList[artistIndex] = requestBody;

      const newState = update(this.state, {
          uiState: { currentEdit: { $set: '' } },
        app: { artists: { $set: newList } },
      });

      this.setState(newState);
      this.showFlashMsg(`Artist "${currentArtistData.name}" updated!`);
    });
  }

  handleNotification = () => {
    console.log('handleNotification called', {
      permission: Notification.permission,
      isShowingNofication: this.state.isShowingNofication,
      notifMsg: this.state.uiState.input.notifMsg
    });

    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        const inputMessage = this.state.uiState.input.notifMsg;
        const notification = new Notification('Timer Complete', {
          body: inputMessage || 'Timer is up!!!!',
          requireInteraction: true,
        });
        console.log('Notification created successfully', notification);
        this.setState({ isShowingNofication: true });
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    } else if (Notification.permission === 'default') {
      console.log('Requesting notification permission...');
      Notification.requestPermission().then((permission) => {
        console.log('Permission result:', permission);
        if (permission === 'granted') {
          try {
            const inputMessage = this.state.uiState.input.notifMsg;
            const notification = new Notification('Timer Complete', {
              body: inputMessage || 'Timer is up!!!!',
              requireInteraction: true,
            });
            console.log('Notification created after permission granted', notification);
            this.setState({ isShowingNofication: true });
          } catch (error) {
            console.error('Error creating notification after permission:', error);
          }
        } else {
          console.warn('Notification permission denied:', permission);
        }
      }).catch((error) => {
        console.error('Error requesting notification permission:', error);
      });
    } else {
      console.warn('Notification permission is denied');
    }
  }

  render() {
    const { app, uiState, isAuthenticated, user } = this.state;
    const { time } = uiState.timer;

    if (!isAuthenticated) {
      return <Auth onAuthSuccess={this.handleAuthSuccess} />;
    }

    return (
      <View
        uiState={uiState}
        app={app}
        time={time}
        handleEvent={this.handleEvent}
        onLogout={this.logout}
        user={user}
      />
    );
  }
}

export default App;
