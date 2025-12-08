from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from datetime import date, datetime
from django.db.models import Q
from .models import (
    Dueno,
    Recepcionista,
    Mascota,
    Consulta,
    Veterinario,
)
from .serializers import (
    DuenoSerializer,
    DuenoCreateSerializer,
    DuenoSelfRegisterSerializer,
    RecepcionistaSerializer,
    MeSummarySerializer,
    MascotaSerializer,
    ConsultaSerializer,
    VeterinarioSerializer,
    VeterinarioCreateSerializer,
    RecepcionistaCreateSerializer,
)
from rest_framework.response import Response
from rest_framework import serializers


@extend_schema_view(
    list=extend_schema(tags=["Dueños"], summary="Listar dueños"),
    retrieve=extend_schema(tags=["Dueños"], summary="Obtener dueño"),
    create=extend_schema(tags=["Dueños"], summary="Crear dueño"),
    update=extend_schema(tags=["Dueños"], summary="Actualizar dueño"),
    partial_update=extend_schema(tags=["Dueños"], summary="Actualizar parcialmente dueño"),
    destroy=extend_schema(tags=["Dueños"], summary="Eliminar dueño"),
)
class DuenoViewSet(viewsets.ModelViewSet):
    queryset = Dueno.objects.all()
    serializer_class = DuenoSerializer
    permission_classes = (AllowAny,)

    def get_serializer_class(self):
        if self.action == "create":
            # If anonymous user => self-registration serializer
            user = getattr(self.request, "user", None)
            if not user or not user.is_authenticated:
                return DuenoSelfRegisterSerializer
            return DuenoCreateSerializer
        return super().get_serializer_class()

    def create(self, request, *args, **kwargs):
        user = request.user
        # If anonymous -> allow self-registration via DuenoSelfRegisterSerializer
        if not user or not user.is_authenticated:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            dueno = serializer.save()
            out_serializer = DuenoSerializer(dueno, context={"request": request})
            return Response(out_serializer.data, status=201)

        # Authenticated: must be superuser or recepcionista to create via DuenoCreateSerializer
        is_recepcionista = hasattr(user, "recepcionista_profile")
        if not (user.is_superuser or is_recepcionista):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied({"detail": "Only recepcionistas or superusers can create dueños."})

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dueno = serializer.save()
        out_serializer = DuenoSerializer(dueno, context={"request": request})
        return Response({"role": "dueno", "dueno": out_serializer.data}, status=201)

    @extend_schema(tags=["Dueños"], summary="Obtener o actualizar perfil del dueño autenticado")
    @action(detail=False, methods=["get", "put", "patch"], url_path="me", permission_classes=[IsAuthenticated])
    def me(self, request):
        """Return or update the Dueno profile for the authenticated user.

        GET  -> returns the Dueno profile
        PUT/PATCH -> updates the Dueno profile (only `nombre` and `telefono` for owners)
        """
        # Dueno is no longer linked to a User account. This `me` endpoint is not applicable.
        from rest_framework.exceptions import NotAcceptable

        raise NotAcceptable({"detail": "Dueno is not a user account; use owner CRUD endpoints instead."})

    @extend_schema(responses=MeSummarySerializer, tags=["Dueños"], summary="Resumen del dueño autenticado")
    @action(detail=False, methods=["get"], url_path="me/summary", permission_classes=[IsAuthenticated])
    def me_summary(self, request):
        """Return combined data for the authenticated owner: dueno profile, mascotas and 5 recent citas."""
        # Since Dueno objects are no longer linked to User accounts, this endpoint will
        # provide a recepcionista/veterinario/admin oriented summary when applicable.
        user = request.user
        from .serializers import RecepcionistaSerializer, VeterinarioSerializer

        if hasattr(user, "recepcionista_profile") and user.recepcionista_profile is not None:
            profile = RecepcionistaSerializer(user.recepcionista_profile, context={"request": request}).data
            return Response({"role": "recepcionista", "profile": profile, "mascotas": [], "citas": []}, status=200)

        if hasattr(user, "veterinario_profile") and user.veterinario_profile is not None:
            vet = user.veterinario_profile
            vet_data = VeterinarioSerializer(vet, context={"request": request}).data
            return Response({"role": "veterinario", "profile": vet_data, "mascotas": [], "citas": []}, status=200)

        if user.is_superuser:
            return Response({"role": "admin", "profile": {"id": user.id, "email": user.email}}, status=200)

        return Response({"role": "unknown", "profile": {}, "mascotas": [], "citas": []}, status=200)

    @extend_schema(tags=["Dueños"], summary="Citas pasadas atendidas del dueño autenticado")
    @action(detail=False, methods=["get"], url_path="me/past-citas", permission_classes=[IsAuthenticated])
    def me_past_citas(self, request):
        # Dueno is no longer a User. Accept a `dueno_id` query param to fetch past consultas for an owner.
        dueno_id = request.query_params.get("dueno_id")
        if not dueno_id:
            return Response([], status=200)

        today = date.today()
        now_time = datetime.now().time()
        past_q = Q(fecha__lt=today) | (Q(fecha=today) & Q(hora__lt=now_time))
        consultas = Consulta.objects.filter(mascota__dueno_id=dueno_id).filter(past_q).order_by("-fecha", "-hora")
        serializer = ConsultaSerializer(consultas, many=True, context={"request": request})
        return Response(serializer.data, status=200)

    @extend_schema(tags=["Dueños"], summary="Citas futuras no atendidas del dueño autenticado")
    @action(detail=False, methods=["get"], url_path="me/future-citas", permission_classes=[IsAuthenticated])
    def me_future_citas(self, request):
        dueno_id = request.query_params.get("dueno_id")
        if not dueno_id:
            return Response([], status=200)

        today = date.today()
        now_time = datetime.now().time()
        future_q = Q(fecha__gt=today) | (Q(fecha=today) & Q(hora__gte=now_time)) | Q(hora__isnull=True)
        consultas = Consulta.objects.filter(mascota__dueno_id=dueno_id).filter(future_q).order_by("fecha", "hora")
        serializer = ConsultaSerializer(consultas, many=True, context={"request": request})
        return Response(serializer.data, status=200)


@extend_schema_view(
    list=extend_schema(tags=["Recepcionistas"], summary="Listar recepcionistas"),
    retrieve=extend_schema(tags=["Recepcionistas"], summary="Obtener recepcionista"),
    create=extend_schema(tags=["Recepcionistas"], summary="Crear recepcionista (admin)"),
    update=extend_schema(tags=["Recepcionistas"], summary="Actualizar recepcionista"),
    partial_update=extend_schema(tags=["Recepcionistas"], summary="Actualizar parcialmente recepcionista"),
    destroy=extend_schema(tags=["Recepcionistas"], summary="Eliminar recepcionista"),
)
class RecepcionistaViewSet(viewsets.ModelViewSet):
    queryset = Recepcionista.objects.all()
    serializer_class = RecepcionistaSerializer
    # list/retrieve can be open or restricted later; creation must be admin-only
    permission_classes = (IsAuthenticated,)

    def get_serializer_class(self):
        if self.action == "create":
            return RecepcionistaCreateSerializer
        return super().get_serializer_class()

    def create(self, request, *args, **kwargs):
        # Only superusers (admin) can create recepcionistas
        user = request.user
        if not (user and user.is_superuser):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied({"detail": "Only admin users can create recepcionistas."})

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        recep = serializer.save()
        out_serializer = RecepcionistaSerializer(recep, context={"request": request})
        return Response({"role": "recepcionista", "recepcionista": out_serializer.data}, status=201)

    @action(detail=False, methods=["get", "put", "patch"], url_path="me", permission_classes=[IsAuthenticated])
    def me(self, request):
        """Return or update the Recepcionista profile for the authenticated user."""
        user = request.user
        if not hasattr(user, "recepcionista_profile") or user.recepcionista_profile is None:
            return Response({}, status=200)

        recep = user.recepcionista_profile
        if request.method == "GET":
            serializer = RecepcionistaSerializer(recep, context={"request": request})
            return Response(serializer.data, status=200)

        from .serializers import RecepcionistaUpdateSerializer
        partial = request.method == "PATCH"
        serializer = RecepcionistaUpdateSerializer(recep, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        out = RecepcionistaSerializer(recep, context={"request": request})
        return Response(out.data, status=200)

    @extend_schema(tags=["Recepcionistas"], summary="Resumen del recepcionista autenticado")
    @action(detail=False, methods=["get"], url_path="me/summary", permission_classes=[IsAuthenticated])
    def me_summary(self, request):
        """Return a small summary for the authenticated recepcionista: profile, counts and recent mascotas."""
        user = request.user
        if not hasattr(user, "recepcionista_profile") or user.recepcionista_profile is None:
            return Response({}, status=200)

        rec = user.recepcionista_profile
        profile = RecepcionistaSerializer(rec, context={"request": request}).data

        # counts and recent items
        total_duenos = Dueno.objects.filter(registrado_por_recepcionista=rec).count()
        recent_mascotas_qs = Mascota.objects.filter(registrada_por_recepcionista=rec).order_by("-idMascota")[:5]
        recent_mascotas = MascotaSerializer(recent_mascotas_qs, many=True, context={"request": request}).data

        # recent consultas across the clinic (limit 5) to give context to recepcionista
        recent_consultas_qs = Consulta.objects.all().order_by("-fecha", "-hora")[:5]
        recent_consultas = ConsultaSerializer(recent_consultas_qs, many=True, context={"request": request}).data

        return Response(
            {
                "role": "recepcionista",
                "profile": profile,
                "total_duenos_registered": total_duenos,
                "recent_mascotas": recent_mascotas,
                "recent_consultas": recent_consultas,
            },
            status=200,
        )


@extend_schema_view(
    list=extend_schema(tags=["Veterinarios"], summary="Listar veterinarios"),
    retrieve=extend_schema(tags=["Veterinarios"], summary="Obtener veterinario"),
    create=extend_schema(tags=["Veterinarios"], summary="Crear veterinario (admin)"),
    update=extend_schema(tags=["Veterinarios"], summary="Actualizar veterinario"),
    partial_update=extend_schema(tags=["Veterinarios"], summary="Actualizar parcialmente veterinario"),
    destroy=extend_schema(tags=["Veterinarios"], summary="Eliminar veterinario"),
)
class VeterinarioViewSet(viewsets.ModelViewSet):
    queryset = Veterinario.objects.all()
    serializer_class = VeterinarioSerializer
    permission_classes = (AllowAny,)

    def get_serializer_class(self):
        # use a create serializer that also creates a User when creating a Veterinario
        if self.action == "create":
            return VeterinarioCreateSerializer
        return super().get_serializer_class()

    def create(self, request, *args, **kwargs):
        # Only superusers can create veterinarios (and their users)
        user = request.user
        if not (user and user.is_superuser):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied({"detail": "Only admin users can create veterinarios."})

        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            vet = serializer.save()
            out_serializer = VeterinarioSerializer(vet, context={"request": request})
            return Response({"role": "veterinario", "veterinario": out_serializer.data}, status=201)
        except Exception as e:
            # Print traceback to server console for debugging, and return a safe error
            import traceback

            traceback.print_exc()
            return Response({"detail": "Error creating veterinario", "error": str(e)}, status=400)

    @action(detail=False, methods=["get", "put", "patch"], url_path="me", permission_classes=[IsAuthenticated])
    def me(self, request):
        """Return or update the Veterinario profile for the authenticated user.

        Note: Veterinario has an optional OneToOne `user` relation; this endpoint will act on the
        linked Veterinario (if any). If no Veterinario is linked to the user, returns empty.
        """
        user = request.user
        if not hasattr(user, "veterinario_profile") or user.veterinario_profile is None:
            return Response({}, status=200)

        vet = user.veterinario_profile
        if request.method == "GET":
            serializer = VeterinarioSerializer(vet, context={"request": request})
            return Response(serializer.data, status=200)

        from .serializers import VeterinarioUpdateSerializer
        partial = request.method == "PATCH"
        serializer = VeterinarioUpdateSerializer(vet, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        out = VeterinarioSerializer(vet, context={"request": request})
        return Response(out.data, status=200)

    @extend_schema(tags=["Veterinarios"], summary="Resumen del veterinario autenticado")
    @action(detail=False, methods=["get"], url_path="me/summary", permission_classes=[IsAuthenticated])
    def me_summary(self, request):
        """Return a small summary for the authenticated veterinarian: profile, today's consultas and availability."""
        user = request.user
        if not hasattr(user, "veterinario_profile") or user.veterinario_profile is None:
            return Response({}, status=200)

        vet = user.veterinario_profile
        profile = VeterinarioSerializer(vet, context={"request": request}).data

        today = date.today()
        # consultas for today
        today_consultas_qs = Consulta.objects.filter(veterinario=vet, fecha=today).order_by("hora")
        today_consultas = ConsultaSerializer(today_consultas_qs, many=True, context={"request": request}).data

        # upcoming not attended consultas count
        upcoming_count = Consulta.objects.filter(veterinario=vet, fecha__gte=today, asistio=False).count()

        # compute simple availability for today based on work_start/work_end
        available_slots = []
        if vet.work_start and vet.work_end:
            from datetime import datetime as _dt, timedelta as _td

            start_dt = _dt.combine(today, vet.work_start)
            end_dt = _dt.combine(today, vet.work_end)
            cur = start_dt
            while cur < end_dt:
                hora_only = cur.time()
                exists = Consulta.objects.filter(veterinario=vet, fecha=today, hora=hora_only).exists()
                if not exists:
                    available_slots.append(hora_only.strftime("%H:%M"))
                cur = cur + _td(hours=1)

        recent_consultas_qs = Consulta.objects.filter(veterinario=vet).order_by("-fecha", "-hora")[:5]
        recent_consultas = ConsultaSerializer(recent_consultas_qs, many=True, context={"request": request}).data

        return Response(
            {
                "role": "veterinario",
                "profile": profile,
                "today_consultas": today_consultas,
                "upcoming_consultas_count": upcoming_count,
                "available_slots_today": available_slots,
                "recent_consultas": recent_consultas,
            },
            status=200,
        )

    @extend_schema(tags=["Veterinarios"], summary="Obtener veterinarios con disponibilidad para una fecha")
    @action(detail=False, methods=["get"], url_path="with-availability", permission_classes=[AllowAny])
    def with_availability(self, request):
        # Optional query param: fecha=YYYY-MM-DD (default: today)
        fecha_str = request.query_params.get("fecha")
        try:
            fecha = date.fromisoformat(fecha_str) if fecha_str else date.today()
        except Exception:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"fecha": "Invalid date format, expected YYYY-MM-DD"})

        vets = self.queryset.all()
        out = []
        for v in vets:
            item = {"idVeterinario": v.idVeterinario, "nombre": v.nombre, "work_start": v.work_start, "work_end": v.work_end, "work_days": v.work_days}
            slots = []
            if v.work_start and v.work_end:
                # build hourly slots between start and end
                from datetime import datetime as _dt, timedelta as _td

                start_dt = _dt.combine(fecha, v.work_start)
                end_dt = _dt.combine(fecha, v.work_end)
                cur = start_dt
                while cur < end_dt:
                    # Check if a Consulta exists at this fecha+hora for this vet
                    hora_only = cur.time()
                    exists = Consulta.objects.filter(veterinario=v, fecha=fecha, hora=hora_only).exists()
                    if not exists:
                        slots.append(hora_only.strftime("%H:%M"))
                    cur = cur + _td(hours=1)
            item["available_slots"] = slots
            out.append(item)
        return Response(out, status=200)

    @extend_schema(tags=["Veterinarios"], summary="Consultas de un veterinario")
    @action(detail=True, methods=["get"], url_path="consultas", permission_classes=[IsAuthenticated])
    def consultas(self, request, pk=None):
        # Return all consultas for the given veterinarian (read-only).
        # Access restricted to authenticated users (IsAuthenticated).
        # Optional query params: start_date, end_date, mascota_id
        try:
            vet_obj = Veterinario.objects.get(pk=pk)
        except Veterinario.DoesNotExist:
            from rest_framework.exceptions import NotFound

            raise NotFound({"detail": "Veterinario not found"})

        qs = Consulta.objects.filter(veterinario_id=pk)
        start = request.query_params.get("start_date")
        end = request.query_params.get("end_date")
        mascota_id = request.query_params.get("mascota_id")
        if start:
            qs = qs.filter(fecha__gte=start)
        if end:
            qs = qs.filter(fecha__lte=end)
        if mascota_id:
            qs = qs.filter(mascota_id=mascota_id)

        qs = qs.order_by("fecha", "hora")
        page = self.paginate_queryset(qs)
        if page is not None:
            # Use ConsultaSerializer explicitly to serialize Consulta objects
            serializer = ConsultaSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)

        serializer = ConsultaSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data, status=200)


@extend_schema_view(
    list=extend_schema(tags=["Mascotas"], summary="Listar mascotas"),
    retrieve=extend_schema(tags=["Mascotas"], summary="Obtener mascota"),
    create=extend_schema(tags=["Mascotas"], summary="Crear mascota (dueño autenticado)"),
    update=extend_schema(tags=["Mascotas"], summary="Actualizar mascota"),
    partial_update=extend_schema(tags=["Mascotas"], summary="Actualizar parcialmente mascota"),
    destroy=extend_schema(tags=["Mascotas"], summary="Eliminar mascota"),
)
class MascotaViewSet(viewsets.ModelViewSet):
    queryset = Mascota.objects.all()
    serializer_class = MascotaSerializer
    # Allow authenticated users to create mascotas by providing a `dueno` id
    permission_classes = (IsAuthenticated,)
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    def create(self, request, *args, **kwargs):
        # Creating a Mascota requires an explicit `dueno` (owner) id in the payload
        # and must be performed by a recepcionista (or superuser).
        data = request.data.copy()
        if not data.get("dueno"):
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"dueno": "dueno id is required when creating a mascota"})

        user = request.user
        is_recepcionista = hasattr(user, "recepcionista_profile") and user.recepcionista_profile is not None
        if not (is_recepcionista or user.is_superuser):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied({"detail": "Only recepcionistas or admin can create mascotas."})

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        mascota = serializer.save()

        # Record who registered the mascota (recepcionista)
        try:
            if is_recepcionista:
                mascota.registrada_por_recepcionista = user.recepcionista_profile
                mascota.save()
        except Exception:
            pass

        out_serializer = MascotaSerializer(mascota, context={"request": request})
        return Response(out_serializer.data, status=201)

    @action(detail=False, methods=["get"], url_path="user", permission_classes=[IsAuthenticated])
    def user(self, request):
        """Return mascotas for a given owner. Use `?dueno_id=<id>` to fetch an owner's mascotas."""
        user = request.user
        # Dueno objects are not linked to User accounts. Support fetching by `dueno_id` query param.
        dueno_id = request.query_params.get("dueno_id")
        if dueno_id:
            mascotas = self.queryset.filter(dueno_id=dueno_id)
            serializer = self.get_serializer(mascotas, many=True, context={"request": request})
            return Response(serializer.data, status=200)

        # If the requester is staff, return all mascotas as a fallback
        if hasattr(user, "recepcionista_profile") or user.is_superuser:
            mascotas = self.queryset.all()
            serializer = self.get_serializer(mascotas, many=True, context={"request": request})
            return Response(serializer.data, status=200)

        return Response([], status=200)

    @extend_schema(tags=["Mascotas"], summary="Listar mascotas con nombre de dueño")
    @action(detail=False, methods=["get"], url_path="with-dueno", permission_classes=[IsAuthenticated])
    def with_dueno(self, request):
        """Return all mascotas including their owner's `nombre` as `dueno_nombre`."""
        qs = self.queryset.select_related("dueno").all()
        serializer = self.get_serializer(qs, many=True, context={"request": request})
        return Response(serializer.data, status=200)

    def _is_allowed_to_modify(self, user, mascota):
        """Return True if user can modify the given mascota."""
        if user.is_superuser:
            return True
        if hasattr(user, "recepcionista_profile"):
            return True
        # Owners are no longer User accounts; owner-based modification must be performed
        # by staff using the `dueno_id` and the proper endpoints.
        return False

    def update(self, request, *args, **kwargs):
        partial = False
        return self._perform_update(request, partial)

    def partial_update(self, request, *args, **kwargs):
        partial = True
        return self._perform_update(request, partial)

    def _perform_update(self, request, partial):
        instance = self.get_object()
        user = request.user

        if not self._is_allowed_to_modify(user, instance):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied({"detail": "Not allowed to modify this mascota."})

        data = request.data.copy()

        # Ensure dueno remains the same (don't allow owners to reassign by omitting)
        if not data.get("dueno"):
            data["dueno"] = instance.dueno_id

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    @extend_schema(tags=["Mascotas"], summary="Todas las consultas de una mascota")
    @action(detail=True, methods=["get"], url_path="consultas", permission_classes=[IsAuthenticated])
    def consultas(self, request, pk=None):
        """Return all consultas for this mascota, ordered by date and time descending.

        Access restricted to staff (recepcionista), veterinario or admin users.
        Optional query params: start_date, end_date (YYYY-MM-DD format).
        """
        try:
            mascota = Mascota.objects.get(pk=pk)
        except Mascota.DoesNotExist:
            from rest_framework.exceptions import NotFound

            raise NotFound({"detail": "Mascota not found"})

        user = request.user
        if not (hasattr(user, "recepcionista_profile") or hasattr(user, "veterinario_profile") or user.is_superuser):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied({"detail": "Not allowed to view this mascota's consultas"})

        qs = Consulta.objects.filter(mascota=mascota).order_by("-fecha", "-hora")

        # Optional filtering by date range
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        if start_date:
            qs = qs.filter(fecha__gte=start_date)
        if end_date:
            qs = qs.filter(fecha__lte=end_date)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ConsultaSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)

        serializer = ConsultaSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data, status=200)

    @extend_schema(tags=["Mascotas"], summary="Consultas asistidas de una mascota")
    @action(detail=True, methods=["get"], url_path="consultas/asistidas", permission_classes=[IsAuthenticated])
    def consultas_asistidas(self, request, pk=None):
        """Return consultas for this mascota where `asistio` is True (attended visits).

        Access restricted to staff (recepcionista), veterinario or admin users.
        """
        try:
            mascota = Mascota.objects.get(pk=pk)
        except Mascota.DoesNotExist:
            from rest_framework.exceptions import NotFound

            raise NotFound({"detail": "Mascota not found"})

        user = request.user
        if not (hasattr(user, "recepcionista_profile") or hasattr(user, "veterinario_profile") or user.is_superuser):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied({"detail": "Not allowed to view this mascota's attended consultas"})

        qs = Consulta.objects.filter(mascota=mascota, asistio=True).order_by("-fecha", "-hora")

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ConsultaSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)

        serializer = ConsultaSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data, status=200)



@extend_schema_view(
    list=extend_schema(tags=["Consultas"], summary="Listar consultas"),
    retrieve=extend_schema(tags=["Consultas"], summary="Obtener consulta"),
    create=extend_schema(tags=["Consultas"], summary="Crear consulta/cita"),
    update=extend_schema(tags=["Consultas"], summary="Actualizar consulta"),
    partial_update=extend_schema(tags=["Consultas"], summary="Actualizar parcialmente consulta"),
    destroy=extend_schema(tags=["Consultas"], summary="Eliminar consulta"),
)
class ConsultaViewSet(viewsets.ModelViewSet):
    queryset = Consulta.objects.all()
    serializer_class = ConsultaSerializer
    permission_classes = (AllowAny,)

    def list(self, request, *args, **kwargs):
        """Support listing consultas and also retrieving a mascota's historial via ?mascota_id=."""
        mascota_id = request.query_params.get("mascota_id")
        if mascota_id:
            try:
                mascota = Mascota.objects.get(pk=mascota_id)
            except Mascota.DoesNotExist:
                from rest_framework.exceptions import NotFound

                raise NotFound({"detail": "Mascota not found"})

            user = request.user
            # Authorization: since Dueno is no longer a User, only staff and vets/admin are allowed
            if not (hasattr(user, "recepcionista_profile") or hasattr(user, "veterinario_profile") or user.is_superuser):
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied({"detail": "Not allowed to view this mascota's historial"})

            consultas = self.queryset.filter(mascota=mascota).order_by("-fecha", "-hora")
            serializer = self.get_serializer(consultas, many=True, context={"request": request})
            return Response(serializer.data, status=200)

        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        # Accept `mascota` key from frontend (map to mascota_id)
        if data.get("mascota") and not data.get("mascota_id"):
            data["mascota_id"] = data.get("mascota")

        # No Dueno-user association exists anymore; ensure mascota is provided
        if not data.get("mascota_id"):
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"mascota": "mascota_id is required"})

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        out = self.get_serializer(obj, context={"request": request})
        return Response(out.data, status=201)

    def perform_create(self, serializer):
        user = self.request.user
        recepcionista = getattr(user, "recepcionista_profile", None)
        # Even if not a receptionist (e.g. admin), this will be None or handle it safely if logic allows
        serializer.save(registrada_por=recepcionista)

    @action(detail=False, methods=["get"], url_path="user/recent", permission_classes=[IsAuthenticated])
    def user_recent(self, request):
        """Return the 5 most recent consultas for the authenticated owner's mascotas."""
        user = request.user
        # With Dueno not linked to User, require a dueno_id query param or return empty
        dueno_id = request.query_params.get("dueno_id")
        if not dueno_id:
            return Response([], status=200)

        consultas = self.queryset.filter(mascota__dueno_id=dueno_id).order_by("-fecha")[:5]
        serializer = self.get_serializer(consultas, many=True, context={"request": request})
        return Response(serializer.data, status=200)

    


# CitaViewSet removed — Consulta now represents both appointments and clinical consultations.


# Comprobante model and endpoints removed — not used in current design


@extend_schema_view(
    retrieve=extend_schema(tags=["Perfil"], summary="Obtener perfil autenticado"),
    update=extend_schema(tags=["Perfil"], summary="Actualizar perfil autenticado"),
    partial_update=extend_schema(tags=["Perfil"], summary="Actualizar parcialmente perfil autenticado"),
)
@extend_schema(parameters=[OpenApiParameter(name="id", location=OpenApiParameter.PATH, required=True, type=OpenApiTypes.INT)])
class ProfileViewSet(viewsets.ViewSet):
    """Unified profile endpoint. GET/PUT/PATCH on `/profile/me` will return or update
    the profile corresponding to the authenticated user based on role.

    - dueno -> uses DuenoUpdateSerializer
    - recepcionista -> uses RecepcionistaUpdateSerializer
    - veterinario -> uses VeterinarioUpdateSerializer
    - admin (superuser) -> uses UserUpdateSerializer on User model
    """

    permission_classes = (IsAuthenticated,)
    # Provide a fallback serializer so drf-spectacular can inspect the viewset
    class _ProfileFallbackSerializer(serializers.Serializer):
        role = serializers.CharField(read_only=True, required=False)

    serializer_class = _ProfileFallbackSerializer

    def _get_role(self, user):
        # Dueno objects are not linked to User accounts in the current design
        if hasattr(user, "recepcionista_profile") and user.recepcionista_profile is not None:
            return "recepcionista"
        if hasattr(user, "veterinario_profile") and user.veterinario_profile is not None:
            return "veterinario"
        if user.is_superuser:
            return "admin"
        return "unknown"

    def retrieve(self, request):
        """GET /profile/me"""
        user = request.user
        role = self._get_role(user)
        if role == "recepcionista":
            return Response(RecepcionistaSerializer(user.recepcionista_profile, context={"request": request}).data)
        if role == "veterinario":
            return Response(VeterinarioSerializer(user.veterinario_profile, context={"request": request}).data)
        if role == "admin":
            return Response(UserNestedSerializer(user, context={"request": request}).data)
        return Response({}, status=200)

    def partial_update(self, request):
        """PATCH /profile/me"""
        user = request.user
        role = self._get_role(user)
        if role == "recepcionista":
            obj = user.recepcionista_profile
            serializer = RecepcionistaUpdateSerializer(obj, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(RecepcionistaSerializer(obj, context={"request": request}).data)

        if role == "veterinario":
            obj = user.veterinario_profile
            serializer = VeterinarioUpdateSerializer(obj, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(VeterinarioSerializer(obj, context={"request": request}).data)

        if role == "admin":
            serializer = UserUpdateSerializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(UserNestedSerializer(user, context={"request": request}).data)

        return Response({}, status=200)

    # Support PUT as alias to partial_update for convenience
    def update(self, request):
        return self.partial_update(request)
