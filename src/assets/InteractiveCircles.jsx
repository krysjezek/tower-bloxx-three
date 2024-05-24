import React, { useRef, useEffect } from 'react';
import './InteractiveCircles.css'; 

const InteractiveCircles = () => {
  const circleRefs = useRef([]);

  useEffect(() => {
    // Function to handle the hover effect on the circles
    const handleCircleHover = (index) => {
      const circle = circleRefs.current[index]; // Get the specific circle element being hovered
      circle.classList.add('rotating'); 
      setTimeout(() => {
        circle.classList.remove('rotating'); // Remove the 'rotating' class after 1 second to end the animation
      }, 1000); 
    };

    // Add event listeners to each circle for the 'mouseenter' event
    circleRefs.current.forEach((circle, index) => {
      if (circle) {
        circle.addEventListener('mouseenter', () => handleCircleHover(index));
      }
    });

    // Cleanup function to remove event listeners when the component unmounts
    return () => {
      circleRefs.current.forEach((circle, index) => {
        if (circle) {
          circle.removeEventListener('mouseenter', () => handleCircleHover(index));
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
          <circle cx="50" cy="50" r="40" fill="#404040" /> {}
        </svg>
      ))}
    </div>
  );
};

export default InteractiveCircles;
