# Migration to add mascota FK to Consulta
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api_clinic", "0007_add_telefono_recepcionista"),
    ]

    operations = [
        migrations.AddField(
            model_name="consulta",
            name="mascota",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='consultas', to='api_clinic.mascota'),
        ),
    ]
