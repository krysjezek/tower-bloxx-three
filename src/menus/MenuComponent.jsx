
import React from 'react';

const MenuComponent = ({ onNavigate }) => {
  return (
    <div>
        <button onClick={() => onNavigate('game')}>Start Game</button>
        <button onClick={() => onNavigate('leaderboard')}>Leaderboards</button>
    </div>
);
};

export default MenuComponent;
