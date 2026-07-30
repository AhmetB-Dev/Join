<div align="center">

# Join 360

**A responsive Kanban task management application built with vanilla JavaScript and Firebase Realtime Database.**

![HTML5](https://img.shields.io/badge/HTML5-Semantic_Markup-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Responsive_UI-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-Realtime_Database-FFCA28?logo=firebase&logoColor=black)

</div>

## Overview

Join 360 is a browser-based task management application for organizing work in a clear Kanban workflow. Users can create and manage tasks, assign contacts, track deadlines and subtasks, and move cards between workflow columns using desktop or touch-based drag and drop.

The application is implemented without a frontend framework or build process. Its JavaScript is divided into focused modules for authentication, task handling, board rendering, contact management, Firebase communication, validation, and responsive interactions.

## Core Features

- Responsive dashboard with live task statistics and upcoming deadlines
- Kanban board with **To do**, **In progress**, **Await feedback**, and **Done** columns
- Desktop and touch-enabled drag-and-drop task management
- Create, edit, inspect, and delete tasks
- Task priorities, due dates, categories, assignees, and subtasks
- Contact management with create, edit, delete, and assignment workflows
- Login, sign-up, and guest access flows
- Firebase Realtime Database persistence through the REST API
- Responsive navigation and layouts for desktop, tablet, and mobile devices
- Form validation, loading states, overlays, and user feedback messages
- Privacy policy, legal notice, and help pages

## Application Areas

| Area               | Purpose                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| **Authentication** | Login, registration, guest access, and local session state              |
| **Summary**        | Overview of task counts, urgent tasks, and the next deadline            |
| **Board**          | Kanban workflow with searchable and movable task cards                  |
| **Add Task**       | Task creation with category, priority, deadline, contacts, and subtasks |
| **Contacts**       | Contact list with creation, editing, deletion, and task assignment      |

## Technology Stack

| Technology                          | Usage                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------- |
| **HTML5**                           | Semantic page structure, forms, navigation, dialogs, and content           |
| **CSS3**                            | Responsive layouts, animations, task cards, modals, and mobile navigation  |
| **JavaScript ES6+**                 | Application logic, validation, rendering, state handling, and interactions |
| **Firebase Realtime Database**      | Persistent storage for users, contacts, and tasks                          |
| **Fetch API**                       | REST-based communication with Firebase                                     |
| **Flatpickr**                       | Date selection for task deadlines                                          |
| **Local Storage / Session Storage** | Session-related UI state and user information                              |

No npm installation, bundler, or compilation step is required.

## Technical Design

The codebase separates larger workflows into smaller files with focused responsibilities:

- `auth-core.js` and `auth-ui.js` handle the authentication interface and user flow.
- `firebase.js` provides shared database request helpers.
- `summary.js` normalizes task data and updates dashboard statistics.
- Board modules handle task loading, card rendering, filtering, overlays, editing, and deletion.
- Drag-and-drop logic is separated for pointer and touch interactions.
- Add-task modules separate validation, Firebase persistence, contacts, categories, subtasks, and UI state.
- Contact modules separate database access, validation, rendering, and interface behavior.

Task and contact changes are persisted in Firebase, while the interface is updated dynamically without a page reload where appropriate.

## Project Structure

```text
.
├── html/
│   ├── add_task.html          # Task creation page
│   ├── board.html             # Kanban board
│   └── contacts.html          # Contact management
├── img/                       # Logos, icons, screenshots, and UI assets
├── resources/
│   ├── help/                  # Help page
│   ├── legal-notice/          # Legal notice pages
│   └── private-policy/        # Privacy policy pages
├── scripts/
│   ├── auth-*.js              # Authentication logic and interface
│   ├── addTask*.js            # Task creation modules
│   ├── taskData*.js           # Task loading, rendering, and editing
│   ├── contacts*.js           # Contact management modules
│   ├── draganddrop*.js        # Desktop and touch drag and drop
│   ├── firebase.js            # Shared Firebase REST helpers
│   └── summary.js             # Dashboard statistics
├── styles/                    # Base, page, component, and responsive styles
├── index.html                 # Login and registration entry point
├── summary.html               # Dashboard page
└── README.md
```

## Run Locally

### 1. Clone or download the repository

```bash
git clone https://github.com/AhmetB-Dev/Join.git
cd Join
```

### 2. Configure Firebase

The database URL is defined in:

```text
scripts/firebase.js
```

Use your own Firebase Realtime Database and apply appropriate database security rules before publishing a live deployment.

### 3. Start a local web server

Using Python:

```bash
python -m http.server 5500
```

Alternatively, open the project with the **Live Server** extension in Visual Studio Code.

### 4. Open the application

```text
http://localhost:5500
```

A local server is recommended because direct `file://` access can cause restrictions when loading resources or making network requests.

## Responsive Behaviour

- Desktop layouts provide the complete side navigation and multi-column board.
- Tablet and mobile layouts adapt navigation, forms, cards, and dialogs.
- On smaller screens, task creation uses a dedicated page instead of the desktop modal.
- Touch devices support long-press drag and drop between board columns.
- Empty board columns display a dedicated visual state.

## Deployment

The frontend can be hosted on any static hosting service, including:

- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

The deployed frontend still requires access to a configured Firebase Realtime Database.

## Project Status

The central application flows are implemented: authentication UI, dashboard statistics, task CRUD operations, contact management, desktop and mobile drag and drop, responsive layouts, and Firebase persistence.

Join 360 is maintained as part of my software development portfolio. Before production use, the demo authentication implementation should be replaced with a production-grade identity provider such as Firebase Authentication, together with restrictive database security rules.

## License

This repository currently does not include an open-source license. The source code and included assets may not be copied, modified, or redistributed without permission. Third-party assets and libraries may be subject to their own terms.
