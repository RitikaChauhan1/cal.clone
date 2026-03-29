# Cal.com Clone – Scheduling Platform

A full-stack Cal.com-inspired scheduling application that allows users to create event types, set availability, and manage bookings with dynamic time slots and double-booking prevention.

---

## Live Demo
https://cal-clone-g7ro.onrender.com/event-types


---

## Tech Stack

Frontend:
- Next.js (App Router)
- React.js
- Tailwind CSS

Backend:
- Node.js (Next.js API Routes)

Database:
- PostgreSQL
- Prisma ORM

---

## Core Features

### Event Types Management
- Create, edit, and delete event types
- Add title, description, duration, and unique slug
- Generate public booking links for each event

<img width="1919" height="911" alt="image" src="https://github.com/user-attachments/assets/5302d4bf-348d-4f01-a5ff-acb128c444ca" />


### Availability Settings
- Set available days (Monday–Sunday)
- Define time slots (e.g., 9:00 AM – 5:00 PM)
- Timezone-based scheduling
- Support multiple availability profiles

<img width="1919" height="905" alt="image" src="https://github.com/user-attachments/assets/01b9ab13-0a37-4021-baf2-ee9b362dafe2" />


### Public Booking Page
- Dynamic route `/book/[slug]`
- Calendar-based date selection
- Displays available time slots based on availability
- Booking form to collect name and email
- Prevents double booking

<img width="1919" height="907" alt="image" src="https://github.com/user-attachments/assets/709da6fb-ff84-44e4-8d7a-57adf2d257cd" />


### Bookings Dashboard
- View upcoming bookings
- View past bookings
- Cancel bookings
- Real-time status updates

<img width="1919" height="899" alt="image" src="https://github.com/user-attachments/assets/79464b9d-7c0f-4fd9-a083-91ed21524fac" />

---

## Key Highlights

- Prevents double booking using backend validation and database constraints
- Dynamic slot generation based on availability and event duration
- Timezone-aware scheduling
- Unique booking links for each event type

---

## Database Models

- EventType
- AvailabilityProfile
- AvailabilitySlot
- Booking

---

## Installation and Setup

### 1. Clone the repository
git clone https://github.com/your-username/cal-clone.git
cd cal-clone

### 2. Install dependencies
npm install

### 3. Setup environment variables

Create a `.env` file and add:

DATABASE_URL=your_database_url

### 4. Setup database
npx prisma db push
npx prisma generate

### 5. Run the application
npm run dev

---

## Assumptions

- No authentication (default user assumed)
- Public booking page accessible without login

---

## Deployment

- Deployed on Render
- Uses PostgreSQL database

---

## Evaluation Criteria Covered

- Functionality: All core features implemented
- UI/UX: Designed similar to Cal.com
- Database Design: Normalized schema with proper relationships
- Code Quality: Clean and readable code
- Modularity: Service-based architecture

---

## Future Improvements

- Google Calendar integration
- Email notifications
- Rescheduling bookings
- Authentication system

---

## Acknowledgment

Built as part of a Fullstack SDE Intern assignment inspired by Cal.com.

---
# Developed BY:
Name: Ritika Chauhan
UID: 23BCS12506
