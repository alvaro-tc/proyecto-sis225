from django.shortcuts import render
from django.urls import reverse


def redoc_custom_view(request):
    """Render a custom Redoc page that loads the project's OpenAPI schema."""
    schema_url = reverse("schema")
    return render(request, "redoc_custom.html", {"schema_url": schema_url})
