from django.contrib import admin
from .models import Contact


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "phone", "owner")
    search_fields = ("name", "email", "phone", "owner__email")
    list_filter = ("owner",)
