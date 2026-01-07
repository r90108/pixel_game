import React, { useState } from 'react';
import Home from './components/Home';
import Game from './components/Game';
import Result from './components/Result';

function App() {
  const [gameState, setGameState] = useState('HOME'); // HOME, PLAYING, RESULT
  const [userId, setUserId] = useState('');
  const [subject, setSubject] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [finalResult, setFinalResult] = useState(null);

  const startGame = (id, sub, count) => {
    setUserId(id);
    setSubject(sub);
    setQuestionCount(count);
    setGameState('PLAYING');
  };

  const finishGame = (result) => {
    // result contains: userId, answers, total, questions
    setFinalResult(result);
    setGameState('RESULT');
  };

  const restartGame = () => {
    setGameState('HOME');
    setFinalResult(null);
    setUserId('');
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {gameState === 'HOME' && <Home onStart={startGame} />}
      {gameState === 'PLAYING' && <Game userId={userId} subject={subject} questionCount={questionCount} onFinish={finishGame} />}
      {gameState === 'RESULT' && <Result result={finalResult} onRestart={restartGame} />}
    </div>
  );
}

export default App;
