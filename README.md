# Working Hours Tracker - Angular Application

A modern, responsive web application built with Angular and Tailwind CSS for tracking employee working hours, costs, sell prices, and profit calculations.

## 🌐 Live Demo

**Application URL**: https://3000-i9mfu12bb1x8dbyj92i1m-5634da27.sandbox.novita.ai

## 🔐 Demo Credentials

### Admin Account (Full Access)
- **Username**: `admin`
- **Password**: `admin123`
- **Access**: All views including profit analysis and worker management

### User Account (Limited Access)
- **Username**: `user`
- **Password**: `user123`
- **Access**: Weekly Hours and Monthly Buy views only

## ✨ Features

### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Role-based access control (admin/user)
- ✅ Protected routes with guards
- ✅ HTTP interceptor for automatic token attachment
- ✅ Redirect to login for unauthenticated users
- ✅ Secure token storage

### Views & Functionality

#### 1. Weekly Hours View (All Users)
- Current week display by default
- Week picker to select different weeks
- Grid showing worker categories, names, and daily hours (Mon-Sun)
- Automatic total hours calculation per worker
- Column totals for each day
- Sortable columns
- CSV export functionality

#### 2. Monthly Buy Costs View (All Users)
- Custom monthly period from 21st to 20th
- Month picker to select different periods
- Worker category, name, and buy price per hour
- Daily hours grid for the entire period (30-31 days)
- Shows "-" for days not worked
- Total hours and total buy cost calculations
- Summary cards showing total hours and total cost
- Sortable columns
- CSV export functionality

#### 3. Monthly Profit Analysis View (Admin Only)
- Same as Monthly Buy view plus:
- Sell price per hour column
- Total sell price calculation
- Profit calculation (sell price - buy cost)
- Summary cards for hours, buy cost, sell price, and profit
- Color-coded profit display
- CSV export functionality

#### 4. Admin Panel (Admin Only)
- **Worker Management**:
  - Create new workers
  - Edit existing workers
  - Delete workers
  - Fields: category, name, buy price, sell price
- **Working Hours Management**:
  - Register hours for workers by date
  - Select worker from dropdown
  - Date picker for flexibility
  - Hours input (0-24)

## 🎨 Design Features

- Modern, clean, and professional UI
- Responsive design (mobile-friendly)
- Collapsible navigation on mobile
- Color-coded data (green for worked hours, red for absences)
- Gradient cards for summary statistics
- Smooth transitions and hover effects
- Centralized color theme in Tailwind config
- Custom scrollbar styling

## 🎨 Theme Configuration

The entire color scheme is centralized in `/tailwind.config.js`. You can change the theme by modifying the color values in one place:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: { ... },    // Main brand color
      secondary: { ... },  // Text and backgrounds
      accent: { ... },     // Admin badges and highlights
      success: { ... },    // Positive indicators
      warning: { ... },    // Buy cost indicators
      danger: { ... }      // Error states
    }
  }
}
```

## 🏗️ Architecture

### Project Structure
```
src/app/
├── core/                    # Core functionality
│   ├── guards/             # Route guards (auth, admin)
│   ├── interceptors/       # HTTP interceptors (JWT)
│   ├── models/             # TypeScript interfaces
│   └── services/           # Data services
│       ├── auth.service.ts
│       ├── worker.service.ts
│       └── csv-export.service.ts
├── features/               # Feature modules
│   ├── auth/              # Login component
│   ├── weekly-hours/      # View 1
│   ├── monthly-buy/       # View 2
│   ├── monthly-profit/    # View 3
│   └── admin/             # Admin panel
└── shared/                # Shared components
    └── components/        # Layout, navigation
```

### Technical Stack
- **Framework**: Angular 19 (standalone components)
- **Styling**: Tailwind CSS 3
- **State Management**: RxJS Observables
- **Forms**: Reactive Forms
- **HTTP**: HttpClient with interceptors
- **Routing**: Angular Router with guards
- **Authentication**: JWT with localStorage
- **Data**: Mock services (ready for backend integration)

### Design Patterns
- Standalone components (no NgModules)
- Service-based architecture
- Reactive programming with RxJS
- Guard-based route protection
- Interceptor-based HTTP middleware
- Feature-based folder structure

## 🔧 Development

### Prerequisites
- Node.js 20.x
- npm 10.x

### Installation
```bash
cd /home/user/webapp
npm install
```

### Development Server
```bash
# Using PM2 (recommended)
pm2 start ecosystem.config.cjs

# Or using Angular CLI
ng serve --host 0.0.0.0 --port 3000
```

### Build
```bash
ng build --configuration development
# or
ng build --configuration production
```

### Available Scripts
```json
{
  "dev": "ng serve",
  "build": "ng build",
  "test": "ng test"
}
```

## 📊 Data Models

### Worker
```typescript
interface Worker {
  id: number;
  category: string;           // e.g., "Consultant", "Developer"
  name: string;
  buyPricePerHour: number;   // Cost per hour
  sellPricePerHour: number;  // Billing rate per hour
}
```

### Working Hours
```typescript
interface WorkingHours {
  workerId: number;
  date: string;              // ISO format (YYYY-MM-DD)
  hours: number;             // 0-24
}
```

## 🔐 Security Features

- JWT token-based authentication
- Role-based route guards
- HTTP interceptor for automatic authorization
- Protected admin routes
- Secure token storage
- Input validation on forms
- XSS protection through Angular

## 📱 Responsive Design

- Desktop: Full layout with side-by-side navigation
- Tablet: Optimized grid layouts
- Mobile: Collapsible navigation menu, stacked cards, horizontal scrolling tables

## 🚀 Deployment Status

- ✅ Development server running on PM2
- ✅ Accessible via public URL
- ✅ Hot reload enabled
- ✅ Git repository initialized

## 🧪 Testing

The application uses mock data services that simulate backend API calls. All data interactions are designed to be easily replaced with real API endpoints.

### Mock Data Includes:
- 5 sample workers across different categories
- 60 days of historical working hours
- Random hours distribution (0-8 hours per day)
- Realistic gaps (30% of days off)

## 🔜 Future Enhancements

- Real backend API integration
- User registration system
- Data persistence
- Advanced reporting and analytics
- Charts and visualizations
- Export to PDF
- Email notifications
- Bulk import of working hours
- Time tracking by project/task
- Automated billing

## 📝 Notes

- All backend calls are currently mocked with observables
- Data resets on application restart
- CSV export works client-side
- Monthly period runs from 21st to 20th (customizable)
- All monetary values in USD (configurable)

## 🛠️ Technology Highlights

- **Angular Best Practices**: Standalone components, reactive forms, proper service injection
- **Tailwind Utility Classes**: Consistent spacing, colors, and responsive design
- **TypeScript**: Strong typing throughout the application
- **RxJS**: Reactive programming for async operations
- **Modern ES6+**: Arrow functions, async/await, destructuring
- **Component Architecture**: Reusable, maintainable code structure

---

**Project Type**: Small Business Management Application
**Status**: ✅ Fully Functional
**Last Updated**: March 3, 2026
