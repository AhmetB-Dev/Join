from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from contacts.models import Contact
from tasks.models import Task


class AuthApiTests(APITestCase):
    def test_register_login_and_me(self):
        register = self.client.post(
            "/api/auth/register/",
            {"name": "Max Mustermann", "email": "max@example.com", "password": "StrongPass-2026!"},
            format="json",
        )
        self.assertEqual(register.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", register.data)
        self.assertNotIn("password", register.data["user"])

        login = self.client.post(
            "/api/auth/login/",
            {"email": "MAX@example.com", "password": "StrongPass-2026!"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login.data['token']}")
        me = self.client.get("/api/auth/me/")
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data["email"], "max@example.com")

        self.assertEqual(Contact.objects.filter(owner_id=me.data["id"]).count(), 0)
        self.assertEqual(Task.objects.filter(owner_id=me.data["id"]).count(), 0)

    def test_guest_login_gets_isolated_demo_data(self):
        first = self.client.post("/api/auth/guest/", {}, format="json")
        second = self.client.post("/api/auth/guest/", {}, format="json")
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertTrue(first.data["isGuest"])
        self.assertNotEqual(first.data["token"], second.data["token"])

        first_user = get_user_model().objects.get(pk=first.data["user"]["id"])
        second_user = get_user_model().objects.get(pk=second.data["user"]["id"])
        self.assertGreater(Contact.objects.filter(owner=first_user).count(), 0)
        self.assertGreater(Task.objects.filter(owner=first_user).count(), 0)
        self.assertEqual(
            Contact.objects.filter(owner=first_user).count(),
            Contact.objects.filter(owner=second_user).count(),
        )
        self.assertEqual(
            Task.objects.filter(owner=first_user).count(),
            Task.objects.filter(owner=second_user).count(),
        )

    def test_guest_logout_deletes_guest_demo_data(self):
        guest = self.client.post("/api/auth/guest/", {}, format="json")
        user_id = guest.data["user"]["id"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {guest.data['token']}")

        logout = self.client.post("/api/auth/logout/", {}, format="json")
        self.assertEqual(logout.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(get_user_model().objects.filter(pk=user_id).exists())
        self.assertFalse(Contact.objects.filter(owner_id=user_id).exists())
        self.assertFalse(Task.objects.filter(owner_id=user_id).exists())
