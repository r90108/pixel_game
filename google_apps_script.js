// Google Apps Script Code
// Deploy this as a Web App: Publish > Deploy as web app > Who has access: Anyone
// Copy the 'Current web app URL' and paste it into your .env file as GOOGLE_APP_SCRIPT_URL

function doGet(e) {
    const sheetParam = (e.parameter && e.parameter.action) ? e.parameter.action : 'getQuestions';

    if (sheetParam === 'getQuestions') {
        const count = (e.parameter && e.parameter.count) ? parseInt(e.parameter.count) : null;
        const subject = (e.parameter && e.parameter.subject) ? e.parameter.subject : null;
        return getQuestions(count, subject);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' })).setMimeType(ContentService.MimeType.JSON);
}

// ... lines 15-29 unchanged ...
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action;

        if (action === 'submitScore') {
            return submitScore(data);
        }

        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
}

function getQuestions(requestedCount, subject) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('題目'); // Questions Sheet
    if (!sheet) return errorResponse('Sheet "題目" not found');

    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data = rows.slice(1);

    // Assuming columns: ID, Question, A, B, C, D, Answer, Subject
    // Index: 0, 1, 2, 3, 4, 5, 6, 7
    if (data.length === 0) return errorResponse('No questions found');

    let questions = data.map((row) => ({
        id: row[0],
        text: row[1],
        options: {
            A: row[2],
            B: row[3],
            C: row[4],
            D: row[5]
        },
        answer: row[6],
        subject: row[7] || '' // Subject in col 8 (index 7)
    })).filter(q => q.id && q.text); // Basic filtering

    // Filter by subject if provided
    if (subject) {
        questions = questions.filter(q => q.subject.trim() === subject.trim());
    }

    if (questions.length === 0) return errorResponse('No questions found for this subject');

    const clientQuestions = questions.map(q => ({
        id: q.id,
        text: q.text,
        options: q.options
    }));

    // Random N
    const defaultCount = parseInt(ScriptProperties.getProperty('QUESTION_COUNT') || '5', 10);
    const n = requestedCount || defaultCount;

    // Sort random and slice
    const shuffled = clientQuestions.sort(() => 0.5 - Math.random()).slice(0, n);

    return ContentService.createTextOutput(JSON.stringify({ questions: shuffled })).setMimeType(ContentService.MimeType.JSON);
}

function submitScore(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const answerSheet = ss.getSheetByName('回答'); // Answers Sheet
    if (!answerSheet) return errorResponse('Sheet "回答" not found');

    const questionSheet = ss.getSheetByName('題目');
    const qRows = questionSheet.getDataRange().getValues();
    const qData = qRows.slice(1);

    const answerKey = {};
    qData.forEach(row => {
        if (row[0]) answerKey[row[0]] = row[6];
    });

    let score = 0;
    let correctCount = 0;
    const userAnswers = data.answers || {};
    const totalQuestions = Object.keys(userAnswers).length;

    for (const [qId, userAns] of Object.entries(userAnswers)) {
        const correctAns = answerKey[qId];
        if (correctAns && String(correctAns).trim().toUpperCase() === String(userAns).trim().toUpperCase()) {
            correctCount++;
        }
    }

    score = correctCount * 10;

    // Check Config
    // Allow frontend to specify threshold, fallback to ScriptProp, then default to 3
    const PASS_THRESHOLD = parseInt(data.passThreshold) || parseInt(ScriptProperties.getProperty('PASS_THRESHOLD') || '3', 10);
    // Logic: Pass if correctCount >= Threshold
    // Note: User logic says 'threshold' is 'Pass count' (answer N questions correctly), not raw score.
    // Assuming PASS_THRESHOLD is number of questions.
    const passed = (correctCount >= PASS_THRESHOLD);

    const userId = data.userId;
    const timestamp = new Date();

    const aRows = answerSheet.getDataRange().getValues();
    let rowIndex = -1;

    // Find user (Column A)
    for (let i = 1; i < aRows.length; i++) {
        if (String(aRows[i][0]) === String(userId)) {
            rowIndex = i + 1; // 1-based index
            break;
        }
    }

    if (rowIndex > 0) {
        // Update existing user
        // Cols: ID(1), Count(2), TotalScore(3), MaxScore(4), FirstClearScore(5), AttemptsToPass(6), LastPlayed(7)
        // Indices in row array (0-based): 0, 1, 2, 3, 4, 5, 6

        const currentRow = aRows[rowIndex - 1];
        let playCount = (parseInt(currentRow[1]) || 0) + 1;
        let currentTotal = (parseInt(currentRow[2]) || 0) + score;
        let maxScore = Math.max((parseInt(currentRow[3]) || 0), score);
        let attemptsToPass = parseInt(currentRow[5]) || 0;

        // If not yet passed (attemptsToPass == 0) and now passed
        if (attemptsToPass === 0 && passed) {
            attemptsToPass = playCount;
        }

        // Write updates
        // rowIndex is 1-based.
        answerSheet.getRange(rowIndex, 2).setValue(playCount);
        answerSheet.getRange(rowIndex, 3).setValue(currentTotal);
        answerSheet.getRange(rowIndex, 4).setValue(maxScore);
        if (attemptsToPass > 0 && (parseInt(currentRow[5]) || 0) === 0) {
            answerSheet.getRange(rowIndex, 6).setValue(attemptsToPass);
        }
        answerSheet.getRange(rowIndex, 7).setValue(timestamp);

    } else {
        // New User
        // 1=Passed, 0=Failed for AttemptsToPass? 
        // Logic: "花了幾次通關" -> If passed first try, it's 1. If failed, it's 0 (meaning not yet passed).
        const attemptsToPass = passed ? 1 : 0;

        // For "First Clear Score" (第一次通關分數), if passed now, it's this score. Else 0 or empty?
        // Requirement: "若同 ID 已通關過，後續分數不覆蓋". So for first time, if we pass, we set it.
        // If we don't pass, we don't set it?
        // Let's assume Column 5 is "First Clear Score".
        // If passed, set score. If not, set 0 or "0".
        const firstClearScore = passed ? score : 0;

        answerSheet.appendRow([
            userId,           // ID
            1,                // Play Count
            score,            // Total Score
            score,            // Max Score
            firstClearScore,  // First Clear Score
            attemptsToPass,   // Attempts to Pass
            timestamp         // Last Played
        ]);
    }

    // Generate review data
    const reviewData = [];
    for (const [qId, userAns] of Object.entries(userAnswers)) {
        const correctAns = answerKey[qId];
        const isCorrect = (correctAns && String(correctAns).trim().toUpperCase() === String(userAns).trim().toUpperCase());
        reviewData.push({
            qId: qId,
            userAns: userAns,
            correctAns: correctAns,
            isCorrect: isCorrect
        });
    }

    return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        score: score,
        correctCount: correctCount,
        total: totalQuestions,
        passed: passed,
        reviewData: reviewData
    })).setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: msg })).setMimeType(ContentService.MimeType.JSON);
}
