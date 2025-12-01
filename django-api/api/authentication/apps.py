from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api.authentication"
    label = "api_authentication"

    def ready(self):
        # Ensure spectacular extension is imported so it registers the auth mapping
        try:
            from . import spectacular  # noqa: F401
        except Exception:
            # Avoid crashing app startup if spectacular isn't available in some envs
            pass
