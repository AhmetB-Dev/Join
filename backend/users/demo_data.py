from datetime import date, timedelta

from contacts.models import Contact
from tasks.models import Subtask, Task


DEMO_CONTACTS = [
    {"name": "Anna Becker", "email": "anna.becker@example.com", "phone": "+49 000 100001"},
    {"name": "Daniel Weber", "email": "daniel.weber@example.com", "phone": "+49 000 100002"},
    {"name": "Sofia Klein", "email": "sofia.klein@example.com", "phone": "+49 000 100003"},
    {"name": "Lukas Fischer", "email": "lukas.fischer@example.com", "phone": "+49 000 100004"},
    {"name": "Mia Schneider", "email": "mia.schneider@example.com", "phone": "+49 000 100005"},
    {"name": "Noah Hoffmann", "email": "noah.hoffmann@example.com", "phone": "+49 000 100006"},
    {"name": "Lea Wagner", "email": "lea.wagner@example.com", "phone": "+49 000 100007"},
    {"name": "Jonas Richter", "email": "jonas.richter@example.com", "phone": "+49 000 100008"},
]


DEMO_TASKS = [
    {
        "title": "Implement authentication flow",
        "description": "Connect login, registration and logout to the backend API and verify error handling.",
        "due_in": 3,
        "category": "Technical task",
        "column": Task.Column.TODO,
        "priority": Task.Priority.URGENT,
        "users": ["Daniel Weber", "Sofia Klein"],
        "subtasks": [
            {"text": "Connect login endpoint", "completed": True},
            {"text": "Handle invalid credentials", "completed": False},
            {"text": "Test logout flow", "completed": False},
        ],
    },
    {
        "title": "Improve board mobile layout",
        "description": "Polish card spacing, touch interactions and responsive behavior for smaller screens.",
        "due_in": 7,
        "category": "User Story",
        "column": Task.Column.IN_PROGRESS,
        "priority": Task.Priority.MEDIUM,
        "users": ["Anna Becker", "Mia Schneider"],
        "subtasks": [
            {"text": "Review breakpoints", "completed": True},
            {"text": "Optimize drag interactions", "completed": True},
            {"text": "Test on mobile viewport", "completed": False},
        ],
    },
    {
        "title": "Accessibility review",
        "description": "Check keyboard navigation, labels, focus states and color contrast across the main views.",
        "due_in": 5,
        "category": "Technical task",
        "column": Task.Column.AWAIT_FEEDBACK,
        "priority": Task.Priority.URGENT,
        "users": ["Lea Wagner", "Lukas Fischer"],
        "subtasks": [
            {"text": "Keyboard navigation", "completed": True},
            {"text": "Form labels", "completed": True},
            {"text": "Contrast review", "completed": False},
        ],
    },
    {
        "title": "Prepare release notes",
        "description": "Summarize the latest frontend and backend changes for the next project release.",
        "due_in": 1,
        "category": "User Story",
        "column": Task.Column.DONE,
        "priority": Task.Priority.LOW,
        "users": ["Jonas Richter"],
        "subtasks": [
            {"text": "List completed features", "completed": True},
            {"text": "Document known limitations", "completed": True},
        ],
    },
    {
        "title": "Add API integration tests",
        "description": "Cover task and contact CRUD operations with authenticated API tests.",
        "due_in": 10,
        "category": "Technical task",
        "column": Task.Column.IN_PROGRESS,
        "priority": Task.Priority.MEDIUM,
        "users": ["Noah Hoffmann", "Daniel Weber"],
        "subtasks": [
            {"text": "Contact API tests", "completed": True},
            {"text": "Task API tests", "completed": False},
            {"text": "Guest isolation tests", "completed": False},
        ],
    },
    {
        "title": "Plan dashboard improvements",
        "description": "Collect ideas for a clearer summary view and prioritize the next UI improvements.",
        "due_in": 14,
        "category": "User Story",
        "column": Task.Column.TODO,
        "priority": Task.Priority.LOW,
        "users": ["Anna Becker", "Sofia Klein", "Jonas Richter"],
        "subtasks": [
            {"text": "Review current summary", "completed": False},
            {"text": "Collect team feedback", "completed": False},
        ],
    },
]


def _progress(subtasks):
    if not subtasks:
        return 0
    completed = sum(1 for item in subtasks if item.get("completed"))
    return round((completed / len(subtasks)) * 100)


def create_guest_demo_data(user):
    """Create an isolated, realistic demo board for one temporary guest user."""
    contacts = {}
    for item in DEMO_CONTACTS:
        contact = Contact.objects.create(owner=user, **item)
        contacts[contact.name] = contact

    today = date.today()
    for item in DEMO_TASKS:
        subtasks = item["subtasks"]
        task = Task.objects.create(
            owner=user,
            title=item["title"],
            description=item["description"],
            due_date=today + timedelta(days=item["due_in"]),
            category=item["category"],
            column=item["column"],
            priority=item["priority"],
            progress=_progress(subtasks),
        )
        task.assigned_contacts.set(
            [contacts[name] for name in item["users"] if name in contacts]
        )
        Subtask.objects.bulk_create(
            [
                Subtask(
                    task=task,
                    text=subtask["text"],
                    completed=subtask.get("completed", False),
                    position=index,
                )
                for index, subtask in enumerate(subtasks)
            ]
        )
