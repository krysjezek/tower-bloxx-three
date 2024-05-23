import React, { useState } from 'react';
import MenuComponent from './menus/MenuComponent';
import TowerGame from './Three';
import Leaderboard from './menus/LeaderBoardComponent';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');

  const navigateTo = (screen) => {
      setCurrentScreen(screen);
  };

  useEffect(() => {
    const audio = document.getElementById('background-music');
    if (audio) {
      if (isMusicPlaying) {
        audio.play();
      } else {
        audio.pause();
      }
    }
  }, [isMusicPlaying]);

  return (
      <div className="app">
        <audio id="background-music" loop>
            <source src="./music.mp3" type="audio/mp3" />
                Your browser does not support the audio element.
        </audio>
        <div className="music-controls">
            <button onClick={() => setIsMusicPlaying(!isMusicPlaying)}>
            {isMusicPlaying ? 'Pause Music' : 'Play Music'}
            </button>
        </div>
        {currentScreen === 'menu' && <MenuComponent onNavigate={navigateTo} />}
        {currentScreen === 'game' && <TowerGame onNavigate={navigateTo} />}
        {currentScreen === 'leaderboard' && <Leaderboard onNavigate={navigateTo} />}
      </div>
  );
}

export default App;

