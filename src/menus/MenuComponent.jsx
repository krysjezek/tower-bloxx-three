
import React from 'react';

const MenuComponent = ({ onNavigate }) => {
  return (
    <div className='menu-wrap'>
        <h1>Tower Bloxx</h1>
        <div className='button-wrap'>
          <button onClick={() => onNavigate('game')} className='button-start'>Start Game</button>
          <button onClick={() => onNavigate('leaderboard')}>Leaderboards</button>
        </div>
        <p>Developed by <a href='https://www.krystofjezek.com' target='blank'>Krystof Jezek</a></p>
    </div>
);
};

export default MenuComponent;
