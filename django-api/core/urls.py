from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from .views import redoc_custom_view

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/users/", include(("api.routers", "api"), namespace="api")),
    path("api/clinic/", include(("api.clinic.routers", "api_clinic"), namespace="clinic")),
    # OpenAPI / Swagger / Redoc
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/schema/redoc/", redoc_custom_view, name="redoc"),
    # Friendly docs URL for Redoc (custom)
    path("docs/", redoc_custom_view, name="redoc-ui"),
    # root redirects to docs
    path("", lambda request: redirect("redoc-ui")),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
