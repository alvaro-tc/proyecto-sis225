from api.user.serializers import UserSerializer
from api.user.models import User
from rest_framework import viewsets, status, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework import mixins
from rest_framework.decorators import api_view, permission_classes
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiExample
from drf_spectacular.utils import OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from api.user.serializers import UserSerializer
from api.clinic.serializers import (
    DuenoUpdateSerializer,
    RecepcionistaUpdateSerializer,
    VeterinarioUpdateSerializer,
)


# Serializer used to document the current_user endpoint
class CurrentUserSerializer(serializers.Serializer):
    role = serializers.CharField()
    id = serializers.IntegerField()
    email = serializers.EmailField(allow_null=True)
    nombre = serializers.CharField(allow_null=True, required=False)
    telefono = serializers.CharField(allow_null=True, required=False)
    profile_id = serializers.IntegerField(allow_null=True, required=False)
    # Veterinario schedule fields
    work_start = serializers.TimeField(allow_null=True, required=False)
    work_end = serializers.TimeField(allow_null=True, required=False)
    work_days = serializers.CharField(allow_null=True, required=False)



@extend_schema(
    tags=["Usuarios"],
    summary="Obtener y actualizar usuario autenticado (sin id)",
    examples=[
        OpenApiExample(
            'Actualizar perfil ejemplo',
            value={"email": "nuevo@correo.com", "nombre": "Juan Perez", "telefono": "+56912345678"},
            request_only=True,
        )
    ],
    responses=CurrentUserSerializer,
    request=CurrentUserSerializer,
)
@api_view(["GET", "PUT", "PATCH"])  # return and update the authenticated user
@permission_classes([IsAuthenticated])
def current_user(request):
    """Return the authenticated user's data (no id required)."""
    user = request.user

    # determine role (Note: owners are not users in the current design)
    role = None
    if hasattr(user, "recepcionista_profile") and user.recepcionista_profile is not None:
        role = "recepcionista"
    elif hasattr(user, "veterinario_profile") and user.veterinario_profile is not None:
        role = "veterinario"
    elif user.is_superuser:
        role = "admin"
    else:
        role = "user"

    payload = {
        "role": role,
        "id": user.id,
        "email": user.email,
        "nombre": None,
        "telefono": getattr(user, "telefono", None),
        "profile_id": None,
        "work_start": None,
        "work_end": None,
        "work_days": None,
    }

    # enrich with profile fields for staff roles; owners are represented by Dueno objects
    try:
        if role == "recepcionista":
            rec = user.recepcionista_profile
            payload["nombre"] = rec.nombre or (user.email.split("@")[0] if getattr(user, "email", None) else "")
            payload["telefono"] = rec.telefono or getattr(user, "telefono", None)
            payload["profile_id"] = getattr(rec, "idRecepcionista", None) or getattr(rec, "pk", None)
        elif role == "veterinario":
            vet = user.veterinario_profile
            payload["nombre"] = vet.nombre or (user.email.split("@")[0] if getattr(user, "email", None) else "")
            payload["telefono"] = getattr(user, "telefono", None)
            payload["profile_id"] = getattr(vet, "idVeterinario", None) or getattr(vet, "pk", None)
            try:
                # include veterinarian working hours in the /me response
                if getattr(vet, "work_start", None) is not None:
                    payload["work_start"] = vet.work_start.isoformat()
                if getattr(vet, "work_end", None) is not None:
                    payload["work_end"] = vet.work_end.isoformat()
                payload["work_days"] = getattr(vet, "work_days", None)
            except Exception:
                pass
        elif role == "admin":
            payload["telefono"] = getattr(user, "telefono", None)
    except Exception:
        pass

    # Handle updates (PUT/PATCH)
    if request.method in ("PUT", "PATCH"):
        # Treat both PUT and PATCH as partial updates so clients can send only
        # the fields they want to change (PUT behaves like PATCH here).
        partial = True

        # First update base User fields if provided
        user_serializer = UserSerializer(user, data=request.data, partial=partial)
        user_serializer.is_valid(raise_exception=True)
        user_serializer.save()
        # Reload user from DB to pick up changes (email/password/telefono)
        try:
            user.refresh_from_db()
        except Exception:
            pass

        # Then update role-specific profile fields if present (staff roles only)
        if role == "recepcionista" and hasattr(user, "recepcionista_profile"):
            rec = user.recepcionista_profile
            profile_serializer = RecepcionistaUpdateSerializer(rec, data=request.data, partial=partial)
            profile_serializer.is_valid(raise_exception=True)
            profile_serializer.save()
            payload["nombre"] = rec.nombre or (user.email.split("@")[0] if getattr(user, "email", None) else "")
            payload["telefono"] = rec.telefono

        if role == "veterinario" and hasattr(user, "veterinario_profile"):
            vet = user.veterinario_profile
            profile_serializer = VeterinarioUpdateSerializer(vet, data=request.data, partial=partial)
            profile_serializer.is_valid(raise_exception=True)
            profile_serializer.save()
            payload["nombre"] = vet.nombre or (user.email.split("@")[0] if getattr(user, "email", None) else "")
            # Refresh schedule fields from saved profile
            try:
                if getattr(vet, "work_start", None) is not None:
                    payload["work_start"] = vet.work_start.isoformat()
                if getattr(vet, "work_end", None) is not None:
                    payload["work_end"] = vet.work_end.isoformat()
                payload["work_days"] = getattr(vet, "work_days", None)
            except Exception:
                pass

        # Refresh email/telefono from saved user
        payload["email"] = user.email
        payload["telefono"] = getattr(user, "telefono", payload.get("telefono"))

        # Ensure profile_id / nombre reflect updated profile after save (staff roles)
        try:
            if role == "recepcionista" and hasattr(user, "recepcionista_profile") and user.recepcionista_profile:
                rec = user.recepcionista_profile
                payload["nombre"] = rec.nombre or payload.get("nombre")
                payload["telefono"] = rec.telefono or payload.get("telefono")
                payload["profile_id"] = getattr(rec, "idRecepcionista", None) or getattr(rec, "pk", None)
            if role == "veterinario" and hasattr(user, "veterinario_profile") and user.veterinario_profile:
                vet = user.veterinario_profile
                payload["nombre"] = vet.nombre or payload.get("nombre")
                payload["profile_id"] = getattr(vet, "idVeterinario", None) or getattr(vet, "pk", None)
                payload["telefono"] = getattr(user, "telefono", payload.get("telefono"))
        except Exception:
            pass

        return Response(payload)

    return Response(payload)


# (CurrentUserSerializer defined above)


@extend_schema_view(
    create=extend_schema(tags=["Usuarios"], summary="Crear usuario (admin)"),
    update=extend_schema(tags=["Usuarios"], summary="Actualizar usuario"),
)
@extend_schema(parameters=[OpenApiParameter(name="id", location=OpenApiParameter.PATH, required=True, type=OpenApiTypes.INT)])
class UserViewSet(
    viewsets.GenericViewSet, mixins.CreateModelMixin, mixins.UpdateModelMixin
):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    error_message = {"success": False, "msg": "Error updating user"}

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = User.objects.get(id=request.data.get("userID"))
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        user_id = request.data.get("userID")

        if not user_id:
            raise ValidationError(self.error_message)

        if self.request.user.pk != int(user_id) and not self.request.user.is_superuser:
            raise ValidationError(self.error_message)

        self.update(request)

        return Response({"success": True}, status.HTTP_200_OK)
