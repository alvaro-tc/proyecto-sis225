from rest_framework import viewsets, mixins, status, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema


class ActiveSessionSerializer(serializers.Serializer):
    """Minimal serializer used by ActiveSessionViewSet (for documentation)."""
    token = serializers.CharField(read_only=True, required=False)



@extend_schema(tags=["Auth"], summary="Verificar sesión activa")
class ActiveSessionViewSet(viewsets.GenericViewSet, mixins.CreateModelMixin):
    http_method_names = ["post"]
    permission_classes = (IsAuthenticated,)
    serializer_class = ActiveSessionSerializer

    def create(self, request, *args, **kwargs):
        return Response({"success": True}, status.HTTP_200_OK)
