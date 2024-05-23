import React, { useRef, useEffect } from 'react';
import './InteractiveCircles.css'; // Přidáme CSS soubor pro animace

const InteractiveCircles = () => {
  const circleRefs = useRef([]);

  useEffect(() => {
    const handleCircleClick = (index) => {
      const circle = circleRefs.current[index];
      circle.classList.add('rotating');
      setTimeout(() => {
        circle.classList.remove('rotating');
      }, 1000); // Doba trvání animace musí odpovídat době definované v CSS
    };

    circleRefs.current.forEach((circle, index) => {
      if (circle) {
        circle.addEventListener('click', () => handleCircleClick(index));
      }
    });

    return () => {
      circleRefs.current.forEach((circle, index) => {
        if (circle) {
          circle.removeEventListener('click', () => handleCircleClick(index));
        }
      });
    };
  }, []);

  return (
    <div id="circles-container">
      {[...Array(5)].map((_, index) => (
        <svg
          key={index}
          ref={el => circleRefs.current[index] = el}
          className="circle"
          width="50"
          height="50"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="40" fill="#ffffff" />
        </svg>
      ))}
    </div>
  );
};

export default InteractiveCircles;
