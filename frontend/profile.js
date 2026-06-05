// Check if user is logged in
function checkLoginStatus() {
    const userName = localStorage.getItem('userName');
    let userEmail = localStorage.getItem('userEmail');
    
    console.log('Profile Load - userName:', userName, 'userEmail:', userEmail);
    
    if (!userName) {
        console.error('Missing user data - redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    // Update profile page with name
    document.getElementById('profileName').textContent = userName;
    
    // If email is not in localStorage, try to fetch it from backend
    if (!userEmail) {
        console.log('Email not found in localStorage, attempting to fetch from backend');
        fetchProfileDataByName(userName);
    } else {
        document.getElementById('profileEmail').textContent = userEmail;
        // Fetch user profile data
        fetchProfileData(userEmail);
    }
}

// Fetch email from backend using username
async function fetchProfileDataByName(userName) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/profile-by-name?name=${encodeURIComponent(userName)}`);
        
        if (response.ok) {
            const data = await response.json();
            const userEmail = data.email;
            localStorage.setItem('userEmail', userEmail);
            document.getElementById('profileEmail').textContent = userEmail;
            
            document.getElementById('statsAnalyzed').textContent = data.analysisCount || 0;
            document.getElementById('statsFake').textContent = data.fakeCount || 0;
            document.getElementById('statsReal').textContent = data.realCount || 0;
            displayRecentAnalyses(data.recentAnalyses || []);
        } else {
            console.error('Failed to fetch profile by name:', response.status);
            document.getElementById('profileEmail').textContent = 'Email not found';
            displayRecentAnalyses([]);
        }
    } catch (error) {
        console.error('Error fetching profile by name:', error);
        document.getElementById('profileEmail').textContent = 'Error loading email';
        displayRecentAnalyses([]);
    }
}

// Fetch user profile data from backend
async function fetchProfileData(userEmail) {
    try {
        console.log('Fetching profile for email:', userEmail);
        const response = await fetch(`http://127.0.0.1:5000/profile?email=${encodeURIComponent(userEmail)}`);
        
        console.log('Profile response status:', response.status);
        
        if (response.ok) {       
            const data = await response.json();
            console.log('Profile data received:', data);
            
            document.getElementById('statsAnalyzed').textContent = data.analysisCount || 0;
            document.getElementById('statsFake').textContent = data.fakeCount || 0;
            document.getElementById('statsReal').textContent = data.realCount || 0;
            
            // Display recent analyses
            displayRecentAnalyses(data.recentAnalyses || []);
        } else {
            const errorData = await response.json();
            console.error('Profile fetch error:', response.status, errorData);
            document.getElementById('statsAnalyzed').textContent = 0;
            document.getElementById('statsFake').textContent = 0;
            document.getElementById('statsReal').textContent = 0;
            displayRecentAnalyses([]);
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        document.getElementById('statsAnalyzed').textContent = 0;
        document.getElementById('statsFake').textContent = 0;
        document.getElementById('statsReal').textContent = 0;
        displayRecentAnalyses([]);
    }
}

// Display recent analyses
function displayRecentAnalyses(analyses) {
    const container = document.getElementById('recentAnalyses');
    container.innerHTML = '';

    if (!analyses || analyses.length === 0) {
        container.innerHTML = `
            <div class="no-analyses-message">
                <div class="icon">📊</div>
                <p>No analyses yet. Start analyzing job postings to see them here!</p>
                <a href="index.html" class="btn btn-primary" style="display: inline-block;">Analyze Now</a>
            </div>
        `;
        return;
    }

    analyses.forEach(analysis => {
        const resultClass = analysis.prediction.toLowerCase();
        const resultText = analysis.prediction === 'FAKE' ? '❌ Fake' : 
                          analysis.prediction === 'REAL' ? '✅ Real' : 
                          '⚠️ Uncertain';
        
        const analysisHTML = `
            <div class="analysis-item">
                <div class="analysis-content">
                    <div class="analysis-title">${escapeHtml(analysis.title)}</div>
                    <div class="analysis-company">${escapeHtml(analysis.company)}</div>
                    <div class="analysis-meta">Analyzed on ${new Date(analysis.timestamp).toLocaleDateString()}</div>
                </div>
                <div class="analysis-result">
                    <div class="result-badge ${resultClass}">${resultText}</div>
                    <div class="confidence-badge">${analysis.probability.toFixed(1)}%</div>
                </div>
            </div>
        `;
        
        container.innerHTML += analysisHTML;
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkLoginStatus);
} else {
    checkLoginStatus();
}
