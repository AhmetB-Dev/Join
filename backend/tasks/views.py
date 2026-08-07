from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.filter(owner=self.request.user).prefetch_related(
            "assigned_contacts",
            "subtasks",
        )
        column = self.request.query_params.get("column", "").strip()
        if column:
            queryset = queryset.filter(column=column)
        return queryset
