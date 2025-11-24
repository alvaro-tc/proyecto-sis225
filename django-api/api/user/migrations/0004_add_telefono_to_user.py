# Migration added to ensure telefono field exists and depends on latest migration
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api_user", "0003_alter_user_username"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="telefono",
            field=models.CharField(max_length=50, null=True, blank=True),
        ),
    ]
