// Review page functionality
let allResults = [];
let filteredResults = [];
let currentFilter = 'all';

// Card styling function (copied from main app)
function cardToSpan(card) {
    const suit = card.slice(-1);
    let color = '';
    switch (suit) {
        case '♠': color = '#222'; break;
        case '♥': color = '#d00'; break;
        case '♦': color = '#0074d9'; break;
        case '♣': color = '#228B22'; break;
        default: color = '#222';
    }
    return `<span style="color:${color};font-weight:bold;font-size:1.2em;">${card}</span>`;
}

function loadQuizResults() {
    try {
        const stored = localStorage.getItem('pokerQuizResults');
        console.log('Loading quiz results from localStorage:', stored ? 'found data' : 'no data found');
        if (stored) {
            allResults = JSON.parse(stored);
            console.log('Loaded', allResults.length, 'quiz results');
            // Sort by timestamp, newest first
            allResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } else {
            allResults = [];
        }
    } catch (e) {
        console.error('Error loading quiz results:', e);
        allResults = [];
    }
    
    filteredResults = [...allResults];
}

function displayStats() {
    const statsDiv = document.getElementById('stats');
    
    if (allResults.length === 0) {
        statsDiv.innerHTML = '<div style="color:#888;">No quiz results found. Take some quizzes first!</div>';
        return;
    }
    
    const totalQuizzes = allResults.length;
    const averageScore = Math.round(allResults.reduce((sum, r) => sum + r.percentage, 0) / totalQuizzes);
    const perfectScores = allResults.filter(r => r.percentage === 100).length;
    const recentResults = allResults.slice(0, 5);
    const recentAverage = Math.round(recentResults.reduce((sum, r) => sum + r.percentage, 0) / recentResults.length);
    
    statsDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1em; margin-bottom: 1em;">
            <div style="background: #f0f0f0; padding: 1em; border-radius: 8px; text-align: center;">
                <div style="font-size: 2em; font-weight: bold; color: #2d2d2d;">${totalQuizzes}</div>
                <div>Total Quizzes</div>
            </div>
            <div style="background: #f0f0f0; padding: 1em; border-radius: 8px; text-align: center;">
                <div style="font-size: 2em; font-weight: bold; color: #2d2d2d;">${averageScore}%</div>
                <div>Average Score</div>
            </div>
            <div style="background: #f0f0f0; padding: 1em; border-radius: 8px; text-align: center;">
                <div style="font-size: 2em; font-weight: bold; color: #228B22;">${perfectScores}</div>
                <div>Perfect Scores</div>
            </div>
            <div style="background: #f0f0f0; padding: 1em; border-radius: 8px; text-align: center;">
                <div style="font-size: 2em; font-weight: bold; color: #2d2d2d;">${recentAverage}%</div>
                <div>Recent 5 Average</div>
            </div>
        </div>
    `;
}

function displayFilterControls() {
    const controlsDiv = document.getElementById('filterControls');
    
    controlsDiv.innerHTML = `
        <div style="margin-bottom: 1em;">
            <label>Filter by score: </label>
            <select id="scoreFilter" onchange="applyFilter()">
                <option value="all">All Scores</option>
                <option value="perfect">Perfect (100%)</option>
                <option value="good">Good (80-99%)</option>
                <option value="fair">Fair (60-79%)</option>
                <option value="poor">Poor (<60%)</option>
            </select>
            
            <button onclick="clearResults()" style="margin-left: 1em; padding: 0.3em 0.8em; background: #d00; color: white; border: none; border-radius: 4px;">
                Clear All Results
            </button>
        </div>
    `;
}

function applyFilter() {
    const scoreFilter = document.getElementById('scoreFilter').value;
    
    switch (scoreFilter) {
        case 'perfect':
            filteredResults = allResults.filter(r => r.percentage === 100);
            break;
        case 'good':
            filteredResults = allResults.filter(r => r.percentage >= 80 && r.percentage < 100);
            break;
        case 'fair':
            filteredResults = allResults.filter(r => r.percentage >= 60 && r.percentage < 80);
            break;
        case 'poor':
            filteredResults = allResults.filter(r => r.percentage < 60);
            break;
        default:
            filteredResults = [...allResults];
    }
    
    displayResults();
}

function displayResults() {
    const reviewDiv = document.getElementById('reviewList');
    
    if (filteredResults.length === 0) {
        reviewDiv.innerHTML = '<div style="color:#888;">No results match the current filter.</div>';
        return;
    }
    
    let html = `<h3>Quiz Results (${filteredResults.length})</h3>`;
    
    filteredResults.forEach((result, index) => {
        const date = new Date(result.timestamp).toLocaleString();
        const scoreColor = result.percentage >= 80 ? '#228B22' : result.percentage >= 60 ? '#ff8c00' : '#d00';
        
        html += `
            <div style="border: 1px solid #ddd; border-radius: 8px; margin-bottom: 1em; padding: 1em;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5em;">
                    <div style="font-weight: bold;">${date}</div>
                    <div style="color: ${scoreColor}; font-weight: bold; font-size: 1.2em;">
                        ${result.score}/${result.totalQuestions} (${result.percentage}%)
                    </div>
                </div>
                
                <div style="margin-bottom: 0.5em;">
                    <strong>Hand:</strong> ${result.situation.hand.map(cardToSpan).join('  ')} | 
                    <strong>Board:</strong> ${result.situation.board.map(cardToSpan).join('  ')}
                    ${result.situation.potOdds ? `| <strong>Pot:</strong> $${result.situation.potOdds.pot}, <strong>Bet:</strong> $${result.situation.potOdds.bet}` : ''}
                </div>
                
                <details style="margin-top: 0.5em;">
                    <summary style="cursor: pointer; color: #2d2d2d;">View Question Details</summary>
                    <div style="margin-top: 0.5em; padding-left: 1em;">
                        ${result.answers.map((answer, i) => `
                            <div style="margin-bottom: 0.5em; padding: 0.5em; background: ${answer.isCorrect ? '#e8f5e8' : '#ffe8e8'}; border-radius: 4px;">
                                <div style="font-weight: bold;">${answer.question}</div>
                                <div>Your answer: <span style="color: ${answer.isCorrect ? '#228B22' : '#d00'};">${answer.userAnswer || 'No answer'}</span></div>
                                ${!answer.isCorrect ? `<div>Correct answer: <span style="color: #228B22;">${answer.correctAnswer}</span></div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </details>
            </div>
        `;
    });
    
    reviewDiv.innerHTML = html;
}

function clearResults() {
    if (confirm('Are you sure you want to delete all quiz results? This cannot be undone.')) {
        localStorage.removeItem('pokerQuizResults');
        allResults = [];
        filteredResults = [];
        displayStats();
        displayResults();
        alert('All quiz results have been cleared.');
    }
}

// Initialize page
window.addEventListener('DOMContentLoaded', () => {
    loadQuizResults();
    displayStats();
    displayFilterControls();
    displayResults();
});
