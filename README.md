# JOIN 360 — Django REST Backend

JOIN 360 is a responsive Kanban task management application with a vanilla HTML/CSS/JavaScript frontend and a Django REST Framework backend.

## Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Python, Django, Django REST Framework
- Development database: SQLite
- Authentication: Django REST Framework token authentication

## Main features

- Registration, login, guest login and logout
- Contacts CRUD
- Tasks CRUD
- Task assignment to contacts
- Subtasks and progress
- Kanban column updates / drag and drop
- Summary counters and upcoming deadline

## Project structure

```text
JOIN/
├── backend/                 # Django REST API
│   ├── config/
│   ├── users/
│   ├── contacts/
│   ├── tasks/
│   ├── manage.py
│   └── requirements.txt
├── scripts/
│   ├── api.js               # Central frontend API client
│   └── ...
├── html/
├── styles/
├── img/
├── index.html
└── summary.html
```

## Start the backend

From the `backend` directory:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API is then available at:

```text
http://127.0.0.1:8000/api/
```

## Load the existing JOIN demo data

The previous JOIN contacts and tasks were converted into a neutral seed file. To load them:

```powershell
python manage.py seed_join --clear
```

User accounts are intentionally not seeded. Register a fresh user through the JOIN login page so passwords are handled by Django's password hashing.

## Start the frontend

Serve the project with VS Code Live Server (for example `http://127.0.0.1:5500`). The frontend API client in `scripts/api.js` connects to `http://127.0.0.1:8000/api` by default.

If the backend URL changes, set this before `api.js` loads:

```html
<script>
  window.JOIN_API_BASE_URL = "https://your-api.example.com/api";
</script>
```

## API endpoints

```text
POST   /api/auth/register/
POST   /api/auth/login/
POST   /api/auth/guest/
POST   /api/auth/logout/
GET    /api/auth/me/

GET    /api/contacts/
POST   /api/contacts/
GET    /api/contacts/<id>/
PUT    /api/contacts/<id>/
PATCH  /api/contacts/<id>/
DELETE /api/contacts/<id>/

GET    /api/tasks/
POST   /api/tasks/
GET    /api/tasks/<id>/
PUT    /api/tasks/<id>/
PATCH  /api/tasks/<id>/
DELETE /api/tasks/<id>/
```

## Production notes

Before deployment, move `SECRET_KEY` to an environment variable, set `DEBUG = False`, configure `ALLOWED_HOSTS`, use a production database such as PostgreSQL, and restrict CORS to the deployed frontend origin.
