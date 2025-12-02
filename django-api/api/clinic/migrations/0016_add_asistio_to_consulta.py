from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api_clinic", "0015_delete_comprobante"),
    ]

    operations = [
        migrations.AddField(
            model_name="consulta",
            name="asistio",
            field=models.BooleanField(null=True, blank=True),
        ),
    ]
