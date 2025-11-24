from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api_clinic", "0009_auto_20251124_1750"),
    ]

    operations = [
        # Alter Comprobante.cita to point to Consulta
        migrations.AlterField(
            model_name="comprobante",
            name="cita",
            field=models.OneToOneField(related_name="comprobante", to="api_clinic.consulta", on_delete=django.db.models.deletion.CASCADE),
        ),
        # Remove the old Cita model/table
        migrations.DeleteModel(
            name="Cita",
        ),
    ]
