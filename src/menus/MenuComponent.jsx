import React from 'react';
import InteractiveCircles from '../assets/InteractiveCircles'; // Importujeme komponentu s interaktivními kruhy

const MenuComponent = ({ onNavigate }) => {
  return (
    <div className='menu-wrap'>
      <h1>Tower Bloxx</h1>
      <nav className='button-wrap'>
        <button onClick={() => onNavigate('game')} className='button-start'>Start Game</button>
        <button onClick={() => onNavigate('leaderboard')}>Leaderboards</button>
      </nav>
      <aside>
        <p>Developed by <a href='https://www.krystofjezek.com' target='blank'>Krystof Jezek</a><InteractiveCircles /></p>
      </aside>
    </div>
  );
};

export default MenuComponent;
