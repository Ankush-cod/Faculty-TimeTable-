# Faculty Timetable Management System

A full-stack web application designed to automate faculty timetable generation, subject allocation, and workload management for academic institutions.

## Features

* Secure role-based authentication using JWT.
* Faculty and subject management.
* Automated timetable generation.
* Priority-based subject allocation using faculty preferences, experience, and designation.
* Conflict detection to prevent scheduling clashes.
* Faculty workload management.
* Excel import/export support for bulk data handling.
* Responsive and user-friendly interface.

## Tech Stack

### Frontend

* React.js
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Authentication

* JWT (JSON Web Token)
* bcrypt

### Additional Libraries

* XLSX
* Multer
* Axios

## Installation

### Clone the repository

```bash
git clone https://github.com/Ankush-cod/Faculty-TimeTable-.git
cd Faculty-TimeTable-
```

### Install dependencies

Frontend:

```bash
cd frontend
npm install
```

Backend:

```bash
cd backend
npm install
```

### Configure Environment Variables

Create a `.env` file in the backend directory and add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### Run the Application

Backend:

```bash
npm start
```

Frontend:

```bash
npm run dev
```

## Project Structure

```text
Faculty-TimeTable-
├── frontend
├── backend
├── README.md
└── package.json
```

## Future Enhancements

* Classroom allocation system
* Faculty leave management
* Timetable PDF generation
* Advanced scheduling constraints
* Email notifications

## Author

**Ankush Shrivastav**

* GitHub: https://github.com/Ankush-cod
* LinkedIn: https://www.linkedin.com/in/ankush-shrivastav/
