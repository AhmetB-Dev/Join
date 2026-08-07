from django.conf import settings
from django.db import models


class Contact(models.Model):
    # Nullable only for backwards compatibility with databases created before
    # per-user data isolation was introduced. The API never exposes owner-less rows.
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="contacts",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=150, db_index=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "id"]

    def __str__(self):
        return self.name
