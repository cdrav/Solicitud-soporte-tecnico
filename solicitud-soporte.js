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

document.getElementById('supportRequestForm').addEventListener('submit', function(e) {
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

    //url app script
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzWMscXq5Y3uwSnwE9KEb2HaRGOxFD17m9U9v3aTcSJf-a6bAfM5ddFSNAEJBtysC8Z/exec';

    fetch(scriptURL, {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(response => {
        if (response.result === 'success') {
            alert('¡Solicitud de soporte radicada con éxito! Se ha generado el reporte en el sistema.');
            document.getElementById('supportRequestForm').reset();
            // Ocultar campo rural si estaba visible
            const divRural = document.getElementById('divOtroRural');
            if(divRural) divRural.classList.add('d-none');
        } else {
            throw new Error(response.error);
        }
    })
    .catch(error => {
        console.error('Error!', error.message);
        alert('Hubo un error al enviar la solicitud. Por favor intente nuevamente.');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    });
});