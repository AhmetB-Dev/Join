from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.reverse import reverse


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok", "service": "JOIN API"})


@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    return Response(
        {
            "health": reverse("health-check", request=request),
            "register": reverse("register", request=request),
            "login": reverse("login", request=request),
            "guestLogin": reverse("guest-login", request=request),
            "contacts": reverse("contact-list", request=request),
            "tasks": reverse("task-list", request=request),
        }
    )
