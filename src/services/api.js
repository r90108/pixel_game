const GAS_URL = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;

// Mock data for development when URL is not set or for testing
const MOCK_QUESTIONS = Array.from({ length: 10 }, (_, i) => ({
    id: `mock_${i + 1}`,
    text: `這是一道測試題目 Q${i + 1}？`,
    options: {
        A: "選項 A",
        B: "選項 B",
        C: "選項 C",
        D: "選項 D"
    }
}));

export const fetchQuestions = async (count = 10, subject = '') => {
    if (!GAS_URL || GAS_URL.includes("YOUR_GAS_DEPLOYMENT_URL")) {
        console.warn("Using Mock Data for Questions");
        return new Promise(resolve => {
            setTimeout(() => {
                // Mock filtering logic could go here, but for now just return slice
                resolve({ questions: MOCK_QUESTIONS.slice(0, count) });
            }, 500);
        });
    }

    try {
        const subjectParam = subject ? `&subject=${encodeURIComponent(subject)}` : '';
        const response = await fetch(`${GAS_URL}?action=getQuestions&count=${count}${subjectParam}`);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching questions:", error);
        throw error;
    }
};

export const submitScore = async (data) => {
    // data: { id: string, answers: { [questionId]: answer } }
    if (!GAS_URL || GAS_URL.includes("YOUR_GAS_DEPLOYMENT_URL")) {
        console.warn("Using Mock Data for Submit Score");
        return new Promise(resolve => {
            setTimeout(() => {
                // Calculate mock score
                const total = Object.keys(data.answers).length;
                const score = Math.floor(Math.random() * 100);
                const correctCount = Math.floor(score / 100 * total);
                const threshold = import.meta.env.VITE_PASS_THRESHOLD || 3;

                // Generate mock review data
                const reviewData = Object.entries(data.answers).map(([qId, ans]) => {
                    const isCorrect = (Math.random() > 0.5); // Random correctness for mock
                    return {
                        qId,
                        userAns: ans,
                        correctAns: isCorrect ? ans : (ans === 'A' ? 'B' : 'A'), // Simple mock logic
                        isCorrect
                    };
                });

                resolve({
                    status: 'success',
                    score: score,
                    correctCount: correctCount,
                    total: total,
                    passed: correctCount >= threshold,
                    reviewData: reviewData
                });
            }, 1000);
        });
    }

    try {
        const response = await fetch(`${GAS_URL}?action=submitScore`, {
            method: "POST",
            body: JSON.stringify({
                action: "submitScore",
                ...data,
                passThreshold: import.meta.env.VITE_PASS_THRESHOLD || 3
            }),
        });
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    } catch (error) {
        console.error("Error submitting score:", error);
        throw error;
    }
};
