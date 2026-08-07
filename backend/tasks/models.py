from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from contacts.models import Contact


class Task(models.Model):
    class Column(models.TextChoices):
        TODO = "toDoColumn", "To do"
        IN_PROGRESS = "inProgress", "In Progress"
        AWAIT_FEEDBACK = "awaitFeedback", "Await Feedback"
        DONE = "done", "Done"

    class Priority(models.TextChoices):
        URGENT = "urgent", "Urgent"
        MEDIUM = "medium", "Medium"
        LOW = "low", "Low"

    # Nullable only for backwards compatibility with databases created before
    # per-user data isolation was introduced. The API never exposes owner-less rows.
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="No description provided")
    due_date = models.DateField()
    category = models.CharField(max_length=50, default="Technical task")
    column = models.CharField(max_length=30, choices=Column.choices, default=Column.TODO, db_index=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.LOW)
    progress = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    assigned_contacts = models.ManyToManyField(Contact, blank=True, related_name="tasks")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.title


class Subtask(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="subtasks")
    text = models.CharField(max_length=250)
    completed = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self):
        return self.text
