# Token Management System - Backend

## Overview
This is the backend service for the Token Management System with thermal printer integration and dual display functionality.

## Features
- User authentication and authorization
- Token management with real-time updates
- Thermal printer integration
- Socket.io for real-time communication
- RESTful API endpoints
- MongoDB database integration
- File upload with Cloudinary

## Tech Stack
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io
- JWT Authentication
- Cloudinary for file storage
- ESC/POS for thermal printing

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with the required variables (see .env.example)

3. Start the development server:
```bash
npm run dev
```

4. Start the production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/user/create-user` - Register new user
- `POST /api/v1/user/activation` - Activate user account
- `POST /api/v1/user/login-user` - Login user
- `GET /api/v1/user/logout` - Logout user
- `GET /api/v1/user/getuser` - Get current user

### Token Management
- `GET /api/v1/token/system/status` - Get token system status
- `PUT /api/v1/token/system/update` - Update token system (Admin)
- `POST /api/v1/token/print` - Print new token
- `GET /api/v1/token/all` - Get all tokens
- `PUT /api/v1/token/status/:tokenId` - Update token status
- `GET /api/v1/token/statistics` - Get token statistics

### Printer Management
- `GET /api/v1/printer/all` - Get all printers
- `POST /api/v1/printer/add` - Add new printer (Admin)
- `PUT /api/v1/printer/update/:printerId` - Update printer (Admin)
- `DELETE /api/v1/printer/delete/:printerId` - Delete printer (Admin)
- `POST /api/v1/printer/test/:printerId` - Test printer connection

## Socket.io Events

### Client to Server
- `joinDisplay` - Join display room for real-time updates
- `leaveDisplay` - Leave display room

### Server to Client
- `tokenSystemUpdate` - Token system status updated
- `newTokensPrinted` - New tokens printed
- `tokenStatusUpdate` - Token status updated
- `currentTime` - Current time update (every second)

## Printer Configuration

The system supports thermal printers via:
- USB connection
- Network connection (IP:Port)
- Serial connection

Configure printers through the admin panel or API endpoints.

## Database Models

### User
- Authentication and user management
- Role-based access (admin/operator)

### TokenSystem
- Overall token system configuration
- Total, used, and remaining tokens

### Token
- Individual token records
- Status tracking (pending/completed/cancelled)

### Printer
- Printer configuration and settings
- Connection status tracking

## Security Features
- JWT authentication
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- Role-based authorization

## Error Handling
- Centralized error handling middleware
- Structured error responses
- Logging for debugging

## Development
- Use `npm run dev` for development with nodemon
- Environment variables for configuration
- Modular code structure
- Comprehensive error handling