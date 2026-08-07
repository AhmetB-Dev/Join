from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from contacts.views import ContactViewSet
from core.views import api_root, health_check
from tasks.views import TaskViewSet

router = DefaultRouter()
router.register("contacts", ContactViewSet, basename="contact")
router.register("tasks", TaskViewSet, basename="task")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api_root, name="api-root"),
    path("api/health/", health_check, name="health-check"),
    path("api/auth/", include("users.urls")),
    path("api/", include(router.urls)),
]
