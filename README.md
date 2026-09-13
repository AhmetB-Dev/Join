# JOIN 360 — Frontend

Responsive Kanban task management frontend built with HTML, CSS and JavaScript.

[Live Demo](https://ahmet-balci.de/projects/join/) · [Frontend Repository](https://github.com/AhmetB-Dev/Join) · [Backend Repository](https://github.com/AhmetB-Dev/join-backend)

## Project Context

JOIN 360 was originally developed collaboratively as a frontend team project.

I later independently developed and integrated the separate Django REST Framework backend used by this application.

The backend includes authentication, user-scoped contacts and tasks, PostgreSQL, Redis, automated tests, Docker and CI/CD.

> This repository documents the frontend project. For my independently developed backend work, see [`AhmetB-Dev/join-backend`](https://github.com/AhmetB-Dev/join-backend).

## Main Features

- Registration and login
- Guest login
- Logout
- Kanban task board
- Create, edit and delete tasks
- Assign tasks to contacts
- Subtasks and progress tracking
- Drag and drop between Kanban columns
- Contact management
- Summary counters
- Upcoming deadline information
- Responsive user interface

## Tech Stack

| Area | Technology |
| --- | --- |
| Structure | HTML |
| Styling | CSS |
| Application logic | JavaScript |
| Backend integration | REST API |
| Backend | Django REST Framework (separate repository) |

## Project Structure

```text
Join/
├── assets/             Static assets
├── pages/              Application pages
├── resources/          Additional project resources
├── scripts/            JavaScript application logic and API integration
├── styles/             CSS styles
├── index.html          Application entry page
└── README.md
```

## Backend Integration

The frontend communicates with the separate JOIN Django REST API.

By default, the API client in `scripts/api.js` connects to:

```text
http://127.0.0.1:8000/api
```

If the backend URL changes, define the API base URL before `api.js` loads:

```html
<script>
  window.JOIN_API_BASE_URL = "https://your-api.example.com/api";
</script>
```

Backend repository:

https://github.com/AhmetB-Dev/join-backend

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/AhmetB-Dev/Join.git
cd Join
```

### 2. Start the backend

Follow the setup instructions in:

https://github.com/AhmetB-Dev/join-backend

### 3. Serve the frontend

Because this is a static frontend, it can be served with VS Code Live Server or another local HTTP server.

Example local URL:

```text
http://127.0.0.1:5500
```

## Application Areas

### Summary

Provides an overview of task counts and upcoming work.

### Board

Kanban-style task management with drag-and-drop between task states.

### Add Task

Creates tasks with contact assignments, subtasks and task metadata.

### Contacts

Provides contact creation and management and allows contacts to be assigned to tasks.

## Fullstack Integration

Although the frontend and backend live in separate repositories, they form one integrated application:

```text
JOIN Frontend
HTML / CSS / JavaScript
        |
        | REST API
        v
JOIN Backend
Django REST Framework
        |
        |-- PostgreSQL
        `-- Redis
```

This integration connects the collaborative frontend project to the backend I independently implemented.

## Related Backend

The separate backend repository contains the main backend-focused work for this project, including:

- Django REST Framework
- authentication
- user-scoped data access
- contacts and tasks APIs
- PostgreSQL
- Redis
- Docker
- automated testing
- GitHub Actions CI/CD
- production deployment

[View the JOIN Backend Repository](https://github.com/AhmetB-Dev/join-backend)

## Project Status

JOIN 360 is available as a deployed portfolio project.

This frontend repository demonstrates the collaborative frontend implementation and its integration with my independently developed backend.

---

Built as part of my Fullstack Developer portfolio.
