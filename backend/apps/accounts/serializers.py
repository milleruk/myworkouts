from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["timezone", "unit_system", "date_of_birth", "sex"]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "profile"]
        read_only_fields = ["id", "email"]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        instance = super().update(instance, validated_data)
        if profile_data is not None:
            for attr, value in profile_data.items():
                setattr(instance.profile, attr, value)
            instance.profile.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
