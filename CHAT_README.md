# Chat Functionality for Form Builder

This document explains how the chat functionality works in the Form Builder application and the changes made to the server.js file to support project-specific chat rooms.

## Changes Made to server.js

The following changes were made to the server.js file:

1. Added support for the `chatMessage` event to handle chat messages between users
2. Modified the message handling to broadcast messages only to users in the same room
3. Updated the typing indicator (`escribiendo` event) to be room-specific

## How the Chat Functionality Works

The chat functionality allows users to communicate with each other in real-time. The chat is project-specific, meaning that only users who are collaborating on the same form can see each other's messages.

### Chat Rooms

Each form has its own chat room, identified by the form ID. When a user opens the chat page, they can select which form's chat room they want to join. There's also a "General" chat room for all users.

### Sending and Receiving Messages

When a user sends a message, the following happens:

1. The client emits a `chatMessage` event to the server with the message data, including the room ID
2. The server receives the event and broadcasts the message to all users in the same room
3. The clients receive the message and display it in the chat window

### Typing Indicators

When a user is typing, the following happens:

1. The client emits an `escribiendo` event to the server with the user's name and room ID
2. The server receives the event and broadcasts it to all other users in the same room
3. The clients receive the event and display a typing indicator for the user

## How to Use the Chat

1. Open the Chat page from the sidebar
2. Select a chat room from the list (General or one of your forms)
3. Type your message in the input field and press Enter or click Send
4. Your message will be sent to all users in the same room
5. You'll see messages from other users in the same room in real-time
6. You'll also see typing indicators when other users are typing

## Troubleshooting

If you're not seeing messages from other users, check the following:

1. Make sure you're connected to the server (you should see "Connected to server" at the top of the chat page)
2. Make sure you're in the same chat room as the other user
3. Check the browser console for any errors
4. Make sure the server.js file is running and accessible
