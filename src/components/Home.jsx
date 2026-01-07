import React, { useState } from 'react';

const Home = ({ onStart }) => {
    const [id, setId] = useState('');
    const [subject, setSubject] = useState('教育理念與實務');
    const [count, setCount] = useState(5);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!id.trim()) {
            setError('請輸入 ID');
            return;
        }
        onStart(id.trim(), subject, count);
    };

    return (
        <div className="pixel-card text-center" style={{ maxWidth: '400px' }}>
            <h1 className="mb-4" style={{ color: 'var(--color-primary)', textShadow: '4px 4px 0 #000' }}>
                PIXEL QUIZ
            </h1>
            <p className="mb-4">輸入資料開始挑戰</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
                <div style={{ width: '100%' }}>
                    <label className="block text-left mb-2 text-xs" style={{ color: '#bdc3c7' }}>PLAYER ID</label>
                    <input
                        type="text"
                        value={id}
                        onChange={(e) => {
                            setId(e.target.value);
                            setError('');
                        }}
                        placeholder="輸入名稱/學號"
                        style={{ width: '90%' }}
                    />
                </div>

                <div style={{ width: '100%' }}>
                    <label className="block text-left mb-2 text-xs" style={{ color: '#bdc3c7' }}>SUBJECT</label>
                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        style={{
                            width: '90%',
                            cursor: 'pointer',
                            // Add nice SVG arrow for select since we removed appearance
                            backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 15px center',
                            backgroundSize: '12px'
                        }}
                    >
                        <option value="教育理念與實務">教育理念與實務</option>
                        <option value="學習者發展與適性輔導">學習者發展與適性輔導</option>
                        <option value="課程教學與評量">課程教學與評量</option>
                    </select>
                </div>

                <div style={{ width: '100%' }}>
                    <label className="block text-left mb-2 text-xs" style={{ color: '#bdc3c7' }}>QUESTIONS: {count}</label>
                    <input
                        type="range"
                        min="5"
                        max="20"
                        step="1"
                        value={count}
                        onChange={(e) => setCount(parseInt(e.target.value))}
                        style={{ width: '90%', cursor: 'pointer' }}
                    />
                </div>

                {error && <p style={{ color: 'var(--color-accent)', fontSize: '0.8rem' }}>{error}</p>}

                <button type="submit" className="mt-4">
                    START GAME
                </button>
            </form>

            <div className="mt-4" style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                PRESS START TO BEGIN
            </div>
        </div>
    );
};

export default Home;
