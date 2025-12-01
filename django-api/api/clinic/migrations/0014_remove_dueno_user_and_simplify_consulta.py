from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api_clinic", "0013_auto_20251125_1626"),
    ]

    operations = [
        # Remove the OneToOneField linking Dueno to User
        migrations.RemoveField(
            model_name="dueno",
            name="user",
        ),
        # Simplify Consulta: remove fields that are no longer used
        migrations.RemoveField(
            model_name="consulta",
            name="diagnostico",
        ),
        migrations.RemoveField(
            model_name="consulta",
            name="notas",
        ),
        migrations.RemoveField(
            model_name="consulta",
            name="asistio",
        ),
        migrations.RemoveField(
            model_name="consulta",
            name="dueno",
        ),
    ]
