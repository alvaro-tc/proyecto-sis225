"""Add telefono to Recepcionista model.

Adds a nullable `telefono` CharField to the Recepcionista model.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api_clinic", "0006_link_veterinarios_to_users"),
    ]

    operations = [
        migrations.AddField(
            model_name="recepcionista",
            name="telefono",
            field=models.CharField(max_length=50, null=True, blank=True),
        ),
    ]
