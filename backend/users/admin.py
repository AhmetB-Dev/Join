from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class JoinUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("JOIN", {"fields": ("name",)}),)
    add_fieldsets = UserAdmin.add_fieldsets + (("JOIN", {"fields": ("name", "email")}),)
    list_display = ("username", "name", "email", "is_staff", "is_active")
    search_fields = ("username", "name", "email")
