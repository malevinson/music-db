import React from 'react';
import FlashMessage from './FlashMessage';
import PinnedArtists from './PinnedArtists';
import Timer from './Timer/Timer';
import ArtistForm from './ArtistForm';
import SortControls from './SortControls';
import ArtistList from './ArtistList';
import LogoutButton from './LogoutButton';
import Input from './Input';

const View = ({ handleEvent, uiState, app, time, onLogout, user }) => {
  const { artists, ids } = app;
  const { pinned, input, sort, currentEdit, showFlashMsg, flashMsg, timer, musicService } = uiState;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div>
        <div>
          <header>
            Playlist Q
            <LogoutButton onLogout={onLogout} user={user} />
          </header>
          <FlashMessage showFlashMsg={showFlashMsg} flashMsg={flashMsg} />

          <PinnedArtists
            pinned={pinned}
            artists={artists}
            ids={ids}
            musicService={musicService}
            onTogglePin={(id) => handleEvent({ action: 'togglePin', id })}
            onToggleCheckbox={(e, id) => handleEvent({ action: 'toggleCheckbox', e, id })}
            onReorderPinned={(dragIndex, hoverIndex) => handleEvent({ action: 'reorderPinned', dragIndex, hoverIndex })}
                />

          <section style={{ maxWidth: '1400px',
    margin: '1.5rem auto .5rem auto' }}>
            <div className="controls-row">
              <div className="controls-row-item" style={{ display: 'flex', alignItems: 'center' , gap: '0.5rem'}}>
                <div style={{ display: 'flex', alignItems: 'center', }}>
                  <label style={{ margin: 0, whiteSpace: 'nowrap' , }}>
                    <span className="notification-label-full">Notification Message</span>
                    <span className="notification-label-short">Msg</span>
                  </label>
                  <Input
                    name="notifMsg"
                    value={input}
                    placeholder="Change artists?"
                    handleChange={(e) => handleEvent({ action: 'inputChange', e })}
                  />
                </div>

                <Timer
                  timer={timer}
                  time={time}
                  input={input}
                  onInputChange={(e) => handleEvent({ action: 'inputChange', e })}
                  onToggleTimer={() => handleEvent({ action: 'toggleTimer' })}
                />
            </div>
              <div style={{ display: 'flex', alignItems: 'center',  }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'column'}}>
                  <label className="queue-links-label">Open Queue Links In</label>
                  <select
                    name="musicService"
                    value={musicService}
                    onChange={(e) => handleEvent({ action: 'toggleMusicService', e })}
                    className="music-service-select"
                  >
                    <option value="googleMusic">YouTube Music</option>
                    <option value="spotify">Spotify</option>
                    <option value="pandora">Pandora</option>
                    <option value="appleMusic">Apple Music</option>
                  </select>
                </div>
                <ArtistForm
                  input={input}
                  onInputChange={(e) => handleEvent({ action: 'inputChange', e })}
                  onSubmit={(e) => handleEvent({ action: 'create', e })}
                />
              </div>
            </div>
            <div className="line" />
            <SortControls
              activeSort={sort.activeSort}
              sortUp={sort.sortUp}
              input={input}
              onSort={(type) => handleEvent({ action: 'sort', type })}
              onInputChange={(e) => handleEvent({ action: 'inputChange', e })}
            />
          </section>
        </div>
      </div>
      <div style={{ height: '1000px', overflow: 'scroll' }}>
        <ArtistList
          artists={artists}
          pinned={pinned}
          input={input}
          sort={sort}
          currentEdit={currentEdit}
          onEdit={(id) => handleEvent({ action: 'edit', id })}
          onUpdate={(id) => handleEvent({ action: 'update', id })}
          onDelete={(id) => handleEvent({ action: 'delete', id })}
          onTogglePin={(id) => handleEvent({ action: 'togglePin', id })}
          onInputChange={(e) => handleEvent({ action: 'inputChange', e })}
        />
      </div>
    </div>
  );
};

export default View;
