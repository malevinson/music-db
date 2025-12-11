import React from 'react';
import FlashMessage from './FlashMessage';
import PinnedArtists from './PinnedArtists';
import Timer from './Timer/Timer';
import ArtistForm from './ArtistForm';
import SortControls from './SortControls';
import ArtistList from './ArtistList';
import LogoutButton from './LogoutButton';

const View = ({ handleEvent, uiState, app, time, onLogout, user }) => {
  const { artists, ids } = app;
  const { pinned, input, sort, currentEdit, showFlashMsg, flashMsg, timer } = uiState;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div>
        <div>
          <header>Playlist Q</header>
          <FlashMessage showFlashMsg={showFlashMsg} flashMsg={flashMsg} />

          <PinnedArtists
            pinned={pinned}
            artists={artists}
            ids={ids}
            onTogglePin={(id) => handleEvent({ action: 'togglePin', id })}
            onToggleCheckbox={(e, id) => handleEvent({ action: 'toggleCheckbox', e, id })}
          />

          <section>
            <Timer
              timer={timer}
              time={time}
              input={input}
              onInputChange={(e) => handleEvent({ action: 'inputChange', e })}
              onToggleTimer={() => handleEvent({ action: 'toggleTimer' })}
            />
          </section>

          <section>
            <ArtistForm
              input={input}
              onInputChange={(e) => handleEvent({ action: 'inputChange', e })}
              onSubmit={(e) => handleEvent({ action: 'create', e })}
            />
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
      <LogoutButton onLogout={onLogout} user={user} />
    </div>
  );
};

export default View;
