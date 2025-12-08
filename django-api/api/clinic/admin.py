from django.contrib import admin
from .models import (
    Dueno,
    Recepcionista,
    Mascota,
    Consulta,
    Veterinario,
)


@admin.register(Dueno)
class DuenoAdmin(admin.ModelAdmin):
    list_display = ("idDueno", "nombre", "telefono")
    search_fields = ("nombre",)


@admin.register(Recepcionista)
class RecepcionistaAdmin(admin.ModelAdmin):
    list_display = ("idRecepcionista", "user", "nombre", "telefono")
    search_fields = ("user__email",)


@admin.register(Veterinario)
class VeterinarioAdmin(admin.ModelAdmin):
    list_display = ("idVeterinario", "user", "nombre")


@admin.register(Mascota)
class MascotaAdmin(admin.ModelAdmin):
    list_display = ("idMascota", "nombre", "especie", "raza", "edad", "dueno")
    search_fields = ("nombre", "especie", "raza")


@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    list_display = ("idConsulta", "motivo", "veterinario", "fecha")
    search_fields = ("motivo", "descripcion")


# Cita model removed; no admin registration


# Comprobante removed from the data model; no admin registration
