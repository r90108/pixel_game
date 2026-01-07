import React, { useEffect, useState, useMemo } from 'react';
import { fetchQuestions } from '../services/api';

// Generates a random seed for the pixel avatar
const getRandomSeed = () => Math.random().toString(36).substring(7);

const Game = ({ userId, subject, questionCount, onFinish }) => {
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: answer }
    const [error, setError] = useState('');

    const hasFetched = React.useRef(false);

    // Load Questions
    useEffect(() => {
        const load = async () => {
            // Reset fetch guard if subject changes? Actually game component remounts usually.
            // But for strict mode safety:
            if (hasFetched.current) return;
            hasFetched.current = true;

            try {
                setLoading(true);
                // Use passed count, fallback to 5
                const count = questionCount || 5;
                const data = await fetchQuestions(count, subject);

                if (data.questions && data.questions.length > 0) {
                    setQuestions(data.questions);
                } else {
                    setError('No questions found for this subject.');
                }
            } catch (e) {
                setError('Failed to load questions.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [subject, questionCount]);

    // Generate boss avatar seed for this level
    const bossSeed = useMemo(() => getRandomSeed(), [currentQIndex]);
    const bossUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${bossSeed}`;

    const handleAnswer = (optionKey) => {
        const currentQ = questions[currentQIndex];
        setAnswers(prev => ({
            ...prev,
            [currentQ.id]: optionKey
        }));

        // Next Question or Finish
        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
        } else {
            // Finish
            const finalAnswers = {
                ...answers,
                [currentQ.id]: optionKey
            };

            onFinish({
                userId: userId,
                answers: finalAnswers,
                total: questions.length,
                questions: questions // Pass full questions for review
                // We can't calc correct count here accurately if we don't know the answers.
                // But for UX, usually we want to know right away.
                // However, given the backend logic, we send answers.
                // Wait, Result.jsx expects `correctCount`.
                // The `submitScore` API returns `correctCount`.
                // So we just pass raw data to Result, let Result call submitScore which returns correctCount?
                // Ah, `onFinish` in App.jsx sets `finalResult`. 
                // If I pass just inputs here, Result needs to fetch score first to display it.
                // Let's adjust `Result.jsx` logic implicitly: 
                // App.jsx: onFinish(data) -> data passed to Result.
                // Result.jsx calls API with data -> API returns score -> Result displays score.
                // So here in Game.jsx, we don't know the score.
                // We pass { id, answers, total: questions.length }
                // Result.jsx will handle the rest. but Result.jsx as I wrote it expects `result.correctCount`.
                // I need to Fix Result.jsx or Game.jsx or App.jsx.
                // Let's Fix App.jsx or Game.jsx flow.
                // Better: Loading state in Game.jsx while submitting?
                // Or Result.jsx handles "Loading Score..." then displays it.
                // I'll keep Game.jsx passing raw info, and Result.jsx will fetch and display.
                // But Result.jsx currently expects `result.correctCount` immediately for render.
                // I will update Result.jsx in a subsequent tool call or fix Game to submit before calling onFinish?
                // Submitting in Game is weird if Result is the screen for it.
                // Let's make App.jsx handle it? No, Component logic is better.
                // PLAN: Game finishes -> Calls onFinish with { ...answers }. 
                // App sets state to RESULT. 
                // Result (new version) mounts -> "Calculating..." -> calls API -> shows score.
                // CURRENT Result.jsx assumes `result` has `correctCount`. I need to change that.
            });
        }
    };

    if (loading) return <div className="text-center">LOADING...</div>;
    if (error) return <div className="text-center" style={{ color: 'red' }}>{error}</div>;

    const currentQ = questions[currentQIndex];

    return (
        <div className="w-full max-w-2xl px-4">
            <div className="flex justify-between items-end mb-4 text-sm" style={{ borderBottom: '4px solid #fff', paddingBottom: '10px' }}>
                <span>PLAYER: {userId}</span>
                <span>STAGE {currentQIndex + 1}/{questions.length}</span>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center mb-6">
                {/* Boss Image */}
                <div className="pixel-card shrink-0" style={{ padding: '10px', background: '#e74c3c' }}>
                    <img src={bossUrl} alt="Boss" width="120" height="120" style={{ imageRendering: 'pixelated' }} />
                    <div className="text-center mt-2 text-xs">BOSS</div>
                </div>

                {/* Question Bubble */}
                <div className="pixel-card flex-grow relative" style={{ minHeight: '120px', display: 'flex', alignItems: 'center' }}>
                    {/* Dialog triangle */}
                    <div style={{
                        position: 'absolute',
                        left: '-20px',
                        top: '50%',
                        marginTop: '-10px',
                        width: '0',
                        height: '0',
                        borderTop: '10px solid transparent',
                        borderBottom: '10px solid transparent',
                        borderRight: '20px solid #fff'
                    }} className="hidden md:block"></div>
                    <div style={{
                        position: 'absolute',
                        left: '-14px',
                        top: '50%',
                        marginTop: '-10px',
                        width: '0',
                        height: '0',
                        borderTop: '10px solid transparent',
                        borderBottom: '10px solid transparent',
                        borderRight: '20px solid var(--color-card-bg)'
                    }} className="hidden md:block"></div>

                    <p style={{ margin: 0 }}>{currentQ.text}</p>
                </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(currentQ.options).map(([key, value]) => (
                    <button
                        key={key}
                        onClick={() => handleAnswer(key)}
                        className="hover:bg-yellow-500 w-full relative"
                        style={{
                            minHeight: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: '10px' // Add some general padding instead
                        }}
                    >
                        <span style={{ color: 'var(--color-primary)', marginRight: '10px' }}>{key}.</span> {value}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Game;
