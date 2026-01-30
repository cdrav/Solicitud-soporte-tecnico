// Configuración
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyaDdRzHEXI26YoIwCR0aJG1cKlw9jk1LdZ0QcMctO7A8fOXKzWE0hcW7tG7Y3N7K7D/exec';


let datosSolicitudes = []; // Variable global para almacenar los datos y poder filtrarlos

// Lógica para mostrar campo de Puesto Rural si se selecciona "Rurales (Otro)"
const servicioSelect = document.getElementById('servicioSelect');
if (servicioSelect) {
    servicioSelect.addEventListener('change', function() {
        const divRural = document.getElementById('divOtroRural');
        const inputRural = document.getElementById('inputNombreRural');
        
        if (this.value === 'Rurales (Otro)') {
            divRural.classList.remove('d-none');
            inputRural.required = true;
            inputRural.focus();
        } else {
            divRural.classList.add('d-none');
            inputRural.required = false;
            inputRural.value = '';
        }
    });
}

// Lógica para mostrar Zona de Sistemas (Protegida)
const btnSistemas = document.getElementById('btnAccesoSistemas');
if (btnSistemas) {
    btnSistemas.addEventListener('click', function() {
        const zonaSistemas = document.getElementById('zonaSistemas');
        
        // Si ya está visible, lo ocultamos
        if (!zonaSistemas.classList.contains('d-none')) {
            zonaSistemas.classList.add('d-none');
            return;
        }

        // Abrir Modal de Contraseña en lugar de prompt
        const modalElement = document.getElementById('accesoTecnicoModal');
        const modal = new bootstrap.Modal(modalElement);
        document.getElementById('inputClaveTecnica').value = ''; // Limpiar campo
        modal.show();
    });
}

// Lógica del botón dentro del Modal de Clave
const btnValidarClave = document.getElementById('btnValidarClave');
if (btnValidarClave) {
    btnValidarClave.addEventListener('click', function() {
        const inputClave = document.getElementById('inputClaveTecnica');
        const zonaSistemas = document.getElementById('zonaSistemas');
        const modalElement = document.getElementById('accesoTecnicoModal');
        
        if (inputClave.value === "Hdsa891900") {
            zonaSistemas.classList.remove('d-none');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
        } else {
            alert("Clave incorrecta.");
            inputClave.value = '';
            inputClave.focus();
        }
    });
}

// Función para cargar los datos de una fila en el formulario
function cargarDatosEnFormulario(fila) {
    const form = document.getElementById('supportRequestForm');
    if (!form) return;

    form.reset(); // Limpiar formulario para evitar mezclas

    // Guardar índice de fila y fecha original para actualización
    document.getElementById('rowIndex').value = fila.row_index || '';
    document.getElementById('originalDate').value = fila['Fecha'] || fila['Marca temporal'] || '';
    document.getElementById('currentPdfUrl').value = fila['PDF URL'] || '';

    // Función auxiliar robusta: ignora mayúsculas y TILDES (Ej: 'Descripción' vs 'descripcion')
    const getVal = (key) => {
        const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const target = normalize(key);
        const foundKey = Object.keys(fila).find(k => normalize(k) === target);
        return foundKey ? fila[foundKey] : '';
    };

    // 1. Llenar campos de texto y selects básicos
    if (form.nombre) form.nombre.value = getVal('nombre');
    if (form.descripcion) form.descripcion.value = getVal('descripcion');
    if (form.placa_inventario) form.placa_inventario.value = getVal('placa_inventario') || getVal('placa');
    if (form.prioridad) form.prioridad.value = getVal('prioridad');
    
    // Campos de Zona Técnica (Mapeo inverso para edición)
    if (form.tecnico_soporte) form.tecnico_soporte.value = getVal('tecnico_soporte') || getVal('Técnico');
    if (form.tipo_accion) form.tipo_accion.value = getVal('tipo_accion') || getVal('Acción');
    if (form.escalado_a) form.escalado_a.value = getVal('escalado_a') || getVal('Escalado');
    if (form.notas_tecnicas) form.notas_tecnicas.value = getVal('notas_tecnicas') || getVal('Notas');

    // 2. Llenar Servicio y activar lógica de Rurales (PRIMERO activamos el evento)
    if (form.servicio) {
        form.servicio.value = getVal('servicio');
        // Disparamos el evento 'change' manualmente para que se muestre/oculte el campo "Otro Rural"
        form.servicio.dispatchEvent(new Event('change'));
    }

    // 3. Llenar Nombre Rural (DESPUÉS del evento para que no se borre)
    if (form.nombre_rural) form.nombre_rural.value = getVal('nombre_rural') || getVal('Puesto Rural');

    // 4. Marcar los Checkboxes de Categoría
    const catStr = getVal('categoria');
    if (catStr) {
        const cats = catStr.split(',').map(s => s.trim()); // Separar por comas
        const checkboxes = form.querySelectorAll('input[name="categoria"]');
        checkboxes.forEach(cb => {
            if (cats.includes(cb.value)) cb.checked = true;
        });
    }

    // 4. Interfaz: Ocultar tabla y mostrar formulario
    document.getElementById('adminPanel').classList.add('d-none');
    form.classList.remove('d-none');

    // 5. Abrir automáticamente la Zona de Sistemas para editar
    const zonaSistemas = document.getElementById('zonaSistemas');
    if (zonaSistemas) zonaSistemas.classList.remove('d-none');

    // 6. BLOQUEAR CAMPOS DEL USUARIO (Para que el técnico solo llene su parte)
    const camposUsuario = ['nombre', 'servicio', 'descripcion', 'placa_inventario', 'prioridad', 'nombre_rural'];
    camposUsuario.forEach(name => {
        const el = form.elements[name];
        if(el) {
            el.readOnly = true;
            if(el.tagName === 'SELECT') {
                el.style.pointerEvents = 'none'; // Bloquea clics en selects
                el.style.backgroundColor = '#e9ecef'; // Gris visual
            } else {
                el.classList.add('bg-light');
            }
        }
    });
    // Bloquear checkboxes de categoría visualmente
    form.querySelectorAll('input[name="categoria"]').forEach(cb => cb.onclick = () => false);

    // 7. Subir al inicio de la página
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Cambiar texto del botón para indicar actualización
    const submitBtn = form.querySelector('button[type="submit"]');
    if(submitBtn) submitBtn.innerHTML = '<i class="bi bi-arrow-repeat me-2"></i>Actualizar Solicitud';
    
    alert('Solicitud cargada. Agregue la solución y haga clic en "Actualizar Solicitud" para guardar en la misma fila.');
}

// Función para filtrar y renderizar la tabla
function aplicarFiltros() {
    const estado = document.getElementById('filtroEstado').value;
    const fechaInput = document.getElementById('filtroFecha').value; // Formato YYYY-MM-DD
    const tbody = document.getElementById('tablaCuerpo');
    tbody.innerHTML = '';

    const datosFiltrados = datosSolicitudes.filter(fila => {
        // 1. Filtro de Estado
        const accion = fila['Acción'] || fila['tipo_accion'] || '';
        // Es revisado si tiene contenido Y NO es "Pendiente"
        const esRevisado = accion !== '' && accion !== 'Pendiente';
        
        if (estado === 'pendiente' && esRevisado) return false;
        if (estado === 'revisado' && !esRevisado) return false;

        // 2. Filtro de Fecha
        if (fechaInput) {
            // Convertir YYYY-MM-DD (input) a DD/MM/YYYY (formato usual en Sheets) para comparar
            const [anio, mes, dia] = fechaInput.split('-');
            const fechaBusqueda = `${dia}/${mes}/${anio}`;
            
            const fechaFila = fila['Marca temporal'] || fila['Fecha'] || '';
            // Verificamos si la fecha de la fila contiene la fecha buscada
            if (!fechaFila.includes(fechaBusqueda)) return false;
        }

        return true;
    });

    if (datosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">No se encontraron registros con estos filtros.</td></tr>';
        return;
    }

    datosFiltrados.forEach(fila => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.title = 'Haga clic para cargar y gestionar esta solicitud';
        tr.onclick = () => cargarDatosEnFormulario(fila);

        const accion = fila['Acción'] || fila['tipo_accion'] || '';
        const esRevisadoVisual = accion !== '' && accion !== 'Pendiente';

        tr.innerHTML = `
            <td>${fila['Marca temporal'] || fila['Fecha'] || '-'}</td>
            <td class="fw-bold">${fila['nombre'] || fila['Nombre'] || '-'}</td>
            <td>${fila['servicio'] || fila['Servicio'] || '-'}</td>
            <td><span class="badge bg-secondary">${fila['categoria'] || '-'}</span></td>
            <td class="text-truncate" style="max-width: 150px;">${fila['descripcion'] || '-'}</td>
            <td>${esRevisadoVisual ? '<span class="badge bg-success">Revisado</span>' : '<span class="badge bg-warning text-dark">Pendiente</span>'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Lógica para el Panel de Administración (Ver Solicitudes)
const btnVerSolicitudes = document.getElementById('btnVerSolicitudes');
const adminPanel = document.getElementById('adminPanel');
const supportFormContainer = document.getElementById('supportRequestForm');

if (btnVerSolicitudes) {
    btnVerSolicitudes.addEventListener('click', function() {
        // Mostrar cargando
        const originalText = this.innerHTML;
        this.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Cargando datos...';
        this.disabled = true;

        fetch(GOOGLE_SCRIPT_URL) // Por defecto hace un GET
        .then(response => response.json())
        .then(data => {
            // Guardamos los datos y los invertimos (más recientes primero)
            datosSolicitudes = data.reverse();
            
            // Renderizamos la tabla aplicando los filtros por defecto (Pendientes)
            aplicarFiltros();

            // Mostrar panel y ocultar formulario
            adminPanel.classList.remove('d-none');
            supportFormContainer.classList.add('d-none');
        })
        .catch(error => {
            console.error('Error cargando datos:', error);
            alert('Error al cargar los registros. Verifica tu conexión o el script.');
        })
        .finally(() => {
            this.innerHTML = originalText;
            this.disabled = false;
        });
    });

    // Botón cerrar tabla
    document.getElementById('btnCerrarAdmin').addEventListener('click', function() {
        adminPanel.classList.add('d-none');
        supportFormContainer.classList.remove('d-none');
    });

    // Eventos de los filtros
    document.getElementById('filtroEstado').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroFecha').addEventListener('change', aplicarFiltros);
    
    // Botón Limpiar
    document.getElementById('btnLimpiarFiltros').addEventListener('click', function() {
        document.getElementById('filtroEstado').value = 'pendiente'; // Volver a por defecto
        document.getElementById('filtroFecha').value = '';
        aplicarFiltros();
    });
}

const supportForm = document.getElementById('supportRequestForm');

if (supportForm) supportForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Validación: Al menos una categoría seleccionada
    if (this.querySelectorAll('input[name="categoria"]:checked').length === 0) {
        alert('Por favor seleccione al menos una categoría de incidente.');
        return;
    }

    // Efecto de carga
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    let wasSuccess = false; // Bandera para saber si se envió bien
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';

    // Recopilación de datos
    const formData = new FormData(this);
    const data = new URLSearchParams();
    
    // Procesar datos para enviar
    for (const pair of formData.entries()) {
        if (pair[0] !== 'categoria') {
            data.append(pair[0], pair[1]);
        }
    }
    // Unir categorías seleccionadas
    data.append('categoria', formData.getAll('categoria').join(', '));

    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(response => {
        if (response.result === 'success') {
            wasSuccess = true;
            const esActualizacion = data.has('row_index') && data.get('row_index') !== '';
            const mensaje = esActualizacion ? '¡Solicitud actualizada correctamente!' : '¡Solicitud de soporte radicada con éxito!';
            
            alert(mensaje);
            document.getElementById('supportRequestForm').reset();
            document.getElementById('rowIndex').value = ''; // Limpiar índice
            document.getElementById('originalDate').value = ''; // Limpiar fecha
            document.getElementById('currentPdfUrl').value = ''; // Limpiar URL PDF
            
            // DESBLOQUEAR CAMPOS (Para permitir nuevas solicitudes limpias)
            const camposUsuario = ['nombre', 'servicio', 'descripcion', 'placa_inventario', 'prioridad', 'nombre_rural'];
            camposUsuario.forEach(name => {
                const el = document.getElementById('supportRequestForm').elements[name];
                if(el) {
                    el.readOnly = false;
                    if(el.tagName === 'SELECT') {
                        el.style.pointerEvents = 'auto';
                        el.style.backgroundColor = '';
                    } else {
                        el.classList.remove('bg-light');
                    }
                }
            });
            document.querySelectorAll('input[name="categoria"]').forEach(cb => cb.onclick = null);
            
            // Ocultar campo rural si estaba visible
            const divRural = document.getElementById('divOtroRural');
            if(divRural) divRural.classList.add('d-none');
            // Ocultar zona sistemas si estaba visible
            const zonaSistemas = document.getElementById('zonaSistemas');
            if(zonaSistemas) zonaSistemas.classList.add('d-none');
        } else {
            throw new Error(response.error);
        }
    })
    .catch(error => {
        console.error('Error!', error.message);
        alert('Error: ' + error.message);
    })
    .finally(() => {
        submitBtn.disabled = false;
        // Si fue exitoso, restauramos el botón a "Solicitar Soporte" (por si venía de "Actualizar")
        if (wasSuccess) {
            submitBtn.innerHTML = '<i class="bi bi-tools me-2"></i>Solicitar Soporte';
        } else {
            submitBtn.innerHTML = originalBtnText;
        }
    });
});