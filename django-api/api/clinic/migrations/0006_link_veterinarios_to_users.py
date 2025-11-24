"""Data migration: link existing Veterinario rows to User rows.

This migration attempts to find a User whose `username` matches the
`Veterinario.nombre` (case-insensitive). If found, it sets the
`veterinario.user` OneToOne field to that user. If no match is found,
the `user` field is left NULL.

The reverse operation is a noop (we don't unset any previously set values).
"""
from django.db import migrations


def forwards(apps, schema_editor):
    Veterinario = apps.get_model("api_clinic", "Veterinario")
    # AUTH_USER_MODEL is `api_user.User` in settings; use apps.get_model directly
    try:
        User = apps.get_model("api_user", "User")
    except LookupError:
        # If the user model isn't available in this migration state, abort gracefully
        return

    for vet in Veterinario.objects.filter(user__isnull=True):
        nombre = (vet.nombre or "").strip()
        if not nombre:
            continue

        # Try to resolve a matching User.
        # Newer projects may not have a `username` field; attempt several heuristics
        user = None
        try:
            # Try username field if present
            user = User.objects.filter(username__iexact=nombre).first()
        except Exception:
            user = None

        if not user:
            # Try exact email match
            try:
                user = User.objects.filter(email__iexact=nombre).first()
            except Exception:
                user = None

        if not user and "@" in nombre:
            # Try local-part matches against username or email
            local = nombre.split("@")[0]
            try:
                user = User.objects.filter(email__istartswith=local).first()
            except Exception:
                user = None
            if not user:
                try:
                    user = User.objects.filter(username__iexact=local).first()
                except Exception:
                    user = None

        if user:
            vet.user_id = user.id
            vet.save(update_fields=["user_id"])  # set FK directly


def reverse(apps, schema_editor):
    # No-op: keep links if the migration is rolled back
    return


class Migration(migrations.Migration):

    dependencies = [
        ("api_clinic", "0005_add_veterinario_user"),
    ]

    operations = [
        migrations.RunPython(forwards, reverse_code=migrations.RunPython.noop),
    ]
