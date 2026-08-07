from rest_framework import serializers

from .models import Contact


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ("id", "name", "email", "phone")

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name darf nicht leer sein.")
        return value

    def validate_email(self, value):
        return value.strip().lower()

    def validate_phone(self, value):
        return value.strip()
