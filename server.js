// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');
const { connectDB } = require('./config/database');
const Pizarra = require('./models/Pizarra');

// Production dependencies
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Get environment variables with defaults
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Connect to MongoDB
connectDB();

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS based on environment
const corsOptions = {
  origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',')
};

// Initialize Socket.io with CORS options
const io = new Server(server, {cors: corsOptions});

// Apply middleware
app.use(cors(corsOptions));
app.use(express.json());

// Add endpoint for emitting events from external sources (like PHP)
app.post('/emit-event', (req, res) => {
    const { event, data } = req.body;

    if (!event || !data) {
        return res.status(400).json({ error: 'Event and data are required' });
    }

    console.log(`Emitting event ${event} with data:`, data);

    // If roomId is provided, emit to that room, otherwise emit globally
    if (data.roomId) {
        io.to(data.roomId).emit(event, data);
    } else {
        io.emit(event, data);
    }

    return res.status(200).json({ success: true, message: 'Event emitted successfully' });
});

// Apply production middleware if in production mode
if (NODE_ENV === 'production') {
  // Enable compression
  app.use(compression());

  // Set security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "connect-src": ["'self'", "ws:", "wss:"]
      }
    }
  }));

  // Apply rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Demasiadas solicitudes desde esta IP, inténtelo de nuevo después de 15 minutos'
  });

  // Apply rate limiting to API routes
  app.use('/api', apiLimiter);

  // Disable X-Powered-By header
  app.disable('x-powered-by');
}

// Socket.io connection handling
io.on('connection', async (socket) => {
    console.log('Nuevo cliente conectado', socket.id);

    // Handle joining a room
    socket.on('joinRoom', async (data, callback) => {
        const { pizarraId, userId, roomId, userName } = data;
        console.log(`Usuario ${userId} unido a la sala ${roomId} del pizarra ${pizarraId}`);

        // Fix: Only return if pizarraId is undefined, null, or 'undefined'
        if (pizarraId === undefined || pizarraId === null || pizarraId === 'undefined') {
            // Join the socket.io room using roomId instead of pizarraId
            socket.join(roomId);

            // Notify other users in the room
            socket.to(roomId).emit('userJoined', { user: userName, roomId });

            // Send acknowledgment if callback is provided
            if (typeof callback === 'function') {
                callback({ status: 'success', roomId });
            }
            return;
        }

        try {
            // Find or create room
            let pizarra = await Pizarra.findOne({ where: { id: pizarraId } });

            // Join the socket.io room
            socket.join(roomId);

            if (pizarra) {
                // Ensure elements is always an array
                let elements = [];
                if (pizarra.elements) {
                    if (Array.isArray(pizarra.elements)) {
                        elements = pizarra.elements;
                    } else if (typeof pizarra.elements === 'string') {
                        try {
                            elements = JSON.parse(pizarra.elements);
                        } catch (e) {
                            console.error('Error parsing elements JSON:', e);
                        }
                    }
                }

                // Send elements to the client
                socket.emit('formUpdate', {
                    elements: elements,
                    user: 'server',
                    roomId
                });

                if (pizarra.name) {
                    socket.emit('formNameChange', {
                        pizarraId: pizarra.id,
                        userId: userId,
                        name: pizarra.name,
                        user: 'server',
                        roomId
                    });
                }

                // Send updated room users to all clients if pizarra.users exists
                if (pizarra.users) {
                    io.to(roomId).emit('roomUsers', {
                        users: pizarra.users,
                        roomId
                    });
                }
            }

            // Notify other users in the room
            socket.to(roomId).emit('userJoined', { user: userName, roomId });

            // Send acknowledgment if callback is provided
            if (typeof callback === 'function') {
                callback({ status: 'success', roomId });
            }
        } catch (error) {
            console.error('Error al unirse a la sala:', error);
            socket.emit('error', { message: 'Error joining room' });

            // Send error acknowledgment if callback is provided
            if (typeof callback === 'function') {
                callback({ status: 'error', message: 'Error joining room: ' + error.message });
            }
        }
    });

    // Handle leaving a room
    socket.on('leaveRoom', async (data, callback) => {
        const { roomId, user } = data;
        console.log(`User ${user} left room ${roomId}`);

        try {
            // Simply leave the room without database operations for now
            // Notify other users
            socket.to(roomId).emit('userLeft', { user, roomId });

            // Leave the room
            socket.leave(roomId);

            // Send acknowledgment if callback is provided
            if (typeof callback === 'function') {
                callback({ status: 'success', message: 'Left room successfully' });
            }
        } catch (error) {
            console.error('Error in leaveRoom:', error);

            // Send error acknowledgment if callback is provided
            if (typeof callback === 'function') {
                callback({ status: 'error', message: 'Error leaving room: ' + error.message });
            }
        }
    });

    // Handle form updates
    socket.on('formUpdate', async (data, callback) => {
        const { elements, roomId, user } = data;
        console.log(`Actualización de formulario en la sala ${roomId} por el user ${user}`);

        try {
            // Broadcast the update to all other users in the room
            socket.to(roomId).emit('formUpdate', { elements, user, roomId });

            // Send acknowledgment if callback is provided
            if (typeof callback === 'function') {
                callback({ status: 'success', message: 'Form updated successfully' });
            }
        } catch (error) {
            console.error('Error in formUpdate:', error);
            socket.emit('error', { message: 'Error updating form' });

            // Send error acknowledgment if callback is provided
            if (typeof callback === 'function') {
                callback({ status: 'error', message: 'Error updating form: ' + error.message });
            }
        }
    });

    // Handle form name changes
    socket.on('formNameChange', async (data, callback) => {
        const { name, roomId, formBuilderId, userId, user } = data;
        console.log(`Cambio de nombre ${name} en la sala ${roomId} por el user ${user} del formulario ${formBuilderId}`);

        try {
            // Broadcast the name change to all other users in the room
            socket.to(roomId).emit('formNameChange', { name, formBuilderId, userId, user, roomId });

            // Send acknowledgment if callback is provided
            if (typeof callback === 'function') {
                callback({ status: 'success', message: 'Form name updated successfully' });
            }
        } catch (error) {
            console.error('Error in formNameChange:', error);
            socket.emit('error', { message: 'Error updating form name' });

            // Send error acknowledgment if callback is provided
            if (typeof callback === 'function') {
                callback({ status: 'error', message: 'Error updating form name: ' + error.message });
            }
        }
    });

    // Handle chat messages
    socket.on('chatMessage', async (data, callback) => {
        const { text, user, timestamp, roomId } = data;
        console.log(`Mensaje de chat en la sala ${roomId} por el usuario ${user}: ${text}`);

        try {
            // Broadcast the message to all other users in the room
            socket.to(roomId).emit('chatMessage', { text, user, timestamp, roomId });

            // Send acknowledgment if callback is provided
            if (typeof callback === 'function') {
                callback({ status: 'success', message: 'Chat message sent successfully' });
            }
        } catch (error) {
            console.error('Error in chatMessage:', error);
            socket.emit('error', { message: 'Error sending chat message' });

            // Send error acknowledgment if callback is provided
            if (typeof callback === 'function') {
                callback({ status: 'error', message: 'Error sending chat message: ' + error.message });
            }
        }
    });

    // Handle typing indicator for chat
    socket.on('escribiendo', (data, callback) => {
        const { user, roomId } = data;
        console.log(`Usuario ${user} está escribiendo en la sala ${roomId}`);

        // Broadcast typing indicator to all other users in the room
        socket.to(roomId).emit('escribiendo', { user, roomId });

        // Send acknowledgment if callback is provided
        if (typeof callback === 'function') {
            callback({ status: 'success' });
        }
    });

    // Handle typing indicator for form element editing
    socket.on('typing', (data, callback) => {
        const { user, roomId } = data;
        console.log(`Usuario ${user} está editando un elemento en la sala ${roomId}`);

        // Broadcast typing indicator to all other users in the room
        socket.to(roomId).emit('typing', { user, roomId });

        // Send acknowledgment if callback is provided
        if (typeof callback === 'function') {
            callback({ status: 'success' });
        }
    });

    // Handle Flutter widget events
    socket.on('flutter-widget-added', (data, callback) => {
        const { roomId, userId } = data;
        console.log(`Widget added in room ${roomId} by user ${userId}`);

        // Broadcast to all other users in the room
        socket.to(roomId).emit('flutter-widget-added', data);

        // Send acknowledgment if callback is provided
        if (typeof callback === 'function') {
            callback({ status: 'success', message: 'Widget added successfully' });
        }
    });

    socket.on('flutter-widget-updated', (data, callback) => {
        const { roomId, userId } = data;
        console.log(`Widget updated in room ${roomId} by user ${userId}`);

        // Broadcast to all other users in the room
        socket.to(roomId).emit('flutter-widget-updated', data);

        // Send acknowledgment if callback is provided
        if (typeof callback === 'function') {
            callback({ status: 'success', message: 'Widget updated successfully' });
        }
    });

    socket.on('flutter-widget-removed', (data, callback) => {
        const { roomId, userId } = data;
        console.log(`Widget removed in room ${roomId} by user ${userId}`);

        // Broadcast to all other users in the room
        socket.to(roomId).emit('flutter-widget-removed', data);

        // Send acknowledgment if callback is provided
        if (typeof callback === 'function') {
            callback({ status: 'success', message: 'Widget removed successfully' });
        }
    });

    socket.on('typingAI', (data, callback) => {
        const { roomId, userId } = data;
        console.log(`AI typing in room ${roomId} by user ${userId}`);

        // Broadcast to all other users in the room
        socket.to(roomId).emit('typingAI', data);

        // Send acknowledgment if callback is provided
        if (typeof callback === 'function') {
            callback({ status: 'success' });
        }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
        console.log('Client disconnected', socket.id);
        // The room cleanup will be handled by the leaveRoom event
    });
});

// Error handling for the server
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Puerto ${PORT}, Ya está en uso. Utilice un puerto diferente.`);
    } else {
        console.error('Servidor error: ', error);
    }
    process.exit(1);
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});
