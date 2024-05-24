import React, { useState, useEffect, useRef } from 'react';
import MenuComponent from './menus/MenuComponent';
import TowerGame from './Three';
import LeaderBoard from './menus/LeaderBoardComponent';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('menu'); // State to track the current screen
  const [isMusicPlaying, setIsMusicPlaying] = useState(false); // State to track if the background music is playing
  const audioRef = useRef(null); // Ref to hold the audio element

  // Function to navigate between screens and update the URL hash
  const navigateTo = (screen) => {
    setCurrentScreen(screen);
    window.history.pushState({ screen }, '', `#${screen}`);
  };

  // Function to toggle the background music on and off
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

  // useEffect to handle browser back and forward button navigation
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.screen) {
        setCurrentScreen(event.state.screen);
      } else {
        setCurrentScreen('menu');
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Cleanup function to remove event listener when the component unmounts
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // useEffect to set the initial screen based on the URL hash
  useEffect(() => {
    const initialScreen = window.location.hash.replace('#', '');
    if (initialScreen) {
      setCurrentScreen(initialScreen);
    }
  }, []);

  return (
    <div className="app">
      <audio id="background-music" ref={audioRef} loop>
        <source src="/music2.mp3" type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
      {currentScreen === 'menu' && (
        <div className="music-controls">
          <button onClick={toggleMusic} aria-label={isMusicPlaying ? 'Pause background music' : 'Play background music'} className={isMusicPlaying ? 'music-button-on' : 'music-button-off'}>
            {isMusicPlaying ? 'Music: ON' : 'Music: OFF'}
          </button>
        </div>
      )}
      {currentScreen === 'game' && <TowerGame onNavigate={navigateTo} />}
      <main>
        {currentScreen === 'menu' && <MenuComponent onNavigate={navigateTo} />}
        {currentScreen === 'leaderboard' && <LeaderBoard onNavigate={navigateTo} />}
      </main>
    </div>
  );
}

export default App;
