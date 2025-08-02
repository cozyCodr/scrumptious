# Scrumptious

A modern project management application designed for agile teams that need structured goal-setting and daily stand-up tracking.

## What is Scrumptious?

Scrumptious is a comprehensive project management platform that follows a hierarchical approach to organizing work:

- **Vision**: The overarching goal or purpose of a project
- **Targets**: Sub-goals that contribute to achieving the vision
- **Tasks**: Specific actionable items within each target

The application integrates seamlessly with agile methodologies by providing built-in daily stand-up questionnaires and progress tracking.

## Key Features

### Project Management
- **Hierarchical Structure**: Organize work from high-level visions down to specific tasks
- **Target Management**: Create and track sub-goals with task counters
- **Progress Visualization**: Clear overview of project status and completion rates

### Daily Stand-ups
- **Interactive Questionnaires**: Built-in forms for daily stand-up responses
- **Team Updates**: Track what team members accomplished, plan to work on, and any blockers
- **Historical Tracking**: View past stand-up responses and team progress over time

### User Management
- **Organization Settings**: Manage team members and organizational details
- **Role-based Access**: Different permission levels for team members
- **Billing Integration**: Usage tracking and plan management

### Authentication & Security
- **Secure Login**: Email/password authentication with remember me functionality
- **User Registration**: Organization-based signup with domain verification
- **Password Recovery**: Secure password reset flow
- **Account Security**: Comprehensive security settings and notifications

## Technology Stack

- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks (useState, useEffect, useRef)
- **Navigation**: Next.js App Router with client-side routing

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/src/app/` - Main application pages and routing
- `/src/app/login/` - Authentication screens (login, signup, forgot password)
- `/src/app/project/[id]/` - Project detail pages with targets and tasks
- `/src/app/settings/` - Organization management and user settings
- `/src/app/standups/` - Daily stand-up management and history

## Usage

1. **Create an Organization**: Sign up and set up your organization
2. **Add Team Members**: Invite colleagues through the settings page
3. **Start a Project**: Define your project vision and create targets
4. **Daily Stand-ups**: Use the built-in questionnaire for daily check-ins
5. **Track Progress**: Monitor target completion and team productivity

Scrumptious streamlines agile project management by combining structured goal-setting with regular team communication, making it easier for teams to stay aligned and productive.