from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Contact


class ContactApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester@example.com",
            email="tester@example.com",
            name="Tester",
            password="StrongPass-2026!",
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_contact_crud_is_owned_by_current_user(self):
        created = self.client.post(
            "/api/contacts/",
            {"name": "Thomas Müller", "email": "THOMAS@example.com", "phone": "12345"},
            format="json",
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created.data["email"], "thomas@example.com")
        self.assertEqual(Contact.objects.get(pk=created.data["id"]).owner, self.user)

        response = self.client.get("/api/contacts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_contacts_from_other_users_are_hidden(self):
        other = get_user_model().objects.create_user(
            username="other@example.com",
            email="other@example.com",
            name="Other",
            password="StrongPass-2026!",
        )
        Contact.objects.create(owner=other, name="Hidden Contact")

        response = self.client.get("/api/contacts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
