# JOIN Django backend

The backend uses Django REST Framework and token authentication.

## Start locally

```powershell
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Data behavior

- Registered users start with an empty board and an empty contact list.
- Every user can only access their own contacts and tasks.
- Guest login automatically creates an isolated demo workspace with fictional contacts, tasks and subtasks.
- Guest demo data is deleted together with the temporary guest account when the user logs out.
- No Firebase export or manual seed command is required.

The demo identities use `example.com` addresses and placeholder phone numbers. They are presentation data, not real people.
