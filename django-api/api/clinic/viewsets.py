from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema_view, extend_schema
from datetime import date, datetime
from django.db.models import Q
from .models import (
    Dueno,
    Recepcionista,
    Mascota,
    Consulta,
    Veterinario,
    Comprobante,
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
    ComprobanteSerializer,
)
from rest_framework.response import Response


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
        return Response(out_serializer.data, status=201)

    @extend_schema(tags=["Dueños"], summary="Obtener o actualizar perfil del dueño autenticado")
    @action(detail=False, methods=["get", "put", "patch"], url_path="me", permission_classes=[IsAuthenticated])
    def me(self, request):
        """Return or update the Dueno profile for the authenticated user.

        GET  -> returns the Dueno profile
        PUT/PATCH -> updates the Dueno profile (only `nombre` and `telefono` for owners)
        """
        user = request.user
        if not hasattr(user, "dueno_profile") or user.dueno_profile is None:
            return Response({}, status=200)

        dueno = user.dueno_profile

        if request.method == "GET":
            serializer = DuenoSerializer(dueno, context={"request": request})
            return Response(serializer.data, status=200)

        # Update path
        from .serializers import DuenoUpdateSerializer

        partial = request.method == "PATCH"
        serializer = DuenoUpdateSerializer(dueno, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        out = DuenoSerializer(dueno, context={"request": request})
        return Response(out.data, status=200)

    @extend_schema(responses=MeSummarySerializer, tags=["Dueños"], summary="Resumen del dueño autenticado")
    @action(detail=False, methods=["get"], url_path="me/summary", permission_classes=[IsAuthenticated])
    def me_summary(self, request):
        """Return combined data for the authenticated owner: dueno profile, mascotas and 5 recent citas."""
        user = request.user
        # Determine role: dueno, recepcionista, veterinario, admin, or other
        role = None
        if hasattr(user, "dueno_profile") and user.dueno_profile is not None:
            role = "dueno"
        elif hasattr(user, "recepcionista_profile") and user.recepcionista_profile is not None:
            role = "recepcionista"
        elif user.is_superuser:
            role = "admin"
        else:
            # try to heuristically detect a Veterinario linked by name
            try:
                # try matching vet by the local-part of the user's email (fallback)
                email = getattr(user, "email", "") or ""
                local = email.split("@")[0] if "@" in email else email
                vet = Veterinario.objects.filter(nombre__iexact=local).first()
            except Exception:
                vet = None
            if vet:
                role = "veterinario"

        # If the requester is a dueno -> return their own dueno summary
        if role == "dueno":
            dueno = user.dueno_profile
            dueno_data = DuenoSerializer(dueno, context={"request": request}).data
            mascotas_qs = Mascota.objects.filter(dueno=dueno)
            mascotas_data = MascotaSerializer(mascotas_qs, many=True, context={"request": request}).data
            # upcoming consultas: not attended and fecha >= today (consider hora if present)
            today = date.today()
            now_time = datetime.now().time()
            citas_qs = Consulta.objects.filter(dueno=dueno, asistio=False).filter(
                Q(fecha__gt=today) | Q(fecha=today, hora__gte=now_time) | Q(hora__isnull=True)
            ).order_by("fecha", "hora")[:5]
            citas_data = ConsultaSerializer(citas_qs, many=True, context={"request": request}).data
            return Response({"role": "dueno", "dueno": dueno_data, "mascotas": mascotas_data, "citas": citas_data}, status=200)

        # For recepcionista / veterinario / admin: allow querying a specific dueño via ?dueno_id=
        dueno_id = request.query_params.get("dueno_id") or request.query_params.get("target_dueno")
        if dueno_id and role in ("recepcionista", "veterinario", "admin"):
            try:
                dueno = Dueno.objects.get(pk=dueno_id)
            except Dueno.DoesNotExist:
                from rest_framework.exceptions import NotFound

                raise NotFound({"detail": "Dueno not found"})

            dueno_data = DuenoSerializer(dueno, context={"request": request}).data
            mascotas_qs = Mascota.objects.filter(dueno=dueno)
            mascotas_data = MascotaSerializer(mascotas_qs, many=True, context={"request": request}).data
            citas_qs = Consulta.objects.filter(dueno=dueno).order_by("-fecha")[:5]
            citas_data = ConsultaSerializer(citas_qs, many=True, context={"request": request}).data
            return Response({"role": role, "requested_for": "dueno", "dueno": dueno_data, "mascotas": mascotas_data, "citas": citas_data}, status=200)

        # Otherwise return a role-specific summary/profile for the authenticated user
        from .serializers import RecepcionistaSerializer, VeterinarioSerializer

        if role == "recepcionista":
            profile = RecepcionistaSerializer(user.recepcionista_profile, context={"request": request}).data
            return Response({"role": "recepcionista", "profile": profile, "mascotas": [], "citas": []}, status=200)

        if role == "veterinario":
            # If a Veterinario matched earlier, return its data
            vet_obj = vet if "vet" in locals() else None
            vet_data = VeterinarioSerializer(vet_obj, context={"request": request}).data if vet_obj else {}
            return Response({"role": "veterinario", "profile": vet_data, "mascotas": [], "citas": []}, status=200)

        if role == "admin":
            # Return basic admin info
            return Response({"role": "admin", "profile": {"id": user.id, "email": user.email}}, status=200)

        # Fallback: unauthenticated or no role
        return Response({"role": "unknown", "dueno": {}, "mascotas": [], "citas": []}, status=200)

    @extend_schema(tags=["Dueños"], summary="Citas pasadas atendidas del dueño autenticado")
    @action(detail=False, methods=["get"], url_path="me/past-citas", permission_classes=[IsAuthenticated])
    def me_past_citas(self, request):
        user = request.user
        if not hasattr(user, "dueno_profile") or user.dueno_profile is None:
            return Response([], status=200)
        dueno = user.dueno_profile
        today = date.today()
        now_time = datetime.now().time()
        # Past and attended: fecha < today OR (fecha == today and hora < now)
        past_q = Q(fecha__lt=today) | (Q(fecha=today) & Q(hora__lt=now_time))
        consultas = Consulta.objects.filter(dueno=dueno, asistio=True).filter(past_q).order_by("-fecha", "-hora")
        serializer = ConsultaSerializer(consultas, many=True, context={"request": request})
        return Response(serializer.data, status=200)

    @extend_schema(tags=["Dueños"], summary="Citas futuras no atendidas del dueño autenticado")
    @action(detail=False, methods=["get"], url_path="me/future-citas", permission_classes=[IsAuthenticated])
    def me_future_citas(self, request):
        user = request.user
        if not hasattr(user, "dueno_profile") or user.dueno_profile is None:
            return Response([], status=200)
        dueno = user.dueno_profile
        today = date.today()
        now_time = datetime.now().time()
        future_q = Q(fecha__gt=today) | (Q(fecha=today) & Q(hora__gte=now_time)) | Q(hora__isnull=True)
        consultas = Consulta.objects.filter(dueno=dueno, asistio=False).filter(future_q).order_by("fecha", "hora")
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
        return Response(out_serializer.data, status=201)

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
            return Response(out_serializer.data, status=201)
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
    # Only authenticated users can create a Mascota; owners will create for themselves
    permission_classes = (IsAuthenticated,)

    def create(self, request, *args, **kwargs):
        user = request.user
        # ensure the authenticated user has a Dueno profile
        if not hasattr(user, "dueno_profile"):
            # Auto-create a Dueno profile for the authenticated user so they can
            # create mascotas right away (self-registration flow)
            from .models import Dueno

            default_nombre = ""
            if getattr(user, "email", None):
                default_nombre = user.email.split("@")[0]
            dueno = Dueno.objects.create(user=user, nombre=default_nombre)
        else:
            dueno = user.dueno_profile

        data = request.data.copy()
        # set dueno to the logged in owner's PK so frontend doesn't need to send it
        data["dueno"] = dueno.pk

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        mascota = serializer.save()
        out_serializer = MascotaSerializer(mascota, context={"request": request})
        return Response(out_serializer.data, status=201)

    @action(detail=False, methods=["get"], url_path="user", permission_classes=[IsAuthenticated])
    def user(self, request):
        """Return mascotas for the logged-in owner (based on request.user.dueno_profile)."""
        user = request.user
        if not hasattr(user, "dueno_profile") or user.dueno_profile is None:
            # No dueno profile -> return empty list
            return Response([], status=200)

        dueno = user.dueno_profile
        mascotas = self.queryset.filter(dueno=dueno)
        serializer = self.get_serializer(mascotas, many=True, context={"request": request})
        return Response(serializer.data, status=200)

    def _is_allowed_to_modify(self, user, mascota):
        """Return True if user can modify the given mascota."""
        if user.is_superuser:
            return True
        if hasattr(user, "recepcionista_profile"):
            return True
        if hasattr(user, "dueno_profile") and mascota.dueno_id == user.dueno_profile.pk:
            return True
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
            allowed = False
            if hasattr(user, "dueno_profile") and mascota.dueno_id == user.dueno_profile.pk:
                allowed = True
            if hasattr(user, "recepcionista_profile"):
                allowed = True
            if hasattr(user, "veterinario_profile"):
                allowed = True
            if user.is_superuser:
                allowed = True

            if not allowed:
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

        # If authenticated owner, default dueno to the logged-in owner's profile
        user = request.user
        if hasattr(user, "dueno_profile") and not data.get("dueno"):
            data["dueno"] = user.dueno_profile.pk

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        out = self.get_serializer(obj, context={"request": request})
        return Response(out.data, status=201)

    @action(detail=False, methods=["get"], url_path="user/recent", permission_classes=[IsAuthenticated])
    def user_recent(self, request):
        """Return the 5 most recent consultas for the authenticated owner's mascotas."""
        user = request.user
        if not hasattr(user, "dueno_profile") or user.dueno_profile is None:
            return Response([], status=200)

        dueno = user.dueno_profile
        consultas = self.queryset.filter(mascota__dueno=dueno).order_by("-fecha")[:5]
        serializer = self.get_serializer(consultas, many=True, context={"request": request})
        return Response(serializer.data, status=200)

    


# CitaViewSet removed — Consulta now represents both appointments and clinical consultations.


# Comprobante model and endpoints removed — not used in current design


@extend_schema_view(
    retrieve=extend_schema(tags=["Perfil"], summary="Obtener perfil autenticado"),
    update=extend_schema(tags=["Perfil"], summary="Actualizar perfil autenticado"),
    partial_update=extend_schema(tags=["Perfil"], summary="Actualizar parcialmente perfil autenticado"),
)
class ProfileViewSet(viewsets.ViewSet):
    """Unified profile endpoint. GET/PUT/PATCH on `/profile/me` will return or update
    the profile corresponding to the authenticated user based on role.

    - dueno -> uses DuenoUpdateSerializer
    - recepcionista -> uses RecepcionistaUpdateSerializer
    - veterinario -> uses VeterinarioUpdateSerializer
    - admin (superuser) -> uses UserUpdateSerializer on User model
    """

    permission_classes = (IsAuthenticated,)

    def _get_role(self, user):
        if hasattr(user, "dueno_profile") and user.dueno_profile is not None:
            return "dueno"
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
        if role == "dueno":
            return Response(DuenoSerializer(user.dueno_profile, context={"request": request}).data)
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
        if role == "dueno":
            obj = user.dueno_profile
            serializer = DuenoUpdateSerializer(obj, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(DuenoSerializer(obj, context={"request": request}).data)

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
