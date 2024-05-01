import React, { useState } from 'react';
import MenuComponent from './menus/MenuComponent';
import TowerGame from './Three'; // This is your game component
import Leaderboard from './menus/LeaderBoardComponent'; // This component shows the leaderboards
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');

  const navigateTo = (screen) => {
      setCurrentScreen(screen);
  };

  return (
      <div className="app">
          {currentScreen === 'menu' && <MenuComponent onNavigate={navigateTo} />}
          {currentScreen === 'game' && <TowerGame onNavigate={navigateTo} />}
          {currentScreen === 'leaderboard' && <Leaderboard onNavigate={navigateTo} />}
      </div>
  );
}

export default App;

