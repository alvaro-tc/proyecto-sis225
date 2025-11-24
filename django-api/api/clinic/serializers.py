from rest_framework import serializers
from .models import (
    Dueno,
    Recepcionista,
    Mascota,
    Historial,
    Consulta,
    Veterinario,
    Comprobante,
)
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from datetime import date

User = get_user_model()


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email")


class DuenoSerializer(serializers.ModelSerializer):
    # include nested user info for convenience in frontend
    user = UserNestedSerializer(read_only=True)

    class Meta:
        model = Dueno
        fields = ("idDueno", "user", "nombre", "telefono", "registrado_por_recepcionista")


class DuenoCreateSerializer(serializers.Serializer):
    # fields to create user+dueno together (username removed; derived from email/nombre)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    telefono = serializers.CharField(max_length=50, required=False, allow_null=True, allow_blank=True)
    nombre = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)
    registrado_por_recepcionista = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, data):
        # ensure email not taken
        email = data.get("email")
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Email already taken"})
        return data

    def create(self, validated_data):
        email = validated_data.get("email")
        password = validated_data.get("password")
        telefono = validated_data.get("telefono", None)
        nombre = validated_data.get("nombre", None)
        recep_id = validated_data.get("registrado_por_recepcionista", None)

        # create user using email as identifier and create Dueno profile
        user = User.objects.create_user(email=email, password=password)
        default_name = nombre or (email.split("@")[0] if email else "")
        dueno = Dueno.objects.create(user=user, telefono=telefono, nombre=default_name)

        if recep_id:
            try:
                recep = Recepcionista.objects.get(idRecepcionista=recep_id)
                dueno.registrado_por_recepcionista = recep
                dueno.save()
            except Recepcionista.DoesNotExist:
                pass

        return dueno


class DuenoSelfRegisterSerializer(serializers.Serializer):
    # minimal fields for a dueno to self-register
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    telefono = serializers.CharField(max_length=50, required=False, allow_null=True, allow_blank=True)
    nombre = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)

    def validate(self, data):
        email = data.get("email")
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Email already taken"})
        return data

    def create(self, validated_data):
        email = validated_data.get("email")
        password = validated_data.get("password")
        telefono = validated_data.get("telefono", None)
        nombre = validated_data.get("nombre", None)
        user = User.objects.create_user(email=email, password=password)
        default_name = nombre or (email.split("@")[0] if email else "")
        dueno = Dueno.objects.create(user=user, telefono=telefono, nombre=default_name)
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


class VeterinarioSerializer(serializers.ModelSerializer):
    user = UserNestedSerializer(read_only=True)
    telefono = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Veterinario
        # include telefono derived from linked user for GET responses
        fields = ("idVeterinario", "user", "nombre", "telefono")

    def get_telefono(self, obj):
        try:
            if obj.user and getattr(obj.user, "telefono", None):
                return obj.user.telefono
        except Exception:
            pass
        return None


class DuenoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dueno
        fields = ("nombre", "telefono")


class RecepcionistaUpdateSerializer(serializers.ModelSerializer):
    # allow updating profile fields plus email/password on the linked User
    email = serializers.EmailField(required=False, write_only=True)
    password = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = Recepcionista
        fields = ("nombre", "telefono", "email", "password")

    def update(self, instance, validated_data):
        # Extract user fields
        email = validated_data.pop("email", None)
        password = validated_data.pop("password", None)

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

    class Meta:
        model = Veterinario
        fields = ("nombre", "telefono", "email", "password")

    def update(self, instance, validated_data):
        email = validated_data.pop("email", None)
        password = validated_data.pop("password", None)
        telefono = validated_data.pop("telefono", None)

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
            vet = Veterinario.objects.create(user=user, nombre=default_name)
            return vet
        except IntegrityError as e:
            raise serializers.ValidationError({"detail": "Integrity error creating user/veterinario", "error": str(e)})
        except Exception as e:
            raise serializers.ValidationError({"detail": "Error creating user/veterinario", "error": str(e)})


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("email",)


class MascotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mascota
        fields = "__all__"


class HistorialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Historial
        fields = "__all__"


class ConsultaSerializer(serializers.ModelSerializer):
    # expose nested mascota for read, accept mascota id for write
    mascota = MascotaSerializer(read_only=True)
    mascota_id = serializers.PrimaryKeyRelatedField(
        queryset=Mascota.objects.all(), source="mascota", write_only=True, required=False
    )
    # accept dueno id for appointment-type records
    dueno = serializers.PrimaryKeyRelatedField(queryset=Dueno.objects.all(), required=False, allow_null=True)
    hora = serializers.TimeField(required=False, allow_null=True)

    class Meta:
        model = Consulta
        fields = (
            "idConsulta",
            "motivo",
            "descripcion",
            "fecha",
            "hora",
            "historial",
            "veterinario",
            "dueno",
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
    class Meta:
        model = Comprobante
        fields = "__all__"


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
