from datetime import date

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Task


class TaskApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester@example.com",
            email="tester@example.com",
            name="Tester",
            password="StrongPass-2026!",
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_create_and_patch_join_compatible_task(self):
        response = self.client.post(
            "/api/tasks/",
            {
                "title": "Board erstellen",
                "description": "No description provided",
                "dueDate": "11/10/2026",
                "category": "Technical task",
                "column": "toDoColumn",
                "priority": "../img/priority-img/urgent.png",
                "progress": 0,
                "users": [{"name": "Thomas Müller"}, {"name": "Frederik Schneider"}],
                "subtasks": [{"text": "API testen", "completed": False}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["priority"], "../img/priority-img/urgent.png")
        self.assertEqual(response.data["dueDate"], "11/10/2026")
        self.assertEqual(len(response.data["users"]), 2)
        self.assertEqual(len(response.data["subtasks"]), 1)
        self.assertEqual(Task.objects.get(pk=response.data["id"]).owner, self.user)

        task_id = response.data["id"]
        patched = self.client.patch(f"/api/tasks/{task_id}/", {"column": "done"}, format="json")
        self.assertEqual(patched.status_code, status.HTTP_200_OK)
        self.assertEqual(patched.data["column"], "done")
        self.assertEqual(len(patched.data["users"]), 2)

    def test_tasks_from_other_users_are_hidden(self):
        other = get_user_model().objects.create_user(
            username="other@example.com",
            email="other@example.com",
            name="Other",
            password="StrongPass-2026!",
        )
        Task.objects.create(
            owner=other,
            title="Hidden Task",
            due_date=date(2026, 10, 11),
        )

        response = self.client.get("/api/tasks/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
