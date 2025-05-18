# Real-time Form Builder Collaboration Server

This is a Node.js server that enables real-time collaboration for the Form Builder application. It uses Socket.io to provide real-time updates between multiple users working on the same form.

## Features

- Room-based collaboration (each form has its own room)
- Real-time form updates
- Real-time form name changes
- Typing indicators
- User join/leave notifications
- Active user tracking

## How to Run

1. Make sure you have Node.js installed
2. Install dependencies:
   ```
   npm install express http socket.io cors
   ```
3. Run the server:
   ```
   node server.js
   ```
   
The server will start on port 4000 by default.

## Integration with Form Builder

The Form Builder application (FormBuilderCanvas.vue) is already configured to connect to this server. It uses the following Socket.io events:

### Client to Server Events

- `joinRoom`: When a user joins a form editing session
- `leaveRoom`: When a user leaves a form editing session
- `formUpdate`: When form elements are updated
- `formNameChange`: When the form name is changed
- `typing`: When a user is typing

### Server to Client Events

- `formUpdate`: To update the form when other users make changes
- `formNameChange`: To update the form name when other users change it
- `typing`: To show when other users are typing
- `userJoined`: To update the list of collaborators when a new user joins
- `userLeft`: To update the list of collaborators when a user leaves
- `roomUsers`: To get the current list of users in the room

## How It Works

1. When a user opens a form, the client connects to the Socket.io server and joins a room specific to that form.
2. The server sends the current form data to the new user.
3. When a user makes changes to the form, the client sends the changes to the server, which then broadcasts them to all other users in the room.
4. When a user leaves the form, the client notifies the server, which then broadcasts the user's departure to all other users in the room.

This enables multiple users to collaborate on the same form in real-time, seeing each other's changes as they happen.
