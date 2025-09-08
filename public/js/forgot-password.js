/**
 * JavaScript para página de recuperación de contraseña
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('forgotPasswordForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitSpinner = document.getElementById('submitSpinner');
    const messageContainer = document.getElementById('messageContainer');
    const alertMessage = document.getElementById('alertMessage');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        
        if (!email) {
            showMessage('Por favor ingresa tu email', 'danger');
            return;
        }

        if (!isValidEmail(email)) {
            showMessage('Por favor ingresa un email válido', 'danger');
            return;
        }

        try {
            setLoadingState(true);
            
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showMessage(
                    `✅ ${data.message}<br><br>` +
                    `<div class="mt-3">` +
                    `<i class="fas fa-info-circle me-1"></i>` +
                    `<strong>Próximos pasos:</strong><br>` +
                    `• Revisa tu bandeja de entrada<br>` +
                    `• Verifica también la carpeta de spam<br>` +
                    `• El enlace expira en 1 hora<br>` +
                    `</div>`,
                    'success'
                );
                
                document.getElementById('email').disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Email Enviado';
                submitBtn.disabled = true;
                
            } else {
                showMessage(data.message || 'Error al procesar la solicitud', 'danger');
            }

        } catch (error) {
            // Error
            showMessage(
                'Error de conexión. Por favor verifica tu conexión a internet e inténtalo de nuevo.',
                'danger'
            );
        } finally {
            setLoadingState(false);
        }
    });

  
    function showMessage(message, type) {
        alertMessage.innerHTML = message;
        alertMessage.className = `alert alert-${type}`;
        messageContainer.classList.remove('d-none');
        
        messageContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }

   
    function setLoadingState(loading) {
        if (loading) {
            submitBtn.disabled = true;
            submitSpinner.classList.remove('d-none');
            submitBtn.innerHTML = `
                <i class="fas fa-paper-plane me-2"></i>
                Enviando...
                <span class="spinner-border spinner-border-sm ms-2"></span>
            `;
        } else {
            submitBtn.disabled = false;
            submitSpinner.classList.add('d-none');
            submitBtn.innerHTML = `
                <i class="fas fa-paper-plane me-2"></i>
                Enviar Enlace de Recuperación
            `;
        }
    }

    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    document.getElementById('email').addEventListener('input', function() {
        const email = this.value.trim();
        const isValid = email && isValidEmail(email);
        
        this.classList.toggle('is-valid', isValid);
        this.classList.toggle('is-invalid', email && !isValid);
        
        if (isValid && !messageContainer.classList.contains('d-none')) {
            messageContainer.classList.add('d-none');
        }
    });

    document.getElementById('email').focus();
});

function showToast(message, type = 'info') {
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    const toastContainer = document.querySelector('.toast-container') || document.body;
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
