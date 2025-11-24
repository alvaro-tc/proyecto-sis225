from django.contrib import admin
from .models import (
    Dueno,
    Recepcionista,
    Mascota,
    Comprobante,
    Consulta,
    Historial,
    Veterinario,
)


@admin.register(Dueno)
class DuenoAdmin(admin.ModelAdmin):
    list_display = ("idDueno", "user", "nombre", "telefono", "registrado_por_recepcionista")
    search_fields = ("user__email",)


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


@admin.register(Historial)
class HistorialAdmin(admin.ModelAdmin):
    list_display = ("idHistorial", "mascota")


@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    list_display = ("idConsulta", "motivo", "veterinario", "fecha")
    search_fields = ("motivo", "descripcion")


# Cita model removed; no admin registration


@admin.register(Comprobante)
class ComprobanteAdmin(admin.ModelAdmin):
    list_display = ("idCom", "cita", "dueno", "creado_en")
