from django.contrib import admin
from .models import Subtask, Task


class SubtaskInline(admin.TabularInline):
    model = Subtask
    extra = 0


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "category", "column", "priority", "due_date")
    list_filter = ("column", "priority", "category", "owner")
    search_fields = ("title", "description", "owner__email")
    filter_horizontal = ("assigned_contacts",)
    inlines = [SubtaskInline]
