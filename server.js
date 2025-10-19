const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname)));

// Store connected clients and movies
let clients = [];
let movies = {};

// Save movies to file for persistence
const fs = require('fs');
const MOVIES_FILE = 'movies.json';

// Load movies from file on startup
try {
    if (fs.existsSync(MOVIES_FILE)) {
        movies = JSON.parse(fs.readFileSync(MOVIES_FILE, 'utf8'));
    }
} catch (error) {
    console.error('Error loading movies:', error);
}

// Save movies to file
function saveMovies() {
    try {
        fs.writeFileSync(MOVIES_FILE, JSON.stringify(movies, null, 2));
    } catch (error) {
        console.error('Error saving movies:', error);
    }
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New client connected');
    clients.push(ws);

    // Send current movies to new client
    ws.send(JSON.stringify({
        type: 'init',
        movies: movies
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'add-movie') {
                // Add movie to server storage
                movies[data.code] = {
                    name: data.name,
                    type: data.type,
                    videoUrl: data.videoUrl
                };

                // Save to file
                saveMovies();

                // Broadcast to all clients
                broadcast({
                    type: 'movie-added',
                    code: data.code,
                    movie: movies[data.code]
                });
            } else if (data.type === 'delete-movie') {
                // Delete movie from server storage
                if (movies[data.code]) {
                    delete movies[data.code];
                    saveMovies();

                    // Broadcast deletion to all clients
                    broadcast({
                        type: 'movie-deleted',
                        code: data.code
                    });
                }
            } else if (data.type === 'search-movie') {
                // Handle search requests
                const movie = movies[data.code];
                ws.send(JSON.stringify({
                    type: 'search-result',
                    code: data.code,
                    movie: movie || null
                }));
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients = clients.filter(client => client !== ws);
    });
});

// Broadcast message to all connected clients
function broadcast(message) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});