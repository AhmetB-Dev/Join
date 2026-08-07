from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    uid = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = User
        fields = ("id", "uid", "name", "email", "createdAt")

    def get_uid(self, obj):
        return f"u-{obj.pk}"


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email is already registered.")
        return email

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        email = validated_data["email"]
        return User.objects.create_user(
            username=email,
            email=email,
            name=validated_data["name"].strip(),
            password=validated_data["password"],
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise serializers.ValidationError("E-Mail und Passwort prüfen.")

        authenticated = authenticate(
            request=self.context.get("request"),
            username=user.username,
            password=attrs["password"],
        )
        if not authenticated:
            raise serializers.ValidationError("E-Mail und Passwort prüfen.")
        if not authenticated.is_active:
            raise serializers.ValidationError("Dieses Benutzerkonto ist deaktiviert.")

        attrs["user"] = authenticated
        return attrs
