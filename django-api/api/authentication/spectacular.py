from drf_spectacular.extensions import OpenApiAuthenticationExtension


class ActiveSessionAuthenticationScheme(OpenApiAuthenticationExtension):
    """Map ActiveSessionAuthentication to a standard HTTP Bearer auth scheme

    drf-spectacular will use this to generate a components/securitySchemes entry
    and avoid warnings about unresolved authenticators.
    """

    target_class = 'api.authentication.backends.ActiveSessionAuthentication'
    name = 'ActiveSessionAuth'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
        }
