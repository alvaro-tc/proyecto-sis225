from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.core.exceptions import ObjectDoesNotExist
from api.user.models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(min_length=4, max_length=128, write_only=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ["id", "password", "email", "is_active", "date"]

    def validate_email(self, value):
        try:
            User.objects.get(email=value)
        except ObjectDoesNotExist:
            return value
        raise ValidationError({"success": False, "msg": "Email already taken."})

    def create(self, validated_data):
        # create_user expects `email` and `password`
        email = validated_data.get("email")
        password = validated_data.get("password")
        return User.objects.create_user(email=email, password=password)
