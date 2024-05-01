import React from "react";
import db from "../firebase";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function LeaderBoardComponent({ onNavigate }) {
    const [scores, setScores] = useState([]);

    const formatDate = (firestoreTimestamp) => {
        if (!firestoreTimestamp) return 'N/A'; // Return 'N/A' if no timestamp is provided
    
        const date = firestoreTimestamp.toDate(); // Convert to JavaScript Date object
        const day = date.getDate().toString().padStart(2, '0'); // Get day and pad with zero if necessary
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get month, +1 because months are zero indexed
        const year = date.getFullYear().toString().slice(-2); // Get last two digits of the year
    
        return `${day}. ${month}. ${year}`; // Format: DD. MM. YY
    };
    

    useEffect(() => {
        const scoresRef = query(collection(db, "scores"), orderBy("score", "desc"));
        const unsubscribe = onSnapshot(scoresRef, (snapshot) => {
            const scoresData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setScores(scoresData);
        });

        return () => unsubscribe(); // Clean up listener on unmount
    }, []);

    return (
        <div className="menu-wrap">
            <h1>Leaderboard</h1>
            <table>
                <thead>
                    <tr>
                        <th className="size">#</th>
                        <th>Name</th>
                        <th>Score</th>
                        
                    </tr>
                </thead>
                <tbody>
                    {scores.map((score, index) => (
                        <tr id={"sec"+(index+1)} key={score.id}>
                            <td className='size'>{index + 1}</td>
                            <td>{score.name}</td>
                            <td>{score.score}</td>
                            
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={() => onNavigate('menu')}>Back to Menu</button>
        </div>
    );
}
