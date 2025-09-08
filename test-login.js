// Script de prueba para login
// Abre las herramientas de desarrollador del navegador y pega este código en la consola

async function testLogin() {
    try {
        console.log('Probando login...');
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Importante para cookies
            body: JSON.stringify({
                email: 'Kevin@test.com',
                password: 'password123'
            })
        });

        const data = await response.json();
        console.log('Respuesta login:', data);

        if (data.success) {
            console.log('Login exitoso! Probando dashboard...');
            
            // Probar dashboard
            const dashResponse = await fetch('/api/dashboard', {
                method: 'GET',
                credentials: 'include'
            });

            const dashData = await dashResponse.json();
            console.log('Respuesta dashboard:', dashData);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

// Ejecutar la prueba
testLogin();
