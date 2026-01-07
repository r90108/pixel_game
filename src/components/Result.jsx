import React, { useEffect, useState, useRef } from 'react';
import { submitScore } from '../services/api';

const Result = ({ result, onRestart }) => {
    const [loading, setLoading] = useState(true);
    const [scoreData, setScoreData] = useState(null);
    const [error, setError] = useState('');
    const [showReview, setShowReview] = useState(false);

    const hasSubmitted = useRef(false);

    useEffect(() => {
        if (hasSubmitted.current) return;
        hasSubmitted.current = true;

        // result here is { id, answers, questions } passed from Game
        const calculateScore = async () => {
            try {
                const resp = await submitScore(result);
                if (resp && resp.status === 'success') {
                    setScoreData(resp);
                } else {
                    setError(resp.message || 'Invalid server response');
                }
            } catch (e) {
                console.error(e);
                setError('Failed to calculate score');
            } finally {
                setLoading(false);
            }
        };
        calculateScore();
    }, [result]);

    if (loading) {
        return (
            <div className="pixel-card text-center">
                <h2 className="animate-pulse">CALCULATING SCORE...</h2>
            </div>
        );
    }

    if (error || !scoreData) {
        return (
            <div className="pixel-card text-center">
                <h2 style={{ color: 'red' }}>ERROR</h2>
                <p>{error}</p>
                <button onClick={onRestart} className="mt-4">BACK TO HOME</button>
            </div>
        );
    }

    const rawScore = scoreData.score; // 0-100 from server
    const correctCount = scoreData.correctCount;
    const total = scoreData.total;
    const reviewData = scoreData.reviewData || [];
    const questions = result.questions || [];

    // Use server 'passed' if available, otherwise fallback (though server should provide it)
    const passed = scoreData.passed !== undefined
        ? scoreData.passed
        : (correctCount >= parseInt(import.meta.env.VITE_PASS_THRESHOLD || 3));

    // Render Review Section
    if (showReview) {
        return (
            <div className="pixel-card" style={{ maxWidth: '800px' }}>
                <h2 className="text-center mb-6" style={{ color: 'var(--color-primary)' }}>REVIEW ANSWERS</h2>
                <div className="flex flex-col gap-6" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                    {questions.map((q, idx) => {
                        const reviewItem = reviewData.find(r => String(r.qId) === String(q.id));
                        const userAns = reviewItem ? reviewItem.userAns : '-';
                        const correctAns = reviewItem ? reviewItem.correctAns : '?';
                        const isCorrect = reviewItem ? reviewItem.isCorrect : false;

                        return (
                            <div key={q.id} style={{ border: '2px solid #fff', padding: '15px', background: isCorrect ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)' }}>
                                <p className="mb-2" style={{ fontSize: '0.9rem', textAlign: 'left' }}>
                                    <span style={{ color: '#f1c40f' }}>Q{idx + 1}.</span> {q.text}
                                </p>
                                <div className="text-sm" style={{ textAlign: 'left' }}>
                                    <div className="flex flex-col gap-2 mt-2">
                                        {Object.entries(q.options).map(([optKey, optText]) => {
                                            const isUserChoice = String(optKey) === String(userAns);
                                            const isCorrectChoice = String(optKey) === String(correctAns);

                                            // Style logic:
                                            // Correct Answer: Green Text/BG
                                            // User Wrong Answer: Red Text/BG
                                            // Others: Dimmed

                                            let bgColor = 'transparent';
                                            let textColor = '#bdc3c7'; // default grey

                                            if (isCorrectChoice) {
                                                bgColor = 'rgba(46, 204, 113, 0.2)';
                                                textColor = '#2ecc71';
                                            } else if (isUserChoice) {
                                                bgColor = 'rgba(231, 76, 60, 0.2)';
                                                textColor = '#e74c3c';
                                            }

                                            return (
                                                <div key={optKey} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    padding: '6px 8px',
                                                    backgroundColor: bgColor,
                                                    color: textColor,
                                                    borderRadius: '4px'
                                                }}>
                                                    <span>{optKey}. {optText}</span>
                                                    <span>
                                                        {isUserChoice && (isCorrectChoice ? '✔ (YOU)' : '✘ (YOU)')}
                                                        {!isUserChoice && isCorrectChoice && '✔ (ANS)'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="text-center mt-6 flex justify-center gap-4">
                    <button onClick={() => setShowReview(false)} style={{ background: '#95a5a6' }}>BACK</button>
                    <button onClick={onRestart}>PLAY AGAIN</button>
                </div>
            </div>
        );
    }

    return (
        <div className="pixel-card text-center">
            <h1 className="mb-4" style={{
                color: passed ? '#2ecc71' : 'var(--color-accent)',
                textShadow: '4px 4px 0 #000',
                fontSize: '2rem'
            }}>
                {passed ? 'CLEAR!' : 'GAME OVER'}
            </h1>

            <div className="mb-6 p-4" style={{ border: '2px dashed #fff' }}>
                <p className="mb-2">SCORE: <span style={{ color: 'var(--color-primary)' }}>{rawScore}</span></p>
                <p>CORRECT: {correctCount} / {total}</p>
            </div>

            <p className="mb-6" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                {passed ? 'CONGRATULATIONS!' : 'TRY HARDER NEXT TIME!'}
            </p>

            <div className="flex flex-col gap-4 items-center">
                <button onClick={() => setShowReview(true)} style={{ background: '#3498db' }}>
                    REVIEW MISTAKES
                </button>
                <button onClick={onRestart}>
                    PLAY AGAIN
                </button>
            </div>
        </div>
    );
};

export default Result;
