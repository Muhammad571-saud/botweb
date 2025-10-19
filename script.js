// WebSocket connection
let ws;
let movies = {};

// Connect to WebSocket server
function connectWebSocket() {
    ws = new WebSocket('ws://localhost:3000');

    ws.onopen = function() {
        console.log('Connected to WebSocket server');
    };

    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);

        if (data.type === 'init') {
            movies = data.movies;
            console.log('Received initial movie data');
        } else if (data.type === 'movie-added') {
            movies[data.code] = data.movie;
            console.log('New movie added:', data.code);
        } else if (data.type === 'search-result') {
            handleSearchResult(data);
        } else if (data.type === 'movie-deleted') {
            if (movies[data.code]) {
                delete movies[data.code];
                console.log('Movie deleted:', data.code);
            }
        }
    };

    ws.onclose = function() {
        console.log('WebSocket connection closed. Reconnecting...');
        setTimeout(connectWebSocket, 1000);
    };

    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

// Initialize WebSocket connection
connectWebSocket();

// Admin modal elements
const adminModal = document.getElementById('admin-modal');
const adminBtn = document.getElementById('admin-btn');
const closeBtn = document.querySelector('.close');
const loginBtn = document.getElementById('login-btn');
const adminPassword = document.getElementById('admin-password');
const adminContent = document.getElementById('admin-content');

// Upload form elements
const videoFile = document.getElementById('video-file');
const movieName = document.getElementById('movie-name');
const movieCode = document.getElementById('movie-code');
const movieTypeSelect = document.getElementById('movie-type-select');
const publishBtn = document.getElementById('publish-btn');

// Delete form elements
const deleteCode = document.getElementById('delete-code');
const deleteBtn = document.getElementById('delete-btn');

// Search elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const movieDisplay = document.getElementById('movie-display');
const movieTitle = document.getElementById('movie-title');
const movieType = document.getElementById('movie-type');
const movieVideo = document.getElementById('movie-video');

// Handle search results from server
function handleSearchResult(data) {
    if (data.movie) {
        movieTitle.textContent = data.movie.name;
        movieType.textContent = data.movie.type === 'movie' ? 'Movie' : 'Cartoon';
        movieVideo.src = data.movie.videoUrl;
        movieDisplay.style.display = 'block';
    } else {
        alert('Movie not found');
        movieDisplay.style.display = 'none';
    }
}

// Open admin modal
adminBtn.onclick = function() {
    adminModal.style.display = 'block';
}

// Close modal
closeBtn.onclick = function() {
    adminModal.style.display = 'none';
    adminContent.style.display = 'none';
    adminPassword.value = '';
}

// Login to admin panel
loginBtn.onclick = function() {
    if (adminPassword.value === 'kinoyoq') {
        adminContent.style.display = 'block';
        adminPassword.style.display = 'none';
        loginBtn.style.display = 'none';
    } else {
        alert('Incorrect password');
    }
}

// Publish movie
publishBtn.onclick = function() {
    const file = videoFile.files[0];
    const name = movieName.value.trim();
    const code = movieCode.value.trim();
    const type = movieTypeSelect.value;

    if (!file || !name || !code) {
        alert('Please fill all fields and select a video file');
        return;
    }

    // Create object URL for the video
    const videoUrl = URL.createObjectURL(file);

    // Send movie data to server via WebSocket
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'add-movie',
            code: code,
            name: name,
            type: type,
            videoUrl: videoUrl
        }));

        alert('Movie published successfully!');

        // Clear form
        videoFile.value = '';
        movieName.value = '';
        movieCode.value = '';
        movieTypeSelect.value = 'movie';
    } else {
        alert('Connection to server lost. Please try again.');
    }
}

// Search movie
searchBtn.onclick = function() {
    const code = searchInput.value.trim();
    if (!code) {
        alert('Please enter a movie code');
        return;
    }

    // Send search request to server via WebSocket
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'search-movie',
            code: code
        }));
    } else {
        alert('Connection to server lost. Please refresh the page.');
    }
}

// Delete movie
deleteBtn.onclick = function() {
    const code = deleteCode.value.trim();
    if (!code) {
        alert('Please enter a movie code to delete');
        return;
    }

    if (!movies[code]) {
        alert('Movie not found');
        return;
    }

    if (confirm(`Are you sure you want to delete the movie "${movies[code].name}"?`)) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'delete-movie',
                code: code
            }));

            alert('Movie deleted successfully!');
            deleteCode.value = '';
        } else {
            alert('Connection to server lost. Please try again.');
        }
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == adminModal) {
        adminModal.style.display = 'none';
        adminContent.style.display = 'none';
        adminPassword.value = '';
    }
}