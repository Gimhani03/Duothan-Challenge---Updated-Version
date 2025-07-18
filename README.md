# DuoThan Challenge - Competitive Programming Platform

A comprehensive competitive programming platform built with React, Node.js, Express, and MongoDB. Features team-based registration, algorithmic challenges, buildathon challenges, Judge0 integration for code execution, real-time leaderboards, and advanced admin dashboard with versioned requirements system.

## 🌟 Features

### Core Features

- **🔐 Secure Authentication**: Team-based registration with JWT tokens and session handling
- **👥 Team Management**: Create/join teams with invite codes and member management (up to 4 members per team)
- **🎯 Dual Challenge System**: 
  - **Algorithmic Challenges**: Code problems with Judge0 integration for execution
  - **Buildathon Challenges**: Project-based challenges with GitHub submission
- **🏆 Progressive Unlock System**: Completion-based unlock system with versioned requirements
- **📊 Real-time Leaderboard**: Dynamic ranking based on team performance with detailed statistics
- **⚡ Admin Dashboard**: Comprehensive management interface with role-based access control

### Advanced Features

- **🔄 Versioned Requirements**: Admin changes don't affect existing teams - they maintain original requirements
- **✅ Completion-Based Unlocks**: Teams unlock buildathon challenges by completing (not necessarily solving correctly) all algorithmic challenges
- **📈 Comprehensive Analytics**: Track team progress, submission patterns, and language usage
- **🔧 Extensive Testing Suite**: 25+ test scripts for debugging and validation
- **📚 Detailed Documentation**: Complete guides for setup, troubleshooting, and system understanding

### Technical Features

- **🚀 Judge0 Integration**: Code execution and validation using Judge0 CE API
- **🌐 Multi-language Support**: Python, C++, Java, JavaScript, C
- **💻 Monaco Code Editor**: Professional code editor with syntax highlighting
- **📱 Responsive Design**: Modern Material-UI interface optimized for all devices
- **⚡ Real-time Updates**: Live leaderboard and submission tracking
- **🗄️ Advanced Database**: MongoDB with proper schema design and indexing

## 🏗️ Project Architecture

```
DuoThan-Challenge/
├── 📁 backend/                    # Node.js/Express API server
│   ├── 📁 models/                 # MongoDB models with schema validation
│   │   ├── User.js                # User authentication & profile
│   │   ├── Team.js                # Team management with versioned requirements
│   │   ├── Challenge.js           # Challenge definitions with test cases
│   │   └── Submission.js          # Code submissions and results
│   ├── 📁 routes/                 # RESTful API routes
│   │   ├── auth.js                # Authentication endpoints
│   │   ├── teams.js               # Team management endpoints
│   │   ├── challenges.js          # Challenge CRUD with versioned logic
│   │   ├── submissions.js         # Code submission handling
│   │   ├── leaderboard.js         # Real-time ranking system
│   │   └── admin.js               # Admin dashboard endpoints
│   ├── 📁 middleware/             # Authentication & validation middleware
│   │   └── auth.js                # JWT validation & role-based access
│   ├── 📁 services/               # External service integrations
│   │   ├── judge0Service.js       # Judge0 API integration
│   │   └── mockJudge0Service.js   # Mock service for testing
│   ├── 📁 utils/                  # Utility functions
│   │   └── unlockCodeManager.js   # Unlock code management system
│   ├── 📁 test-scripts/           # 25+ comprehensive test scripts
│   ├── server.js                  # Main server with middleware setup
│   └── package.json               # Backend dependencies
├── 📁 frontend/                   # React application
│   ├── 📁 src/
│   │   ├── 📁 components/         # Reusable UI components
│   │   │   ├── CodeEditor.js      # Monaco editor integration
│   │   │   ├── Navigation.js      # Navigation bar with auth state
│   │   │   └── ProtectedRoute.js  # Route protection wrapper
│   │   ├── 📁 pages/              # Page components
│   │   │   ├── Dashboard.js       # Main dashboard with team stats
│   │   │   ├── Challenges.js      # Challenge listing with filters
│   │   │   ├── ChallengeDetail.js # Individual challenge view
│   │   │   ├── Team.js            # Team management interface
│   │   │   ├── Login.js           # Authentication form
│   │   │   ├── Register.js        # User registration
│   │   │   └── 📁 admin/          # Admin dashboard pages
│   │   ├── 📁 contexts/           # React context providers
│   │   │   └── AuthContext.js     # Authentication state management
│   │   ├── 📁 services/           # API service layer
│   │   │   └── api.js             # Axios-based API client
│   │   └── App.js                 # Main app with routing
│   └── package.json               # Frontend dependencies
├── 📁 documentation/              # Comprehensive documentation
│   ├── VERSIONED_UNLOCK_SYSTEM_SOLUTION.md
│   ├── ADMIN_DASHBOARD_GUIDE.md
│   ├── JUDGE0_SETUP.md
│   └── TEAM_CREATION_DEBUG.md
└── package.json                   # Root package with dev scripts
```

## 🚀 Advanced System Features

### 🔄 Versioned Requirements System

- **Dynamic Admin Changes**: Admins can add/remove challenges without affecting existing teams
- **Frozen Requirements**: Each team maintains their original algorithmic challenge requirements
- **Backward Compatibility**: Teams created before system updates keep working with original logic
- **Migration Support**: Automatic migration for existing teams to versioned requirements

### ✅ Completion-Based Unlock System

- **Inclusive Approach**: Teams unlock buildathon challenges by completing (not necessarily solving correctly) all algorithmic challenges
- **Progressive Unlocking**: Challenges unlock based on attempted completion rather than correctness
- **Flexible Criteria**: Wrong answers still count as completed challenges
- **Team-Specific Codes**: Unique unlock codes generated per team upon completion

### 📊 Enhanced Analytics & Monitoring

- **Real-time Tracking**: Live submission monitoring and team progress tracking
- **Detailed Statistics**: Comprehensive team performance analytics
- **Language Usage**: Track programming language preferences and success rates
- **Submission Patterns**: Monitor peak usage times and challenge difficulty impact

## ⚙️ Setup Instructions

### Prerequisites

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)
- **Judge0 CE API** access (configuration provided)

### 🔧 Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Gimhani03/Duothan-Challenge---Updated-Version.git
   cd DuoThan-Challenge
   ```

2. **Install dependencies:**

   ```bash
   npm install
   npm run install-all
   ```

3. **Backend Configuration:**

   ```bash
   cd backend
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/duothan-challenge
   SESSION_SECRET=your-session-secret-here
   JWT_SECRET=your-jwt-secret-here
   FRONTEND_URL=http://localhost:3000

   # Judge0 API Configuration
   JUDGE0_API_URL=http://10.3.5.139:2358
   JUDGE0_API_TOKEN=ZHVvdGhhbjUuMA==

   # Admin credentials
   ADMIN_EMAIL=admin@duothan.com
   ADMIN_PASSWORD=admin123
   ```

4. **Database Setup:**

   ```bash
   # Ensure MongoDB is running
   cd backend
   node seed.js
   ```

   This will create:
   - Sample algorithmic and buildathon challenges
   - Admin user account
   - Test teams and users
   - Proper challenge unlock conditions

5. **Start the Development Servers:**

   ```bash
   # From root directory
   npm run dev
   ```

   This starts both backend (port 5000) and frontend (port 3000) concurrently.

### 🔄 Alternative: Start Services Separately

```bash
# Backend server
cd backend
npm run dev

# Frontend development server (in another terminal)
cd frontend
npm start
```

### 🧪 Testing the Setup

```bash
# Run comprehensive tests
cd backend
npm test

# Test specific components
node test-completion-unlock.js
node test-versioned-unlock.js
node test-team-creation.js
```

## 🎮 Usage Guide

### 👥 For Participants

1. **🔐 Registration & Team Setup:**

   - Navigate to `http://localhost:3000/register`
   - Create account with email and password
   - Create a new team or join existing team with invite code
   - Team leader can manage members and share invite code
   - Maximum 4 members per team

2. **🎯 Challenge Navigation:**

   - Browse available challenges in the Challenge Portal
   - **Algorithmic Challenges**: 
     - Write code in built-in Monaco editor
     - Real-time execution with Judge0 integration
     - Multiple test cases with hidden test cases
     - Supports Python, C++, Java, JavaScript, C, Go
   - **Buildathon Challenges**: 
     - Submit GitHub repository URLs
     - Project-based evaluation
     - Unlocked after completing all algorithmic challenges

3. **🔓 Unlock System:**
   - Complete (attempt) all algorithmic challenges to generate unlock code
   - Use unlock code to access buildathon challenges
   - Progress tracked in real-time on dashboard

4. **📊 Progress Tracking:**
   - View real-time team rankings on leaderboard
   - Track individual and team progress
   - See detailed completion statistics
   - Monitor points and achievements

### 🔧 For Administrators

1. **🚪 Admin Dashboard Access:**

   - Login with admin credentials: `admin@duothan.com` / `admin123`
   - Navigate to Admin section in the header
   - Access comprehensive management interface

2. **⚙️ Challenge Management:**

   - **Create Challenges**: Add new algorithmic/buildathon challenges
   - **Set Parameters**: Configure difficulty, points, time limits
   - **Test Cases**: Define input/output test cases with hidden tests
   - **Unlock Conditions**: Set prerequisite requirements
   - **Versioned System**: New challenges only affect new teams

3. **👥 Team & User Management:**

   - View all registered teams with detailed statistics
   - Monitor user activity and submission history
   - Manage team memberships and roles
   - Track team progress and unlock status

4. **📈 Analytics & Monitoring:**
   - Real-time submission tracking
   - Language usage statistics
   - Team performance analytics
   - Competition progress monitoring
   - Debug tools for troubleshooting

### 🔍 Advanced Features

- **🔄 Versioned Requirements**: Admin changes don't affect existing teams
- **✅ Completion-Based Unlocks**: Teams unlock buildathon by completing (not solving correctly) all algorithmic challenges
- **🧪 Comprehensive Testing**: 25+ test scripts for debugging and validation
- **📚 Detailed Documentation**: Complete setup and troubleshooting guides

## 🔌 API Documentation

### 🔐 Authentication Endpoints

- `POST /api/auth/register` - User registration with validation
- `POST /api/auth/login` - User login with JWT token generation
- `POST /api/auth/logout` - User logout with session cleanup
- `GET /api/auth/me` - Get current user info with team details

### 👥 Team Management

- `POST /api/teams/create` - Create new team with invite code generation
- `POST /api/teams/join` - Join team with invite code validation
- `GET /api/teams/my-team` - Get user's team info with member details
- `POST /api/teams/leave` - Leave current team with proper cleanup
- `GET /api/teams/invite-code` - Get team's invite code (leader only)

### 🎯 Challenge Management

- `GET /api/challenges` - Get available challenges with versioned requirements
- `GET /api/challenges/:id` - Get specific challenge with test cases
- `POST /api/challenges/admin/create` - Create challenge (admin only)
- `PUT /api/challenges/admin/:id` - Update challenge (admin only)
- `DELETE /api/challenges/admin/:id` - Delete challenge (admin only)
- `POST /api/challenges/generate-unlock-code` - Generate buildathon unlock code
- `POST /api/challenges/unlock-buildathon` - Unlock buildathon challenges

### 📝 Submission Management

- `POST /api/submissions/code` - Submit code solution with Judge0 execution
- `POST /api/submissions/github` - Submit GitHub repository for buildathon
- `GET /api/submissions/my-submissions` - Get team's submission history
- `GET /api/submissions/run/:id` - Get submission execution results

### 🏆 Leaderboard & Analytics

- `GET /api/leaderboard` - Get real-time leaderboard data
- `GET /api/leaderboard/my-team` - Get team's current ranking
- `GET /api/leaderboard/stats` - Get competition statistics
- `GET /api/admin/analytics` - Get comprehensive analytics (admin only)

### 🔧 Admin Endpoints

- `GET /api/admin/teams` - Get all teams with detailed information
- `GET /api/admin/users` - Get all users with team associations
- `GET /api/admin/submissions` - Get all submissions with results
- `POST /api/admin/challenges/migrate` - Migrate teams to versioned requirements

## ⚡ Judge0 Integration

The platform seamlessly integrates with Judge0 CE API for robust code execution:

### 🔧 Configuration
- **API Endpoint**: `http://10.3.5.139:2358/`
- **API Token**: `ZHVvdGhhbjUuMA==`
- **Rate Limiting**: Configurable submission limits per team

### 🌐 Supported Languages
- **Python** (3.8+) - `language_id: 71`
- **C++** (GCC 9.2.0) - `language_id: 54`
- **Java** (OpenJDK 13.0.1) - `language_id: 62`
- **JavaScript** (Node.js 12.14.0) - `language_id: 63`
- **C** (GCC 9.2.0) - `language_id: 50`
- **Go** (1.13.5) - `language_id: 60`

### 🎯 Features
- **Real-time Execution**: Immediate code execution with detailed results
- **Multiple Test Cases**: Support for public and hidden test cases
- **Resource Limits**: Configurable memory and time limits
- **Detailed Feedback**: Comprehensive error reporting and debugging info
- **Base64 Encoding**: Secure code transmission and storage
- **Queue Management**: Efficient submission queue handling

### 🔍 Execution Flow
1. Code submitted through Monaco editor
2. Base64 encoding for secure transmission
3. Judge0 submission with test cases
4. Real-time result polling
5. Detailed feedback display
6. Automatic scoring and team progress update

## 🗄️ Database Schema

### 📊 Core Models

#### User Model
```javascript
{
  email: String (unique),
  password: String (hashed),
  name: String,
  team: ObjectId (ref: Team),
  role: ['participant', 'admin'],
  createdAt: Date,
  lastLogin: Date
}
```

#### Team Model (Enhanced)
```javascript
{
  name: String (unique),
  description: String,
  members: [ObjectId] (ref: User),
  leader: ObjectId (ref: User),
  inviteCode: String (unique),
  maxMembers: Number (default: 4),
  points: Number (default: 0),
  completedChallenges: [{
    challengeId: ObjectId (ref: Challenge),
    completedAt: Date,
    isCorrect: Boolean,
    points: Number
  }],
  requiredChallenges: [{  // Versioned requirements
    challengeId: ObjectId (ref: Challenge),
    capturedAt: Date
  }],
  buildathonUnlocked: Boolean (default: false),
  buildathonUnlockCode: String,
  buildathonUnlockedAt: Date,
  isActive: Boolean (default: true),
  createdAt: Date
}
```

#### Challenge Model
```javascript
{
  title: String,
  description: String,
  problemStatement: String,
  inputFormat: String,
  outputFormat: String,
  constraints: String,
  sampleInput: String,
  sampleOutput: String,
  explanation: String,
  type: ['algorithmic', 'buildathon'],
  difficulty: ['easy', 'medium', 'hard'],
  points: Number,
  timeLimit: Number (seconds),
  memoryLimit: Number (MB),
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: Boolean,
    points: Number
  }],
  unlockConditions: [ObjectId] (ref: Challenge),
  isActive: Boolean (default: true),
  createdAt: Date,
  order: Number
}
```

#### Submission Model
```javascript
{
  teamId: ObjectId (ref: Team),
  challengeId: ObjectId (ref: Challenge),
  userId: ObjectId (ref: User),
  code: String,
  language: String,
  languageId: Number,
  submissionToken: String,
  status: ['pending', 'processing', 'completed', 'error'],
  results: [{
    testCaseId: ObjectId,
    status: String,
    time: Number,
    memory: Number,
    output: String,
    expectedOutput: String,
    isCorrect: Boolean
  }],
  overallResult: ['accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error', 'compilation_error'],
  totalScore: Number,
  submittedAt: Date,
  completedAt: Date,
  executionTime: Number,
  memoryUsage: Number
}
```

### 🔗 Advanced Relationships

- **Users** belong to **Teams** (many-to-one with cascade delete)
- **Teams** have multiple **Submissions** (one-to-many with history tracking)
- **Submissions** reference **Challenges** (many-to-one with validation)
- **Challenges** can have **unlock conditions** (many-to-many self-reference)
- **Teams** maintain **versioned requirements** for dynamic challenge management

## 🔒 Security Features

### 🔐 Authentication & Authorization
- **JWT Tokens**: Secure stateless authentication with configurable expiration
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **Role-Based Access Control (RBAC)**: Granular permissions for participants and admins
- **Session Management**: Secure session handling with automatic cleanup

### 🛡️ API Security
- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: Protection against brute force and API abuse
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Helmet.js**: Security headers for XSS and clickjacking protection
- **Request Sanitization**: Protection against NoSQL injection attacks

### 🔒 Data Protection
- **Environment Variables**: Sensitive data stored in environment files
- **Database Security**: MongoDB connection with authentication
- **Code Sanitization**: Safe handling of user-submitted code
- **Error Handling**: Secure error responses without sensitive information leakage

## 🚀 Development Guide

### 🏗️ Adding New Features

#### Adding New Challenge Types
1. Update `Challenge.js` model with new type enum
2. Create specific validation in `challenges.js` routes
3. Add frontend components for new challenge type
4. Update submission handling in `submissions.js`

#### Extending Language Support
1. Add language mapping in `judge0Service.js`
2. Update language dropdown in `CodeEditor.js`
3. Add default code templates for new language
4. Update validation and execution logic

#### Creating New Admin Features
1. Add routes in `admin.js` with proper authentication
2. Create admin components in `frontend/src/pages/admin/`
3. Update admin navigation and permissions
4. Add comprehensive testing for new features

### 🧪 Testing Strategy

#### Backend Testing
```bash
# Run all backend tests
cd backend
npm test

# Test specific components
node test-versioned-unlock.js      # Test versioned requirements
node test-completion-unlock.js     # Test completion-based unlocks
node test-team-creation.js         # Test team management
node test-judge0-integration.js    # Test Judge0 service
```

#### Frontend Testing
```bash
# Run React tests
cd frontend
npm test

# Run specific test suites
npm test -- --testPathPattern=components
npm test -- --testPathPattern=pages
```

#### Database Testing
```bash
# Test database operations
node test-database-operations.js
node test-schema-validation.js
node test-data-integrity.js
```

### 🔧 Customization Options

#### UI Customization
- **Material-UI Theme**: Modify theme in `frontend/src/App.js`
- **Component Styling**: Update styles in component files
- **Layout Changes**: Modify navigation and layout components
- **Color Schemes**: Update theme colors and branding

#### Business Logic Customization
- **Scoring System**: Modify point calculation in submission handling
- **Team Limits**: Adjust maximum team size in Team model
- **Challenge Difficulty**: Add new difficulty levels and validation
- **Unlock Conditions**: Create custom unlock logic for challenges

## 🌐 Deployment Guide

### 🏭 Production Deployment

#### 1. Environment Setup
```bash
# Set production environment
NODE_ENV=production

# Update environment variables
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/duothan-prod
JWT_SECRET=your-production-jwt-secret
SESSION_SECRET=your-production-session-secret
```

#### 2. Database Setup
```bash
# Use MongoDB Atlas for production
# Enable IP whitelisting and authentication
# Set up automated backups
# Configure replica sets for high availability
```

#### 3. Server Configuration
```bash
# Use PM2 for process management
npm install -g pm2
pm2 start ecosystem.config.js

# Configure nginx for load balancing
# Set up SSL certificates
# Configure firewall rules
```

#### 4. Frontend Deployment
```bash
# Build optimized frontend
cd frontend
npm run build

# Serve with nginx or CDN
# Configure caching headers
# Set up compression
```

### 🐳 Docker Deployment

#### Dockerfile (Backend)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/duothan
    depends_on:
      - mongo
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
  
  mongo:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### ☁️ Cloud Deployment Options

#### AWS Deployment
- **EC2**: Virtual servers for backend hosting
- **RDS**: Managed MongoDB with automatic backups
- **S3**: Static file storage for frontend assets
- **CloudFront**: CDN for global content delivery
- **ELB**: Load balancing for high availability

#### Google Cloud Platform
- **App Engine**: Serverless backend hosting
- **Cloud MongoDB**: Managed database service
- **Cloud Storage**: File storage and CDN
- **Cloud Load Balancing**: Traffic distribution

#### Microsoft Azure
- **App Service**: Web app hosting
- **Cosmos DB**: Global database service
- **Blob Storage**: Static content storage
- **Application Gateway**: Load balancing and WAF

## 🔧 Troubleshooting Guide

### 🚨 Common Issues & Solutions

#### Database Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check connection string
echo $MONGODB_URI

# Test connection
node -e "require('mongoose').connect('mongodb://localhost:27017/duothan-challenge').then(() => console.log('Connected!')).catch(err => console.error('Error:', err))"
```

#### Judge0 API Issues
```bash
# Test Judge0 connectivity
curl -X GET "http://10.3.5.139:2358/about" -H "X-RapidAPI-Key: ZHVvdGhhbjUuMA=="

# Check API token validity
# Verify network connectivity to Judge0 server
# Monitor API rate limits and quotas
```

#### Frontend Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for port conflicts
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Restart development server
npm start
```

#### Team Creation Issues
```bash
# Check team validation
node backend/test-team-creation.js

# Debug team invite codes
node backend/check-teams.js

# Fix team data inconsistencies
node backend/fix-team-data.js
```

### 🔍 Debug Tools

#### Backend Debugging
```bash
# Enable debug mode
DEBUG=* npm run dev

# Check specific routes
curl -X GET "http://localhost:5000/api/challenges" -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Monitor logs
tail -f logs/backend.log
```

#### Database Debugging
```bash
# Connect to MongoDB shell
mongo duothan-challenge

# Check collections
show collections
db.teams.find().pretty()
db.challenges.find().pretty()

# Run diagnostic queries
db.runCommand({dbStats: 1})
```

### 📊 Performance Monitoring

#### System Resources
```bash
# Monitor server performance
top -p $(pgrep node)
htop

# Check memory usage
free -h
df -h
```

#### Application Metrics
```bash
# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:5000/api/challenges"

# Check database performance
db.runCommand({collStats: "submissions"})
```

### 🔧 Development Tools

#### Testing Scripts
```bash
# Run all tests
npm run test:all

# Test specific features
npm run test:unlock-system
npm run test:team-management
npm run test:judge0-integration
```

#### Database Management
```bash
# Backup database
mongodump --db duothan-challenge --out backup/

# Restore database
mongorestore --db duothan-challenge backup/duothan-challenge/

# Reset database
node backend/reset-database.js
```

## 📚 Documentation

### 📖 Available Guides

- **[Versioned Unlock System](./VERSIONED_UNLOCK_SYSTEM_SOLUTION.md)** - Complete guide to the versioned requirements system
- **[Admin Dashboard Guide](./ADMIN_DASHBOARD_GUIDE.md)** - Comprehensive admin interface documentation
- **[Judge0 Setup Guide](./JUDGE0_SETUP.md)** - Judge0 integration and configuration
- **[Team Creation Debug](./TEAM_CREATION_DEBUG.md)** - Troubleshooting team creation issues
- **[Database Schema Guide](./DATABASE_SCHEMA.md)** - Detailed database structure documentation

### 🧪 Testing Documentation

- **Test Scripts Overview**: 25+ comprehensive test scripts for all components
- **Unit Testing**: Individual component testing strategies
- **Integration Testing**: End-to-end testing workflows
- **Performance Testing**: Load testing and optimization guidelines

### 🔧 API Documentation

- **Endpoint Reference**: Complete API endpoint documentation
- **Authentication Flow**: JWT token management and validation
- **Error Handling**: Standard error responses and codes
- **Rate Limiting**: API usage limits and throttling

## 🤝 Contributing

### 📋 Contribution Guidelines

1. **Fork the repository**
   ```bash
   git clone https://github.com/Gimhani03/Duothan-Challenge---Updated-Version.git
   cd DuoThan-Challenge
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature-name
   ```

3. **Development setup**
   ```bash
   npm install
   npm run install-all
   npm run dev
   ```

4. **Code standards**
   - Follow existing code style and conventions
   - Add comprehensive comments and documentation
   - Write tests for new features
   - Update README for significant changes

5. **Testing requirements**
   ```bash
   npm run test:all
   npm run lint
   npm run test:coverage
   ```

6. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: descriptive commit message"
   git push origin feature/new-feature-name
   ```

7. **Submit pull request**
   - Describe changes and impact
   - Reference related issues
   - Include testing evidence
   - Request review from maintainers

### 🐛 Bug Reports

When reporting bugs, please include:
- **Environment details** (OS, Node.js version, browser)
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Error messages** and stack traces
- **Screenshots** if applicable

### 💡 Feature Requests

For new features, please provide:
- **Use case description** and justification
- **Proposed implementation** approach
- **Potential impact** on existing functionality
- **Alternative solutions** considered

## 📄 License

This project is developed for the **DuoThan** competitive programming competition and is intended for educational and competition purposes.

### 🔓 Open Source Components

- **React** - MIT License
- **Node.js** - MIT License
- **MongoDB** - SSPL License
- **Material-UI** - MIT License
- **Judge0** - MIT License

## 🙏 Acknowledgments

### 🏆 Competition Organizers
- **DuoThan Team** - Competition organization and requirements
- **Judge0 Community** - Code execution infrastructure
- **MongoDB Team** - Database technology and support

### 🔧 Technology Stack
- **React Team** - Frontend framework
- **Node.js Contributors** - Backend runtime
- **Express.js Team** - Web framework
- **Material-UI Team** - UI component library

### 📚 Educational Resources
- **Competitive Programming Community** - Problem-solving methodologies
- **Open Source Community** - Code examples and best practices
- **Documentation Contributors** - Comprehensive guides and tutorials

## 📞 Support & Contact

### 🐛 Technical Issues
- **GitHub Issues**: [Report bugs and feature requests](https://github.com/Gimhani03/Duothan-Challenge---Updated-Version/issues)
- **Documentation**: Comprehensive guides available in the repository
- **Testing Scripts**: Use provided test scripts for debugging

### 📧 Competition Support
- **Competition Guidelines**: Refer to official DuoThan documentation
- **Team Registration**: Contact competition organizers
- **Technical Queries**: Use GitHub discussions for community support

### 🤝 Community
- **Discussions**: GitHub Discussions for community interaction
- **Contributions**: Welcome contributions following the contribution guidelines
- **Feedback**: Constructive feedback appreciated for continuous improvement

---

**Made with ❤️ for the DuoThan Competitive Programming Competition**

*Last updated: July 2025*
