/**
 * Sistema de notificaciones para la aplicación
 */

export function mostrarNotificacion(mensaje, tipo = 'info') {
	const colores = {
		info: 'bg-blue-600',
		success: 'bg-green-600',
		error: 'bg-red-600',
		warning: 'bg-yellow-600'
	};
	
	const notif = document.createElement('div');
	notif.className = `fixed bottom-4 right-4 ${colores[tipo]} text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in`;
	notif.textContent = mensaje;
	document.body.appendChild(notif);
	
	setTimeout(() => {
		if (document.body.contains(notif)) {
			document.body.removeChild(notif);
		}
	}, tipo === 'error' ? 5000 : 3000);
	
	return notif;
}

export function mostrarLoader(mensaje) {
	const loader = document.createElement('div');
	loader.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
	loader.textContent = mensaje;
	document.body.appendChild(loader);
	
	return {
		actualizar: (nuevoMensaje) => {
			if (document.body.contains(loader)) {
				loader.textContent = nuevoMensaje;
			}
		},
		cerrar: () => {
			if (document.body.contains(loader)) {
				document.body.removeChild(loader);
			}
		},
		cambiarATipo: (mensaje, tipo) => {
			if (document.body.contains(loader)) {
				const colores = {
					success: 'bg-green-600',
					error: 'bg-red-600'
				};
				loader.className = `fixed bottom-4 right-4 ${colores[tipo]} text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in`;
				loader.textContent = mensaje;
				setTimeout(() => {
					if (document.body.contains(loader)) {
						document.body.removeChild(loader);
					}
				}, tipo === 'error' ? 5000 : 3000);
			}
		}
	};
}
