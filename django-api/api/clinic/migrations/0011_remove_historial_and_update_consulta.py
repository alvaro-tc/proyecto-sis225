from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api_clinic", "0010_remove_cita"),
    ]

    operations = [
        # Remove ForeignKey to Historial from Consulta
        migrations.RemoveField(
            model_name="consulta",
            name="historial",
        ),
        # Delete the Historial model/table
        migrations.DeleteModel(
            name="Historial",
        ),
        # Add clinical fields to Consulta
        migrations.AddField(
            model_name="consulta",
            name="sintomas",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="consulta",
            name="diagnostico",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="consulta",
            name="tratamiento",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="consulta",
            name="notas",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="consulta",
            name="asistio",
            field=models.BooleanField(default=False),
        ),
        # Add veterinarian work fields
        migrations.AddField(
            model_name="veterinario",
            name="work_start",
            field=models.TimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="veterinario",
            name="work_end",
            field=models.TimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="veterinario",
            name="work_days",
            field=models.CharField(max_length=100, null=True, blank=True),
        ),
    ]
