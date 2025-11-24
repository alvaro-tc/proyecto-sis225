"""Add telefono field to User model.

This migration adds a nullable `telefono` CharField to the custom User model.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api_user", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="telefono",
            field=models.CharField(max_length=50, null=True, blank=True),
        ),
    ]
