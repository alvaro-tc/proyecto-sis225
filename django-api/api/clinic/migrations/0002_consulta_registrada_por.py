# Generated manually to bypass environment issues
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('api_clinic', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='consulta',
            name='registrada_por',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='consultas_registradas', to='api_clinic.recepcionista'),
        ),
    ]
