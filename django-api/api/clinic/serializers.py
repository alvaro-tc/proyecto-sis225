from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from .models import (
    Dueno,
    Recepcionista,
    Mascota,
    Consulta,
    Veterinario,
    # Comprobante removed — not used
)
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from datetime import date
from datetime import time as _time

User = get_user_model()


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email")


class DuenoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dueno
        fields = ("idDueno", "nombre", "telefono")


class DuenoCreateSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    telefono = serializers.CharField(max_length=50, required=False, allow_null=True, allow_blank=True)
    def create(self, validated_data):
        nombre = validated_data.get("nombre", None)
        telefono = validated_data.get("telefono", None)

        default_name = nombre or ""
        dueno = Dueno.objects.create(nombre=default_name, telefono=telefono)

        return dueno


class DuenoSelfRegisterSerializer(serializers.Serializer):
    # minimal fields to create a Dueno (no linked User)
    nombre = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    telefono = serializers.CharField(max_length=50, required=False, allow_null=True, allow_blank=True)

    def create(self, validated_data):
        nombre = validated_data.get("nombre", None)
        telefono = validated_data.get("telefono", None)
        default_name = nombre or ""
        dueno = Dueno.objects.create(nombre=default_name, telefono=telefono)
        return dueno


class RecepcionistaCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    nombre = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    telefono = serializers.CharField(max_length=50, required=False, allow_null=True, allow_blank=True)

    def validate(self, data):
        email = data.get("email")
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Email already taken"})
        return data

    def create(self, validated_data):
        email = validated_data.get("email")
        password = validated_data.get("password")
        nombre = validated_data.get("nombre", None)
        telefono = validated_data.get("telefono", None)
        # create user and mark as staff
        user = User.objects.create_user(email=email, password=password)
        # persist telefono on user when provided
        if telefono:
            try:
                user.telefono = telefono
            except Exception:
                pass
        user.is_staff = True
        user.save()

        default_name = nombre or (email.split("@")[0] if email else "")
        recep = Recepcionista.objects.create(user=user, nombre=default_name, telefono=telefono)
        return recep


class RecepcionistaSerializer(serializers.ModelSerializer):
    user = UserNestedSerializer(read_only=True)
    telefono = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Recepcionista
        # explicit fields for consistent response shape with Veterinario
        fields = ("idRecepcionista", "user", "nombre", "telefono")

    def get_telefono(self, obj):
        try:
            # prefer the telefono stored on the Recepcionista profile
            if getattr(obj, "telefono", None):
                return obj.telefono
            # fallback to linked user's telefono if present
            if obj.user and getattr(obj.user, "telefono", None):
                return obj.user.telefono
        except Exception:
            pass
        return None

    # Annotate schema type for spectacular
    get_telefono = extend_schema_field(OpenApiTypes.STR)(get_telefono)


class VeterinarioSerializer(serializers.ModelSerializer):
    user = UserNestedSerializer(read_only=True)
    telefono = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Veterinario
        # include telefono derived from linked user for GET responses and working hours
        fields = ("idVeterinario", "user", "nombre", "telefono", "work_start", "work_end", "work_days")

    def get_telefono(self, obj):
        try:
            if obj.user and getattr(obj.user, "telefono", None):
                return obj.user.telefono
        except Exception:
            pass
        return None

    # Annotate schema type for spectacular
    get_telefono = extend_schema_field(OpenApiTypes.STR)(get_telefono)


class DuenoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dueno
        fields = ("nombre", "telefono")

    def update(self, instance, validated_data):
        # Simple update: Dueno is not linked to User anymore
        instance = super().update(instance, validated_data)
        return instance


class RecepcionistaUpdateSerializer(serializers.ModelSerializer):
    # allow updating profile fields plus email/password on the linked User
    email = serializers.EmailField(required=False, write_only=True)
    password = serializers.CharField(required=False, write_only=True)
    telefono = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = Recepcionista
        fields = ("nombre", "telefono", "email", "password")

    def update(self, instance, validated_data):
        # Extract user fields
        email = validated_data.pop("email", None)
        password = validated_data.pop("password", None)
        telefono = validated_data.get("telefono", None)

        # Update profile fields (nombre, telefono)
        instance = super().update(instance, validated_data)

        # Update linked user if present
        try:
            user = instance.user
            changed = False
            if email:
                user.email = email
                changed = True
            if password:
                user.set_password(password)
                changed = True
            # also persist telefono on linked User if provided
            if telefono is not None:
                try:
                    user.telefono = telefono
                    changed = True
                except Exception:
                    pass
            if changed:
                user.save()
        except Exception:
            pass

        return instance


class VeterinarioUpdateSerializer(serializers.ModelSerializer):
    # Veterinario model does not have telefono; accept telefono and persist it on linked User
    email = serializers.EmailField(required=False, write_only=True)
    password = serializers.CharField(required=False, write_only=True)
    telefono = serializers.CharField(max_length=50, required=False, allow_null=True, allow_blank=True)

    # Allow updating working hours and days
    work_start = serializers.TimeField(required=False, allow_null=True)
    work_end = serializers.TimeField(required=False, allow_null=True)
    work_days = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Veterinario
        fields = ("nombre", "telefono", "email", "password", "work_start", "work_end", "work_days")

    def update(self, instance, validated_data):
        email = validated_data.pop("email", None)
        password = validated_data.pop("password", None)
        telefono = validated_data.pop("telefono", None)
        # working hours
        work_start = validated_data.pop("work_start", None)
        work_end = validated_data.pop("work_end", None)
        work_days = validated_data.pop("work_days", None)

        # Update Veterinario fields (nombre)
        instance = super().update(instance, validated_data)

        # Persist telefono/email/password on linked user when available
        try:
            user = instance.user
            changed = False
            if email and user:
                user.email = email
                changed = True
            if password and user:
                user.set_password(password)
                changed = True
            if telefono is not None and user:
                user.telefono = telefono
                changed = True
            if changed:
                user.save()
        except Exception:
            pass

        # Persist working hours on Veterinario instance when provided
        try:
            if work_start is not None:
                instance.work_start = work_start
            if work_end is not None:
                instance.work_end = work_end
            if work_days is not None:
                instance.work_days = work_days
            instance.save()
        except Exception:
            pass

        return instance


class VeterinarioCreateSerializer(serializers.Serializer):
    """Create a User and link a Veterinario to it. Intended for admin use.

    `username` is optional: when omitted it will be derived from the email local-part
    or from `nombre`. The serializer ensures the generated username is unique.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    nombre = serializers.CharField(max_length=255, required=False, allow_blank=True)
    telefono = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def validate(self, data):
        email = data.get("email")
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Email already taken"})
        return data

    def create(self, validated_data):
        email = validated_data.get("email")
        password = validated_data.get("password")
        nombre = validated_data.get("nombre", None)
        telefono = validated_data.get("telefono", None)

        try:
            user = User.objects.create_user(email=email, password=password)
            if telefono:
                try:
                    user.telefono = telefono
                    user.save()
                except Exception:
                    pass

            default_name = nombre or (email.split("@")[0] if email else "")
            # Ensure default working hours when not provided: 09:00 - 14:00
            try:
                vet = Veterinario.objects.create(user=user, nombre=default_name, work_start=_time(9, 0), work_end=_time(14, 0))
            except Exception:
                # fallback to create without explicit times if DB constraints differ
                vet = Veterinario.objects.create(user=user, nombre=default_name)
            return vet
        except IntegrityError as e:
            raise serializers.ValidationError({"detail": "Integrity error creating user/veterinario", "error": str(e)})
        except Exception as e:
            raise serializers.ValidationError({"detail": "Error creating user/veterinario", "error": str(e)})


class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(required=False, write_only=True)
    telefono = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("email", "password", "telefono")

    def update(self, instance, validated_data):
        # Handle password specially
        password = validated_data.pop("password", None)
        telefono = validated_data.pop("telefono", None)

        instance = super().update(instance, validated_data)

        if password:
            try:
                instance.set_password(password)
            except Exception:
                pass
        if telefono is not None:
            try:
                instance.telefono = telefono
            except Exception:
                pass
        instance.save()
        return instance


class MascotaSerializer(serializers.ModelSerializer):
    dueno_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Mascota
        fields = (
            "idMascota",
            "nombre",
            "especie",
            "raza",
            "edad",
            "dueno",
            "dueno_nombre",
        )

    def get_dueno_nombre(self, obj):
        try:
            if obj.dueno:
                return getattr(obj.dueno, "nombre", None)
        except Exception:
            pass
        return None

    # Annotate schema type for spectacular
    from drf_spectacular.types import OpenApiTypes
    from drf_spectacular.utils import extend_schema_field
    get_dueno_nombre = extend_schema_field(OpenApiTypes.STR)(get_dueno_nombre)


class ConsultaSerializer(serializers.ModelSerializer):
    # expose nested mascota for read, accept mascota id for write
    mascota = MascotaSerializer(read_only=True)
    mascota_id = serializers.PrimaryKeyRelatedField(
        queryset=Mascota.objects.all(), source="mascota", write_only=True, required=False
    )
    hora = serializers.TimeField(required=False, allow_null=True)
    # clinical fields
    sintomas = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    asistio = serializers.BooleanField(required=False, allow_null=True, default=None)
    tratamiento = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Consulta
        fields = (
            "idConsulta",
            "motivo",
            "descripcion",
            "fecha",
            "hora",
            "sintomas",
            "asistio",
            "tratamiento",
            "veterinario",
            "mascota",
            "mascota_id",
        )

    def create(self, validated_data):
        # Ensure `fecha` is set (existing code used auto_now_add=True previously)
        if not validated_data.get("fecha"):
            validated_data["fecha"] = date.today()
        return super().create(validated_data)


# Cita model is deprecated in favor of Consulta (appointments and consultations unified).
# Keep CitaSerializer for compatibility but prefer ConsultaSerializer in new APIs.
# Cita model removed; keep no CitaSerializer.


class ComprobanteSerializer(serializers.ModelSerializer):
    # Comprobante removed — placeholder removed
    pass


class MeSummarySerializer(serializers.Serializer):
    role = serializers.CharField()
    # dueno can be null when not applicable
    dueno = DuenoSerializer(allow_null=True)
    mascotas = MascotaSerializer(many=True)
    # 'citas' is now represented by Consulta records (appointments/consultas unified)
    citas = ConsultaSerializer(many=True)
    # Optional when staff requests a specific dueno
    requested_for = serializers.CharField(required=False)
    # Generic profile field for recepcionista/veterinario responses
    profile = serializers.DictField(required=False)
