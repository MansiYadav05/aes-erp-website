# AES Industrial ERP System

A full-stack Enterprise Resource Planning (ERP) system designed for industrial businesses. AES provides comprehensive workforce management, task coordination, employee dashboards, and customer inquiry management with a modern, responsive web interface.

## 🚀 Features

### Admin Dashboard
- **Employee Management**: Add, edit, and manage employee profiles with role assignments and salary tracking
- **Task Management**: Assign and track tasks across the organization with deadlines and status updates
- **Contact Inquiries**: Manage customer inquiries and meeting scheduling
- **Broadcast Notifications**: Send notifications to employees or specific users
- **Content Management System (CMS)**: Edit website content including Home, About, Products, Services, and Contact pages via JSON editor
- **System Overview**: Dashboard with key metrics (total workforce, inquiries, active tasks)

### Employee Dashboard
- View assigned tasks with deadlines
- Track personal performance metrics
- Receive and manage notifications
- Access company information and contacts

### Public Website
- **Home**: Landing page with company overview
- **About**: Company information and mission
- **Products**: Showcase industrial products and machinery
- **Services**: Service offerings and capabilities
- **Contact**: Customer inquiry form for meeting requests

### Authentication & Security
- Firebase Authentication integration
- Role-based access control (Admin/Employee)
- Protected routes and dashboards
- User account management

### Database Features
- Employee profiles and department hierarchy
- Task assignment and tracking
- Attendance management
- Salary history and payroll
- Machinery/products catalog
- Website content management
- Contact inquiry storage

## 📋 Tech Stack

### Frontend
- **React** 19.0.0 - UI library
- **TypeScript** 5.8 - Type-safe development
- **Vite** 6.2.0 - Build tool and dev server
- **Tailwind CSS** 4.1 - Utility-first CSS framework
- **React Router** 7.13 - Client-side routing
- **Framer Motion** 12.23 - Animation library
- **Lucide React** - Icon library
- **Firebase** 12.10 - Authentication

### Backend
- **Express.js** 4.21 - Web server framework
- **SQLite (better-sqlite3)** 12.4 - Database
- **TypeScript** - Type safety

### Development Tools
- **tsx** - TypeScript execution
- **ESLint** - Code linting
- **Autoprefixer** - CSS vendor prefixes

## 🛠️ Installation

### Prerequisites
- Node.js 16+ and npm
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aes-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` or `.env` file in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

## 📦 Available Scripts

- **`npm run dev`** - Start development server with hot reload
- **`npm run build`** - Build production-optimized bundle
- **`npm run preview`** - Preview production build locally
- **`npm run clean`** - Remove dist folder
- **`npm run lint`** - Run TypeScript strict mode check

## 📁 Project Structure

```
aes-web/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx          # Navigation component
│   │   └── Footer.tsx          # Footer component
│   ├── pages/
│   │   ├── AdminDashboard.tsx  # Admin management interface
│   │   ├── EmployeeDashboard.tsx # Employee portal
│   │   ├── Home.tsx            # Landing page
│   │   ├── About.tsx           # Company info
│   │   ├── Products.tsx        # Products showcase
│   │   ├── Services.tsx        # Services page
│   │   ├── Contact.tsx         # Contact form
│   │   └── AuthPage.tsx        # Login/signup
│   ├── App.tsx                 # Main app component with routing
│   ├── AuthContext.tsx         # Authentication context and hooks
│   ├── firebase.ts             # Firebase configuration
│   ├── main.tsx                # React entry point
│   └── index.css               # Global styles
├── database/
│   └── schema.sql              # SQLite database schema
├── server.ts                   # Express backend server
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── package.json                # Project dependencies
└── index.html                  # HTML template
```

## 🗄️ Database Schema

The system uses SQLite with the following main tables:

- **users** - Portal access and authentication
- **employees** - Employee profiles and details
- **departments** - Organization structure
- **tasks** - Task assignments and tracking
- **notifications** - User notifications and broadcasts
- **attendance** - Employee attendance records
- **salary_history** - Payroll history
- **inquiries** - Customer contact inquiries
- **website_content** - CMS for website pages
- **machines** - Industrial machinery/products catalog

## 🔐 Authentication Flow

1. Users sign up/login via Firebase Authentication
2. User credentials synced to local SQLite database
3. Role assignment (admin/employee) on signup
4. Authentication context provides user state across the app
5. Protected routes enforce role-based access control

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface with emerald accent colors
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Smooth Animations**: Framer Motion provides fluid UI transitions
- **Dark Admin Dashboard**: High-contrast admin interface for productivity
- **Icon Integration**: Comprehensive icon set via Lucide React
- **Loading States**: Visual feedback with spinners and animations

## 🚦 Getting Started Guide

### For Admins
1. Sign up and request admin role assignment
2. Access `/admin` route to reach the admin dashboard
3. Manage employees, assign tasks, send notifications
4. Edit website content via CMS

### For Employees
1. Sign up with your work email
2. Access `/dashboard` route for your employee portal
3. View assigned tasks and deadlines
4. Receive and manage notifications

### For Visitors
1. Browse public website pages
2. Submit inquiries via the contact form
3. Learn about products and services

## 🔄 API Endpoints

### User Management
- `POST /api/users/sync` - Sync user with database

### Employees
- `GET /api/employees` - Fetch all employees
- `PUT /api/employees/:id` - Update employee profile
- `GET /api/stats` - Get system statistics

### Tasks
- `GET /api/tasks` - Fetch all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task status

### Inquiries
- `GET /api/inquiries` - Fetch inquiries
- `PUT /api/inquiries/:id` - Update inquiry status
- `DELETE /api/inquiries/:id` - Delete inquiry

### Notifications
- `POST /api/notifications` - Send notification/broadcast

### Content Management
- `GET /api/content/:pageId` - Fetch page content
- `POST /api/content/:pageId` - Update page content

### Departments
- `GET /api/departments` - Fetch all departments

## 🛡️ Security Best Practices

- ✅ Role-based access control (RBAC)
- ✅ Firebase secure authentication
- ✅ Environment variables for sensitive data
- ✅ Protected API routes
- ✅ TypeScript type safety
- ✅ CSRF protection (Express.js built-in)

## 📝 Environment Configuration

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| GEMINI_API_KEY | Google Gemini API key | `sk-...` |
| VITE_FIREBASE_API_KEY | Firebase API key | `AIza...` |
| VITE_FIREBASE_PROJECT_ID | Firebase project ID | `aes-erp` |

## 🐛 Troubleshooting

### Port Already in Use
- The dev server runs on port 3000 by default
- To use a different port: `npm run dev -- --port 3001`

### Firebase Auth Issues
- Verify `.env.local` or `.env` file configuration
- Check Firebase console for correct project settings
- Ensure authentication providers are enabled in Firebase

### Database Errors
- SQLite database is auto-initialized from `schema.sql`
- Check the `database/` folder exists and has proper permissions
- Clear database and restart server if needed

### Dependencies Issues
- Run `npm install` again to ensure all packages are installed
- Clear node_modules: `rm -rf node_modules && npm install`

## 📈 Future Enhancements

- Advanced reporting and analytics
- Payroll integration
- Project management features
- Inventory management
- Document storage system
- Mobile app version
- API rate limiting
- Audit logging

## 📄 License

This project is proprietary and confidential.

## 👥 Support

For issues, feature requests, or questions, please contact the development team.

---

**Version**: 2.0  
**Last Updated**: March 2026  
**Status**: Active Development
