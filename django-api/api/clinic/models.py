from django.db import models
from django.conf import settings


class Recepcionista(models.Model):
    idRecepcionista = models.AutoField(primary_key=True)
    # vinculado a un usuario que puede autenticarse
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recepcionista_profile",
    )
    nombre = models.CharField(max_length=255, blank=True, null=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"Recepcionista: {self.user.email}"


class Dueno(models.Model):
    idDueno = models.AutoField(primary_key=True)
    # Cada dueño es también un usuario (puede loguearse)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="dueno_profile",
        null=True,
        blank=True,
    )
    nombre = models.CharField(max_length=255, blank=True, null=True)
    telefono = models.CharField(max_length=50, blank=True, null=True)
    # Si este campo es NULL, se asume que el dueño se registró a sí mismo
    registrado_por_recepcionista = models.ForeignKey(
        "api_clinic.Recepcionista",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="duenos_registrados",
    )

    def __str__(self):
        return f"{self.user.email}"


class Veterinario(models.Model):
    idVeterinario = models.AutoField(primary_key=True)
    # Optionally link a Veterinario to a User so vets can authenticate and edit their profile
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="veterinario_profile",
        null=True,
        blank=True,
    )
    nombre = models.CharField(max_length=255)

    def __str__(self):
        return self.nombre


class Mascota(models.Model):
    idMascota = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    especie = models.CharField(max_length=100)
    raza = models.CharField(max_length=100, blank=True, null=True)
    edad = models.PositiveIntegerField(blank=True, null=True)
    dueno = models.ForeignKey(
        "api_clinic.Dueno", on_delete=models.CASCADE, related_name="mascotas"
    )
    # Si este campo es NULL, se asume que la mascota fue registrada por su dueño
    registrada_por_recepcionista = models.ForeignKey(
        "api_clinic.Recepcionista",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="mascotas_registradas",
    )

    def __str__(self):
        return f"{self.nombre} ({self.especie})"


class Historial(models.Model):
    idHistorial = models.AutoField(primary_key=True)
    mascota = models.OneToOneField(
        "api_clinic.Mascota", on_delete=models.CASCADE, related_name="historial"
    )

    def __str__(self):
        return f"Historial de {self.mascota.nombre}"


class Consulta(models.Model):
    idConsulta = models.AutoField(primary_key=True)
    motivo = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    # Make fecha editable so a Consulta can represent either an appointment or a clinical
    # consultation. Do not auto-populate — migrations will handle existing rows.
    fecha = models.DateField()
    historial = models.ForeignKey(
        "api_clinic.Historial", on_delete=models.CASCADE, related_name="consultas"
    )
    veterinario = models.ForeignKey(
        "api_clinic.Veterinario",
        on_delete=models.PROTECT,
        related_name="consultas",
    )
    # Link consulta directly to a Mascota for easy querying per-user
    mascota = models.ForeignKey(
        "api_clinic.Mascota",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="consultas",
    )
    # Optional: when a record represents an appointment it may reference the dueno
    dueno = models.ForeignKey(
        "api_clinic.Dueno",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="consultas",
    )
    # Optional time for appointments
    hora = models.TimeField(null=True, blank=True)

    def __str__(self):
        return f"Consulta {self.idConsulta} - {self.motivo}"


# Cita model removed: appointments are now represented by Consulta.


class Comprobante(models.Model):
    idCom = models.AutoField(primary_key=True)
    # now link comprobantes to Consulta records (appointments/consultas unified)
    cita = models.OneToOneField(
        "api_clinic.Consulta",
        on_delete=models.CASCADE,
        related_name="comprobante",
    )
    dueno = models.ForeignKey(
        "api_clinic.Dueno", on_delete=models.CASCADE, related_name="comprobantes"
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # referencia la consulta asociada (antes era Cita)
        try:
            return f"Comprobante {self.idCom} - Consulta {self.cita.idConsulta}"
        except Exception:
            return f"Comprobante {self.idCom} - Consulta {getattr(self.cita, 'pk', None)}"
