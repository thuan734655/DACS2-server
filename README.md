# DACS2 Server

A Node.js-based social networking application server using Express and Socket.io.

## Prerequisites

- Node.js >= 18.12.0
- MySQL Database
- Gmail account for email notifications
- Firebase project for real-time features

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp env.example .env
```

## Installation

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Run in production
npm start
```

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Node Version: 18.12.0

4. Add the following environment variables in Render dashboard:
   - All variables from your `.env` file
   - Set `NODE_ENV=production`

## Features

- User authentication
- Real-time messaging with Socket.io
- Friend system
- Post creation and interaction
- Email notifications
- File uploads

## API Documentation

### Authentication
- POST `/login` - User login
- POST `/register` - User registration

### User Management
- GET `/api/user/:userId` - Get user information
- PUT `/api/user/:userId` - Update user information
- GET `/api/user/:userId/friends` - Get user's friends

### Posts
- POST `/api/posts` - Create a new post
- GET `/api/posts` - Get all posts
- POST `/api/posts/:postId/like` - Like a post
- POST `/api/posts/:postId/comment` - Comment on a post

## Socket Events

- `connection` - User connects
- `disconnect` - User disconnects
- `userConnected` - User comes online
- `userDisconnected` - User goes offline
- `message` - New message
- `notification` - New notification