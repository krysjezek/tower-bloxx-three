import React, { useState, useEffect, useRef } from 'react';
import MenuComponent from './menus/MenuComponent';
import TowerGame from './Three';
import LeaderBoard from './menus/LeaderBoardComponent';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [isMusicPlaying, setIsMusicPlaying] = useState(false); 
  const audioRef = useRef(null);

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
    window.history.pushState({ screen }, '', `#${screen}`);
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error("Error playing music:", error);
        });
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.screen) {
        setCurrentScreen(event.state.screen);
      } else {
        setCurrentScreen('menu');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const initialScreen = window.location.hash.replace('#', '');
    if (initialScreen) {
      setCurrentScreen(initialScreen);
    }
  }, []);

  return (
    <div className="app">
      <audio id="background-music" ref={audioRef} loop>
        <source src="/music.mp3" type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
      <div className="music-controls">
        <button onClick={toggleMusic} aria-label={isMusicPlaying ? 'Pause background music' : 'Play background music'}>
            {isMusicPlaying ? 'Pause Music' : 'Play Music'}
        </button>
      </div>
      {currentScreen === 'game' && <TowerGame onNavigate={navigateTo} />}
      <main>
        {currentScreen === 'menu' && <MenuComponent onNavigate={navigateTo} />}
        {currentScreen === 'leaderboard' && <LeaderBoard onNavigate={navigateTo} />}
      </main>
    </div>
  );
}

export default App;
