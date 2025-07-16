# DuoThan - Competitive Programming Platform

A comprehensive competitive programming platform built with React, Node.js, Express, and MongoDB. Features team registration, algorithmic challenges, buildathon challenges, Judge0 integration for code execution, real-time leaderboards, and admin dashboard.

## Features

### Core Features

- **Secure Authentication**: Team-based registration with session handling
- **Team Management**: Create/join teams with invite codes and member management
- **Challenge Portal**: Two types of challenges:
  - **Algorithmic Challenges**: Code problems with Judge0 integration for execution
  - **Buildathon Challenges**: Project-based challenges with GitHub submission
- **Real-time Leaderboard**: Dynamic ranking based on team performance
- **Progressive Unlocking**: Challenges unlock based on completion of prerequisites
- **Admin Dashboard**: Comprehensive management interface with RBAC

### Technical Features

- **Judge0 Integration**: Code execution and validation using Judge0 CE API
- **Multi-language Support**: Python, C++, Java, JavaScript, C, Go
- **Code Editor**: Monaco Editor with syntax highlighting
- **Responsive Design**: Modern Material-UI interface
- **Real-time Updates**: Live leaderboard and submission tracking
- **Database Management**: MongoDB with proper schema design

## Project Structure

```
duothan/
├── backend/                 # Node.js/Express API server
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication middleware
│   ├── services/           # Judge0 service
│   ├── server.js           # Main server file
│   ├── seed.js             # Database seeder
│   └── package.json        # Backend dependencies
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── App.js          # Main app component
│   └── package.json        # Frontend dependencies
└── package.json            # Root package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Judge0 CE API access (provided in requirements)

### Installation

1. **Clone and setup the project:**

   ```bash
   cd duothan
   npm install
   npm run install-all
   ```

2. **Backend Configuration:**

   ```bash
   cd backend
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/duothan
   SESSION_SECRET=your-session-secret
   JWT_SECRET=your-jwt-secret
   FRONTEND_URL=http://localhost:3000

   # Judge0 API Configuration
   JUDGE0_API_URL=http://10.3.5.139:2358
   JUDGE0_API_TOKEN=ZHVvdGhhbjUuMA==

   # Admin credentials
   ADMIN_EMAIL=admin@duothan.com
   ADMIN_PASSWORD=admin123
   ```

3. **Database Setup:**

   ```bash
   # Ensure MongoDB is running
   cd backend
   node seed.js
   ```

   This will create:

   - Sample algorithmic and buildathon challenges
   - Admin user account
   - Proper challenge unlock conditions

4. **Start the Development Servers:**

   ```bash
   # From root directory
   npm run dev
   ```

   This starts both backend (port 5000) and frontend (port 3000) concurrently.

### Alternative: Start services separately

```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm start
```

## Usage

### For Participants

1. **Registration & Team Setup:**

   - Register at `http://localhost:3000/register`
   - Create a new team or join existing team with invite code
   - Team leader can manage members and share invite code

2. **Challenges:**

   - Browse available challenges in the Challenge Portal
   - Algorithmic challenges: Write code in built-in editor with Judge0 execution
   - Buildathon challenges: Submit GitHub repository URLs
   - Challenges unlock progressively based on completion

3. **Leaderboard:**
   - View real-time team rankings
   - Track your team's progress and points
   - See completion statistics

### For Administrators

1. **Access Admin Dashboard:**

   - Login with admin credentials (admin@duothan.com / admin123)
   - Navigate to Admin section

2. **Challenge Management:**

   - Create new algorithmic/buildathon challenges
   - Set difficulty levels, points, and unlock conditions
   - Manage test cases and validation

3. **Team & User Management:**

   - View all registered teams and users
   - Monitor submission history
   - Manage user roles and permissions

4. **Competition Analytics:**
   - View submission trends and statistics
   - Monitor language usage patterns
   - Track overall competition progress

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Team Management

- `POST /api/teams/create` - Create new team
- `POST /api/teams/join` - Join team with invite code
- `GET /api/teams/my-team` - Get user's team info
- `POST /api/teams/leave` - Leave current team

### Challenges

- `GET /api/challenges` - Get available challenges
- `GET /api/challenges/:id` - Get specific challenge
- `POST /api/challenges/admin/create` - Create challenge (admin)

### Submissions

- `POST /api/submissions/code` - Submit code solution
- `POST /api/submissions/github` - Submit GitHub repository
- `GET /api/submissions/my-submissions` - Get team submissions

### Leaderboard

- `GET /api/leaderboard` - Get leaderboard data
- `GET /api/leaderboard/my-team` - Get team ranking
- `GET /api/leaderboard/stats` - Get competition statistics

## Judge0 Integration

The platform integrates with Judge0 CE API for code execution:

- **API Endpoint**: `http://10.3.5.139:2358/`
- **API Token**: `ZHVvdGhhbjUuMA==`
- **Supported Languages**: Python, C++, Java, JavaScript, C, Go
- **Features**:
  - Real-time code execution
  - Multiple test case validation
  - Memory and time limit enforcement
  - Detailed error reporting

## Database Schema

### Key Models:

- **User**: Authentication and profile information
- **Team**: Team management with invite codes
- **Challenge**: Problem definitions with test cases
- **Submission**: Code submissions and results

### Relationships:

- Users belong to Teams (many-to-one)
- Teams have multiple Submissions (one-to-many)
- Submissions reference Challenges (many-to-one)
- Progressive challenge unlocking through conditions

## Security Features

- **Authentication**: JWT tokens with session management
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Express-validator for API inputs
- **Rate Limiting**: Protection against abuse
- **Secure Headers**: Helmet.js for security headers
- **CORS Configuration**: Proper cross-origin setup

## Development

### Adding New Challenges

1. Use the admin interface or directly modify the database
2. Set appropriate difficulty, points, and unlock conditions
3. For algorithmic challenges: Define test cases and expected outputs
4. For buildathon challenges: Set submission deadlines and requirements

### Extending Language Support

1. Update `judge0Service.js` with new language mappings
2. Add language options in `CodeEditor.js`
3. Update default code templates

### Customizing UI

- Modify Material-UI theme in `App.js`
- Update components in `frontend/src/components/`
- Customize styles using Material-UI's styling system

## Deployment

### Production Setup

1. Set `NODE_ENV=production`
2. Update environment variables for production
3. Use process manager (PM2) for backend
4. Build and serve frontend with nginx
5. Use cloud MongoDB (Atlas) for database
6. Configure proper CORS and security headers

### Docker Deployment (Optional)

Create `Dockerfile` and `docker-compose.yml` for containerized deployment.

## Troubleshooting

### Common Issues:

1. **MongoDB Connection**: Ensure MongoDB is running and connection string is correct
2. **Judge0 API**: Verify API endpoint and token are accessible
3. **CORS Errors**: Check frontend URL in backend CORS configuration
4. **Port Conflicts**: Ensure ports 3000 and 5000 are available

### Logs:

- Backend logs: Check console output for API errors
- Frontend logs: Check browser developer console
- Database logs: Check MongoDB logs for connection issues

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes with descriptive messages
4. Test thoroughly
5. Submit pull request

## License

This project is created for the DuoThan competition and is intended for educational purposes.

## Support

For technical issues or questions, please refer to the competition guidelines or contact the organizers.
