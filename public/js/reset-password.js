/**
 * JavaScript para página de restablecimiento de contraseña
 */

document.addEventListener('DOMContentLoaded', function() {
    const tokenStatus = document.getElementById('tokenStatus');
    const resetForm = document.getElementById('resetPasswordForm');
    const tokenError = document.getElementById('tokenError');
    const successMessage = document.getElementById('successMessage');
    const messageContainer = document.getElementById('messageContainer');
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showTokenError('No se proporcionó token de recuperación');
        return;
    }
    
    validateToken(token);
    
    setupResetForm();
    
    setupPasswordValidation();

    
    async function validateToken(token) {
        try {
            const response = await fetch(`/api/auth/validate-reset-token/${token}`);
            const data = await response.json();
            
            if (response.ok && data.success) {
                document.getElementById('resetToken').value = token;
                document.getElementById('userEmail').textContent = data.data.email;
                
                tokenStatus.classList.add('d-none');
                resetForm.classList.remove('d-none');
                
                document.getElementById('newPassword').focus();
                
            } else {
                showTokenError(data.message || 'Token inválido');
            }
            
        } catch (error) {
            // Error validando token
            showTokenError('Error de conexión al validar el token');
        }
    }

  
    function showTokenError(message) {
        tokenStatus.classList.add('d-none');
        resetForm.classList.add('d-none');
        tokenError.classList.remove('d-none');
        document.getElementById('errorMessage').textContent = message;
    }

    
    function setupResetForm() {
        resetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(resetForm);
            const data = {
                token: formData.get('token'),
                newPassword: formData.get('newPassword'),
                confirmPassword: formData.get('confirmPassword')
            };
            
            if (!validatePasswords(data.newPassword, data.confirmPassword)) {
                return;
            }
            
            try {
                setSubmitLoading(true);
                
                const response = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    // Éxito - mostrar mensaje de confirmación
                    resetForm.classList.add('d-none');
                    successMessage.classList.remove('d-none');
                    
                } else {
                    showMessage(result.message || 'Error al restablecer contraseña', 'danger');
                }
                
            } catch (error) {
                // Error
                showMessage('Error de conexión. Inténtalo de nuevo.', 'danger');
            } finally {
                setSubmitLoading(false);
            }
        });
    }

  
    function setupPasswordValidation() {
        const newPasswordField = document.getElementById('newPassword');
        const confirmPasswordField = document.getElementById('confirmPassword');
        const submitBtn = document.getElementById('submitBtn');
        
        newPasswordField.addEventListener('input', function() {
            const password = this.value;
            updatePasswordStrength(password);
            updatePasswordRequirements(password);
            toggleSubmitButton();
        });
        
        confirmPasswordField.addEventListener('input', function() {
            validatePasswordMatch();
            toggleSubmitButton();
        });
        
        // Toggle visibility de contraseñas
        document.getElementById('toggleNewPassword').addEventListener('click', function() {
            togglePasswordVisibility('newPassword', this);
        });
        
        document.getElementById('toggleConfirmPassword').addEventListener('click', function() {
            togglePasswordVisibility('confirmPassword', this);
        });
    }

    function updatePasswordStrength(password) {
        const strengthBar = document.getElementById('passwordStrength');
        const strengthText = document.getElementById('strengthText');
        
        let score = 0;
        let feedback = '';
        
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[@$!%*?&]/.test(password)) score++;
        
        const percentage = (score / 5) * 100;
        
        if (score === 0) {
            strengthBar.className = 'progress-bar';
            feedback = '';
        } else if (score <= 2) {
            strengthBar.className = 'progress-bar bg-danger';
            feedback = 'Débil';
        } else if (score <= 3) {
            strengthBar.className = 'progress-bar bg-warning';
            feedback = 'Regular';
        } else if (score <= 4) {
            strengthBar.className = 'progress-bar bg-info';
            feedback = 'Buena';
        } else {
            strengthBar.className = 'progress-bar bg-success';
            feedback = 'Excelente';
        }
        
        strengthBar.style.width = percentage + '%';
        strengthText.textContent = feedback;
    }

 
    function updatePasswordRequirements(password) {
        const requirements = [
            { id: 'req-length', test: password.length >= 8 },
            { id: 'req-lower', test: /[a-z]/.test(password) },
            { id: 'req-upper', test: /[A-Z]/.test(password) },
            { id: 'req-number', test: /\d/.test(password) },
            { id: 'req-special', test: /[@$!%*?&]/.test(password) }
        ];
        
        requirements.forEach(req => {
            const element = document.getElementById(req.id);
            const icon = element.querySelector('i');
            
            if (req.test) {
                icon.className = 'fas fa-check text-success me-1';
                element.classList.add('text-success');
                element.classList.remove('text-muted');
            } else {
                icon.className = 'fas fa-times text-danger me-1';
                element.classList.add('text-muted');
                element.classList.remove('text-success');
            }
        });
    }

   
    function validatePasswordMatch() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmField = document.getElementById('confirmPassword');
        
        if (confirmPassword && newPassword !== confirmPassword) {
            confirmField.classList.add('is-invalid');
            confirmField.classList.remove('is-valid');
            return false;
        } else if (confirmPassword) {
            confirmField.classList.add('is-valid');
            confirmField.classList.remove('is-invalid');
            return true;
        }
        
        return false;
    }

    
    function validatePasswords(newPassword, confirmPassword) {
        if (!newPassword || newPassword.length < 8) {
            showMessage('La contraseña debe tener al menos 8 caracteres', 'danger');
            return false;
        }
        
        if (!confirmPassword) {
            showMessage('Por favor confirma tu contraseña', 'danger');
            return false;
        }
        
        if (newPassword !== confirmPassword) {
            showMessage('Las contraseñas no coinciden', 'danger');
            return false;
        }
        
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!regex.test(newPassword)) {
            showMessage('La contraseña no cumple con los requisitos de seguridad', 'danger');
            return false;
        }
        
        return true;
    }

    function toggleSubmitButton() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = document.getElementById('submitBtn');
        
        const isPasswordValid = newPassword.length >= 8 && 
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword);
        const isConfirmValid = confirmPassword && newPassword === confirmPassword;
        
        submitBtn.disabled = !(isPasswordValid && isConfirmValid);
    }

  
    function togglePasswordVisibility(fieldId, button) {
        const field = document.getElementById(fieldId);
        const icon = button.querySelector('i');
        
        if (field.type === 'password') {
            field.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            field.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

   
    function setSubmitLoading(loading) {
        const submitBtn = document.getElementById('submitBtn');
        const spinner = document.getElementById('submitSpinner');
        
        if (loading) {
            submitBtn.disabled = true;
            spinner.classList.remove('d-none');
            submitBtn.innerHTML = `
                <i class="fas fa-save me-2"></i>
                Restableciendo...
                <span class="spinner-border spinner-border-sm ms-2"></span>
            `;
        } else {
            spinner.classList.add('d-none');
            submitBtn.innerHTML = `
                <i class="fas fa-save me-2"></i>
                Restablecer Contraseña
            `;
            toggleSubmitButton(); 
        }
    }

   
    function showMessage(message, type) {
        const alertMessage = document.getElementById('alertMessage');
        alertMessage.innerHTML = message;
        alertMessage.className = `alert alert-${type}`;
        messageContainer.classList.remove('d-none');
        
        messageContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
});
