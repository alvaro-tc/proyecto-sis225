from rest_framework import viewsets, mixins, serializers
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from api.authentication.models import ActiveSession
from drf_spectacular.utils import extend_schema


class LogoutSerializer(serializers.Serializer):
    """Minimal serializer for logout view documentation."""
    success = serializers.BooleanField(read_only=True)
    msg = serializers.CharField(read_only=True)


@extend_schema(tags=["Auth"], summary="Cerrar sesión")
class LogoutViewSet(viewsets.GenericViewSet, mixins.CreateModelMixin):
    permission_classes = (IsAuthenticated,)
    serializer_class = LogoutSerializer

    def create(self, request, *args, **kwargs):
        user = request.user

        session = ActiveSession.objects.get(user=user)
        session.delete()

        return Response(
            {"success": True, "msg": "Token revoked"}, status=status.HTTP_200_OK
        )
