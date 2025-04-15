# Aditi Daily Updates

A modern web application for tracking and managing daily employee updates and task progress.

![Aditi Daily Updates](public/aditi.png)

## Features

- **OTP Authentication**: Secure email-based one-time password login
- **Role-Based Access Control**:
  - Admins: View all updates across all teams
  - Managers: View updates from their teams
  - Users: View and submit their own updates
- **Daily Update Submission**:
  - Task tracking
  - Status updates (In Progress, Completed, Blocked)
  - Blocker/Risk/Dependency tracking
- **Responsive Dashboard**:
  - Filtering by date, team, and status
  - Detailed view of all updates
  - Statistics and metrics
- **Mobile-Responsive Design**: Works on all devices

## Technology Stack

- **Frontend**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, Authentication, Row-Level Security)
- **Deployment**: Netlify / Vercel

## Getting Started

Please refer to the [SETUP.md](SETUP.md) file for detailed instructions on how to set up and run the application.

## Project Structure

```
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utility functions and shared logic
│   ├── pages/               # Next.js pages
│   └── styles/              # Global styles
├── sql/                     # SQL schema and migrations
├── .env.example             # Example environment variables
├── README.md                # This file
└── SETUP.md                 # Setup instructions
```

## Screenshots

### Login Page
![Login Page](public/screenshots/login.png)

### User Dashboard
![User Dashboard](public/screenshots/user-dashboard.png)

### Manager/Admin Dashboard
![Admin Dashboard](public/screenshots/admin-dashboard.png)

### Daily Update Form
![Daily Update Form](public/screenshots/update-form.png)

## License

This project is proprietary and confidential to Aditi Consulting.

## Support

For any questions or support needs, please contact the development team.

---

© 2023 Aditi Consulting. All rights reserved.

I see that in this page --> daily-update-form/
The team name fetching --> cause the full page to reload.


