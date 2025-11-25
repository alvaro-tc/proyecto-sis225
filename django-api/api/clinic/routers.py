from rest_framework import routers
from .viewsets import (
    DuenoViewSet,
    RecepcionistaViewSet,
    MascotaViewSet,
    ConsultaViewSet,
    VeterinarioViewSet,
    ProfileViewSet,
)

router = routers.SimpleRouter(trailing_slash=False)

router.register(r"duenos", DuenoViewSet, basename="dueno")
router.register(r"recepcionistas", RecepcionistaViewSet, basename="recepcionista")
router.register(r"mascotas", MascotaViewSet, basename="mascota")
router.register(r"consultas", ConsultaViewSet, basename="consulta")
router.register(r"veterinarios", VeterinarioViewSet, basename="veterinario")
router.register(r"profile", ProfileViewSet, basename="profile")

urlpatterns = [*router.urls]
