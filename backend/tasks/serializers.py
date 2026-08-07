from django.db import transaction
from rest_framework import serializers

from contacts.models import Contact
from .models import Subtask, Task


class DueDateField(serializers.DateField):
    def __init__(self, **kwargs):
        kwargs.setdefault("format", "%d/%m/%Y")
        kwargs.setdefault("input_formats", ["%d/%m/%Y", "%Y-%m-%d"])
        super().__init__(**kwargs)


class PriorityField(serializers.ChoiceField):
    def __init__(self, **kwargs):
        super().__init__(choices=Task.Priority.choices, **kwargs)

    def to_internal_value(self, data):
        value = str(data or "").strip().lower()
        if "urgent" in value:
            data = Task.Priority.URGENT
        elif "medium" in value:
            data = Task.Priority.MEDIUM
        elif "low" in value:
            data = Task.Priority.LOW
        return super().to_internal_value(data)

    def to_representation(self, value):
        # Keep the current frontend contract so existing image rendering continues to work.
        return f"../img/priority-img/{value}.png"


class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = ("id", "text", "completed")
        read_only_fields = ("id",)


class AssignedUserInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)


class TaskSerializer(serializers.ModelSerializer):
    dueDate = DueDateField(source="due_date")
    priority = PriorityField()
    users = AssignedUserInputSerializer(many=True, write_only=True, required=False)
    subtasks = SubtaskSerializer(many=True, required=False)

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "dueDate",
            "category",
            "column",
            "priority",
            "progress",
            "users",
            "subtasks",
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["users"] = [{"name": contact.name} for contact in instance.assigned_contacts.all()]
        return data

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Titel darf nicht leer sein.")
        return value

    def _owner(self):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            raise serializers.ValidationError("Authenticated user is required.")
        return request.user

    def _get_or_create_contacts(self, users_data):
        owner = self._owner()
        contacts = []
        seen = set()
        for user_data in users_data:
            name = user_data["name"].strip()
            key = name.casefold()
            if not name or key in seen:
                continue
            seen.add(key)
            contact = Contact.objects.filter(owner=owner, name__iexact=name).order_by("id").first()
            if contact is None:
                contact = Contact.objects.create(owner=owner, name=name)
            contacts.append(contact)
        return contacts

    @staticmethod
    def _replace_subtasks(task, subtasks_data):
        task.subtasks.all().delete()
        Subtask.objects.bulk_create(
            [
                Subtask(
                    task=task,
                    text=item["text"].strip(),
                    completed=item.get("completed", False),
                    position=index,
                )
                for index, item in enumerate(subtasks_data)
                if item["text"].strip()
            ]
        )

    @transaction.atomic
    def create(self, validated_data):
        users_data = validated_data.pop("users", [])
        subtasks_data = validated_data.pop("subtasks", [])
        task = Task.objects.create(owner=self._owner(), **validated_data)
        task.assigned_contacts.set(self._get_or_create_contacts(users_data))
        self._replace_subtasks(task, subtasks_data)
        return task

    @transaction.atomic
    def update(self, instance, validated_data):
        users_data = validated_data.pop("users", None)
        subtasks_data = validated_data.pop("subtasks", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if users_data is not None:
            instance.assigned_contacts.set(self._get_or_create_contacts(users_data))
        if subtasks_data is not None:
            self._replace_subtasks(instance, subtasks_data)
        return instance
