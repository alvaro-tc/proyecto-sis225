from rest_framework import viewsets, mixins, status, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


class ActiveSessionSerializer(serializers.Serializer):
    """Minimal serializer used by ActiveSessionViewSet (for documentation)."""
    token = serializers.CharField(read_only=True, required=False)



class ActiveSessionViewSet(viewsets.GenericViewSet, mixins.CreateModelMixin):
    http_method_names = ["post"]
    permission_classes = (IsAuthenticated,)
    serializer_class = ActiveSessionSerializer

    def create(self, request, *args, **kwargs):
        return Response({"success": True}, status.HTTP_200_OK)
