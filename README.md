# Polifly - Survey Creation and Vote Analysis System

A comprehensive survey creation and analysis platform similar to Google Forms + Typeform with advanced behavioral analytics.

## Features

### 🎯 Core Survey Features
- **Multiple Question Types**: Text, Multiple Choice, and Rating questions
- **Conditional Logic**: Show/hide questions based on previous answers
- **Response Limits**: Set maximum number of responses per form
- **Participant Control**: Allow or restrict multiple responses from same participant
- **Required Questions**: Mark questions as mandatory

### ⏱️ Time Tracking & Behavioral Analysis
- **Response Time Tracking**: Record time spent on each question
- **Answer Change Tracking**: Monitor how many times users change their answers
- **Session Analytics**: Track total completion time
- **Behavioral Insights**: Analyze user engagement patterns

### 📊 Advanced Analytics & Reporting
- **Real-time Charts**: Visual representation of survey results
- **Response Analytics**: Detailed breakdown of all responses
- **Behavioral Analysis**: 
  - Average time per question
  - Question change rates
  - Completion rates
  - Time distribution analysis
- **Export Functionality**: Download results as CSV

### 🎨 Modern UI/UX
- **Responsive Design**: Works on desktop and mobile
- **Material-UI Components**: Modern, accessible interface
- **Progress Indicators**: Visual feedback during form completion
- **Conditional Question Display**: Dynamic form flow

## Technology Stack

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **Prisma** ORM
- **TypeScript**

### Frontend
- **React** with TypeScript
- **Material-UI** components
- **React Router** for navigation
- **Chart.js** for data visualization

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pollify
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Database Setup**
   ```bash
   cd ../server
   
   # Set up your database URL in .env file
   echo "DATABASE_URL=postgresql://username:password@localhost:5432/pollify" > .env
   
   # Run database migrations
   npx prisma migrate dev
   
   # Generate Prisma client
   npx prisma generate
   ```

4. **Start the application**
   ```bash
   # Start the server (from server directory)
   npm run dev
   
   # Start the client (from client directory)
   npm run dev
   ```

## Usage

### Creating Forms
1. Navigate to the main page
2. Click "Create New Form"
3. Configure form settings:
   - Title and description
   - Public/private access
   - Response limits
   - Multiple response settings

### Adding Questions
1. Open a form for editing
2. Add questions with different types:
   - **Text**: Open-ended responses
   - **Multiple Choice**: Select from predefined options
   - **Rating**: Star-based ratings with custom scales

### Conditional Logic
1. Click the settings icon on any question
2. Configure conditions:
   - Depends on: Choose the question to base logic on
   - Operator: Equals, Not Equals, Contains, Greater Than, Less Than
   - Value: The value to compare against
   - Action: Show or hide the question

### Analyzing Results
1. Navigate to the Results page
2. View different analytics:
   - **Summary**: Question-by-question breakdown
   - **Responses**: Detailed response table
   - **Behavioral Analysis**: User engagement metrics
3. Export data as CSV for further analysis

## API Endpoints

### Forms
- `POST /api/forms` - Create a new form
- `GET /api/forms` - List all forms
- `GET /api/forms/:id` - Get form details
- `PATCH /api/forms/:id` - Update form settings

### Questions
- `POST /api/forms/:id/questions` - Add question to form
- `DELETE /api/questions/:id` - Delete question

### Responses
- `POST /api/forms/:id/responses` - Submit response
- `GET /api/forms/:id/responses` - Get all responses
- `GET /api/forms/:id/responses/check` - Check if user already responded

### Analytics
- `GET /api/forms/:id/behavioral-analysis` - Get behavioral analytics

## Database Schema

The system uses a comprehensive schema with the following main entities:

- **Forms**: Survey containers with settings
- **Questions**: Individual survey questions with types and logic
- **ConditionalLogic**: Rules for showing/hiding questions
- **Responses**: User submissions with timing data
- **ResponseItems**: Individual answers with behavioral metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Future Enhancements

- [ ] Real-time collaboration on forms
- [ ] Advanced chart types and customizations
- [ ] Email notifications for new responses
- [ ] Integration with external services
- [ ] Mobile app development
- [ ] Advanced user authentication and roles
