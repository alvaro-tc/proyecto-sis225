from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api_clinic", "0011_remove_historial_and_update_consulta"),
    ]

    operations = [
        migrations.DeleteModel(
            name="Comprobante",
        ),
    ]
