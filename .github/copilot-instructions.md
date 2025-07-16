<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# DuoThan Competitive Programming Platform - Copilot Instructions

This is a full-stack competitive programming platform built with:

## Tech Stack

- **Frontend**: React 18, Material-UI, Monaco Editor, React Router
- **Backend**: Node.js, Express.js, MongoDB with Mongoose
- **Authentication**: JWT tokens with bcrypt hashing
- **Code Execution**: Judge0 CE API integration
- **Development**: Concurrently for dev server management

## Project Architecture

### Backend (Node.js/Express)

- **Models**: User, Team, Challenge, Submission schemas with MongoDB
- **Routes**: RESTful API with proper authentication middleware
- **Services**: Judge0 service for code execution and validation
- **Security**: Helmet, CORS, rate limiting, input validation

### Frontend (React)

- **Context**: AuthContext for authentication state management
- **Components**: Reusable UI components with Material-UI
- **Pages**: Dashboard, Team management, Challenge portal, Admin interface
- **Services**: Axios-based API client with interceptors

### Key Features

- Team-based registration and management
- Progressive challenge unlocking system
- Multi-language code editor with Monaco
- Real-time leaderboard with ranking
- Judge0 integration for code execution
- Admin dashboard with RBAC
- GitHub submission handling for buildathon challenges

## Coding Guidelines

### General

- Use async/await for asynchronous operations
- Implement proper error handling and user feedback
- Follow RESTful API conventions
- Use TypeScript-style JSDoc comments where applicable

### Backend

- All routes should have proper authentication middleware
- Use express-validator for input validation
- Implement proper error responses with consistent structure
- Use Mongoose models with proper schema validation
- Database operations should handle connection errors

### Frontend

- Use functional components with React Hooks
- Implement proper loading states and error handling
- Use Material-UI components consistently
- Follow React best practices for state management
- API calls should use the centralized API service

### Security

- Never expose sensitive data (passwords, tokens) in responses
- Validate all user inputs on both client and server
- Use proper CORS configuration
- Implement rate limiting for API endpoints
- Use HTTPS in production

### Database

- Use proper indexing for frequently queried fields
- Implement soft deletes where appropriate
- Use population for related data fetching
- Handle MongoDB connection states properly

## Judge0 Integration Details

- API Endpoint: http://10.3.5.139:2358/
- Token: ZHVvdGhhbjUuMA==
- Supported languages: Python, C++, Java, JavaScript, C, Go
- Handle base64 encoding/decoding for submissions
- Implement proper timeout and error handling

## File Structure Conventions

- Routes in `/backend/routes/` with descriptive names
- Models in `/backend/models/` with proper schema definitions
- Frontend pages in `/src/pages/` with clear component structure
- Reusable components in `/src/components/`
- API services in `/src/services/`

## Development Workflow

- Use environment variables for configuration
- Implement proper logging for debugging
- Create reusable components for common UI patterns
- Test API endpoints with proper error scenarios
- Use proper git commit messages

When writing code, prioritize:

1. Security and input validation
2. User experience and feedback
3. Performance and scalability
4. Code maintainability and documentation
5. Proper error handling and recovery
