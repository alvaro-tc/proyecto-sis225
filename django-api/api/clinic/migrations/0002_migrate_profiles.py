from django.db import migrations, models
import django.db.models.deletion


def create_users_for_profiles(apps, schema_editor):
    # Get historical models
    Dueno = apps.get_model("api_clinic", "Dueno")
    Recepcionista = apps.get_model("api_clinic", "Recepcionista")
    # AUTH_USER_MODEL is 'api_user.User'
    User = apps.get_model("api_user", "User")

    def unique_username(base):
        uname = base
        i = 0
        while User.objects.filter(username=uname).exists():
            i += 1
            uname = f"{base}{i}"
        return uname

    # Migrate recepcionistas: create a User for each recepcionista that lacks one
    if hasattr(Recepcionista, "_meta"):
        for r in Recepcionista.objects.all():
            # If the field 'user_id' already exists and is not null, skip
            if getattr(r, 'user_id', None):
                continue
            # Try to get a name field
            nombre = getattr(r, 'nombre', None)
            base = (nombre or "recep").strip().replace(' ', '_')[:150]
            uname = unique_username(base)
            # Create User instance without relying on manager.create_user
            user = User(username=uname, email="")
            # Set unusable password (migration-created users cannot log in until password is set)
            try:
                user.set_unusable_password()
            except Exception:
                pass
            user.is_staff = True
            user.save()
            r.user_id = user.pk
            r.save()

    # Migrate duenos: create a User for each dueno that lacks one
    for d in Dueno.objects.all():
        if getattr(d, 'user_id', None):
            continue
        correo = getattr(d, 'correo', None)
        nombre = getattr(d, 'nombre', None)
        if correo:
            local = correo.split('@')[0]
            base = local.strip().replace(' ', '_')[:150]
        elif nombre:
            base = nombre.strip().replace(' ', '_')[:150]
        else:
            base = f"user{d.idDueno}"
        uname = unique_username(base)
        email = correo or ''
        # Create User instance directly and set unusable password
        user = User(username=uname, email=email)
        try:
            user.set_unusable_password()
        except Exception:
            pass
        user.save()
        d.user_id = user.pk
        d.save()


def noop_reverse(apps, schema_editor):
    # This migration is not reversible.
    return


class Migration(migrations.Migration):

    dependencies = [
        ("api_clinic", "0001_initial"),
        ("api_user", "0001_initial"),
    ]

    operations = [
        # Add nullable OneToOneFields for user on Recepcionista and Dueno
        migrations.AddField(
            model_name='recepcionista',
            name='user',
            field=models.OneToOneField(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='recepcionista_profile', to='api_user.user'),
        ),
        migrations.AddField(
            model_name='dueno',
            name='user',
            field=models.OneToOneField(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, to='api_user.user'),
        ),
        migrations.RunPython(create_users_for_profiles, reverse_code=noop_reverse),
        # Remove old fields used to hold name/email (we migrated their data to User)
        migrations.RemoveField(
            model_name='dueno',
            name='nombre',
        ),
        migrations.RemoveField(
            model_name='dueno',
            name='correo',
        ),
        migrations.RemoveField(
            model_name='recepcionista',
            name='nombre',
        ),
    ]
