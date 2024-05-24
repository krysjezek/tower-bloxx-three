import React, { useEffect, useState } from "react";
import db from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

// Function to load the user name from local storage
const loadUserNameFromLocalStorage = () => {
    return localStorage.getItem('userName');
};

export default function LeaderBoardComponent({ onNavigate }) {
    const [scores, setScores] = useState([]); // State to store leaderboard scores
    const userName = loadUserNameFromLocalStorage(); // Retrieve the user name from local storage

    useEffect(() => {
        // Firestore query to fetch scores ordered by score in descending order
        const scoresRef = query(collection(db, "scores"), orderBy("score", "desc"));
        // Subscribe to real-time updates from Firestore
        const unsubscribe = onSnapshot(scoresRef, (snapshot) => {
            const scoresData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setScores(scoresData); // Update state with the fetched scores
        });

        // Cleanup subscription on component unmount
        return () => unsubscribe();
    }, []);

    return (
        <section className="menu-wrap">
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
                        <tr id={"sec" + (index + 1)} key={score.id || index}>
                            <td className='size'>{index + 1}</td>
                            <td style={{ color: score.name === userName ? 'gold' : 'inherit' }}>
                                {score.name}{score.name === userName ? ' (you)' : ''}
                            </td>
                            <td>{score.score}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={() => onNavigate('menu')}>Back to Menu</button>
        </section>
    );
}
