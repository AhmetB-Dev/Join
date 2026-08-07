import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("contacts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Task",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("description", models.TextField(blank=True, default="No description provided")),
                ("due_date", models.DateField()),
                ("category", models.CharField(default="Technical task", max_length=50)),
                ("column", models.CharField(choices=[("toDoColumn", "To do"), ("inProgress", "In Progress"), ("awaitFeedback", "Await Feedback"), ("done", "Done")], db_index=True, default="toDoColumn", max_length=30)),
                ("priority", models.CharField(choices=[("urgent", "Urgent"), ("medium", "Medium"), ("low", "Low")], default="low", max_length=10)),
                ("progress", models.PositiveSmallIntegerField(default=0, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("assigned_contacts", models.ManyToManyField(blank=True, related_name="tasks", to="contacts.contact")),
            ],
            options={"ordering": ["id"]},
        ),
        migrations.CreateModel(
            name="Subtask",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("text", models.CharField(max_length=250)),
                ("completed", models.BooleanField(default=False)),
                ("position", models.PositiveIntegerField(default=0)),
                ("task", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="subtasks", to="tasks.task")),
            ],
            options={"ordering": ["position", "id"]},
        ),
    ]
