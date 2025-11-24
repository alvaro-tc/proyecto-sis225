from api.user.serializers import UserSerializer
from api.user.models import User
from rest_framework import viewsets, status
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
)
@api_view(["GET", "PUT", "PATCH"])  # return and update the authenticated user
@permission_classes([IsAuthenticated])
def current_user(request):
    """Return the authenticated user's data (no id required)."""
    user = request.user

    # determine role
    role = None
    if hasattr(user, "dueno_profile") and user.dueno_profile is not None:
        role = "dueno"
    elif hasattr(user, "recepcionista_profile") and user.recepcionista_profile is not None:
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
    }

    # enrich with profile fields
    try:
        if role == "dueno":
            du = user.dueno_profile
            payload["nombre"] = du.nombre or (user.email.split("@")[0] if getattr(user, "email", None) else "")
            payload["telefono"] = du.telefono
        elif role == "recepcionista":
            rec = user.recepcionista_profile
            payload["nombre"] = rec.nombre or (user.email.split("@")[0] if getattr(user, "email", None) else "")
            payload["telefono"] = rec.telefono
        elif role == "veterinario":
            vet = user.veterinario_profile
            payload["nombre"] = vet.nombre or (user.email.split("@")[0] if getattr(user, "email", None) else "")
        elif role == "admin":
            # admin: no extra profile fields; keep email
            payload["telefono"] = getattr(user, "telefono", None)
    except Exception:
        # If any profile access fails, return basic payload
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

        # Then update role-specific profile fields if present
        if role == "dueno" and hasattr(user, "dueno_profile"):
            du = user.dueno_profile
            profile_serializer = DuenoUpdateSerializer(du, data=request.data, partial=partial)
            profile_serializer.is_valid(raise_exception=True)
            profile_serializer.save()
            payload["nombre"] = du.nombre or (user.email.split("@")[0] if getattr(user, "email", None) else "")
            payload["telefono"] = du.telefono

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

        # Refresh email/telefono from saved user
        payload["email"] = user.email
        payload["telefono"] = getattr(user, "telefono", payload.get("telefono"))

        return Response(payload)

    return Response(payload)


@extend_schema_view(
    create=extend_schema(tags=["Usuarios"], summary="Crear usuario (admin)"),
    update=extend_schema(tags=["Usuarios"], summary="Actualizar usuario"),
)
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
