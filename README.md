# JOIN 360 — Frontend

JOIN 360 is a responsive Kanban task management application built with HTML, CSS and JavaScript.

## Project context

The JOIN 360 frontend was developed collaboratively as a team project.

The backend is maintained in a separate repository and was independently developed by me using Python, Django and Django REST Framework.

**Backend repository:** [AhmetB-Dev/join-backend](https://github.com/AhmetB-Dev/join-backend)

## Stack

- HTML
- CSS
- JavaScript

## Main features

- Registration, login, guest login and logout
- Kanban task board
- Create, edit and delete tasks
- Assign tasks to contacts
- Subtasks and progress tracking
- Drag and drop between Kanban columns
- Contact management
- Summary counters and upcoming deadlines
- Responsive user interface

## Project structure

```text
Join/
├── html/
├── styles/
├── scripts/
│   ├── api.js
│   └── ...
├── img/
├── index.html
└── summary.html
```

## Start locally

The frontend can be served locally with VS Code Live Server or another local web server.

Example:

```text
http://127.0.0.1:5500
```

## Backend integration

The frontend communicates with the separate Django REST API.

By default, the API client in `scripts/api.js` connects to:

```text
http://127.0.0.1:8000/api
```

If the backend URL changes, configure the API base URL before `api.js` loads:

```html
<script>
  window.JOIN_API_BASE_URL = "https://your-api.example.com/api";
</script>
```

For backend setup, API endpoints and backend documentation, see:

**[JOIN 360 Django REST Backend](https://github.com/AhmetB-Dev/join-backend)**
