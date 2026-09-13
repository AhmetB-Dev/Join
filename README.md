# JOIN 360 — Frontend

Responsive Kanban task management frontend built with HTML, CSS and JavaScript.

[Live Demo](https://ahmet-balci.de/projects/join/) · [Backend](https://github.com/AhmetB-Dev/join-backend)

## Project Context

JOIN 360 was originally developed collaboratively as a frontend team project.

I later independently developed and integrated the Django REST Framework backend used by the application.

## Features

- Registration and login
- Guest login
- Kanban task board
- Create, edit and delete tasks
- Assign tasks to contacts
- Subtasks and progress tracking
- Drag and drop between Kanban columns
- Contact management
- Summary view
- Responsive layout

## Tech Stack

| Area | Technology |
| --- | --- |
| Structure | HTML |
| Styling | CSS |
| Application logic | JavaScript |
| Backend integration | REST API |
| Backend | Django REST Framework |

## Backend Integration

The frontend communicates with the separate JOIN Django REST API.

By default, the API client connects to:

```text
http://127.0.0.1:8000/api
```

A different API base URL can be configured before the API client loads:

```html
<script>
  window.JOIN_API_BASE_URL = "https://your-api.example.com/api";
</script>
```

## Local Setup

```bash
git clone https://github.com/AhmetB-Dev/Join.git
cd Join
```

Start the backend using the setup instructions in the linked backend repository.

Serve the frontend with a local HTTP server such as VS Code Live Server.

## Fullstack Integration

The frontend and backend are maintained in separate repositories but work together as one application.

The backend adds:

- authentication
- user-scoped contacts and tasks
- PostgreSQL
- Redis
- automated tests
- Docker
- CI/CD
- production deployment

---

Built as part of my Fullstack Developer portfolio.
