// --- Variables Globales y Referencias al DOM ---
const numeroSecreto = Math.floor(Math.random() * 100) + 1; // Número aleatorio entre 1 y 100
let intentos = 0;
const intentosMaximos = 10;
const minNumero = 1;
const maxNumero = 100;

// Referencias a elementos HTML
const inputSuposicion = document.getElementById('inputSuposicion');
const botonComprobar = document.getElementById('botonComprobar');
const botonVoz = document.getElementById('botonVoz');
const mensaje = document.getElementById('mensaje');
const intentosRestantes = document.getElementById('intentosRestantes');
const botonReiniciar = document.getElementById('botonReiniciar');

// --- Funciones de Voz (Web Speech API) ---

// Para Texto a Voz (TTS)
const speech = window.speechSynthesis;
let utterance = new SpeechSynthesisUtterance();

function hablar(texto) {
    // Si ya está hablando, detener para que la nueva voz no se superponga
    if (speech.speaking) {
        speech.cancel();
    }
    utterance.text = texto;
    utterance.lang = 'es-ES'; // Configura el idioma a español
    // Opcional: configurar voz, tono y velocidad si lo deseas
    // utterance.voice = speech.getVoices().find(voice => voice.name === 'Google español');
    // utterance.rate = 1; // Velocidad normal
    // utterance.pitch = 1; // Tono normal
    speech.speak(utterance);
}

// Para Voz a Texto (STT)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let reconocimiento = null; // Variable para almacenar el objeto de reconocimiento
let recognitionTimeout; // Variable para el temporizador de reconocimiento

if (SpeechRecognition) {
    reconocimiento = new SpeechRecognition();
    reconocimiento.lang = 'es-ES'; // Configura el idioma a español
    reconocimiento.interimResults = false; // Solo resultados finales
    reconocimiento.maxAlternatives = 1; // La alternativa más probable

    // Cuando se detecta un resultado de voz
    reconocimiento.onresult = function(event) {
        clearTimeout(recognitionTimeout); // Limpia el temporizador al obtener un resultado
        const suposicionHablada = event.results[0][0].transcript.trim(); // Obtiene el texto transcrito
        console.log('Suposición hablada:', suposicionHablada);

        // Intenta extraer un número de la frase hablada
        const numeroExtraido = parseInt(suposicionHablada.match(/\d+/)); 
        
        if (!isNaN(numeroExtraido)) {
            inputSuposicion.value = numeroExtraido; // Pone el número en el input
            verificarAdivinanza(); // Ejecuta la lógica del juego
        } else {
            mensaje.textContent = "No pude entender un número. Por favor, dilo de nuevo o escribe tu suposición.";
            hablar("No pude entender un número. Por favor, dilo de nuevo o escribe tu suposición.");
        }
        // Restaura el estado del botón después de procesar el resultado
        botonVoz.textContent = "Di tu número";
        botonVoz.disabled = false;
    };

    // Manejo de errores en el reconocimiento de voz
    reconocimiento.onerror = function(event) {
        clearTimeout(recognitionTimeout); // Limpia el temporizador si hay un error
        console.error('Error en el reconocimiento de voz:', event.error);
        mensaje.textContent = 'Error de voz: ' + event.error + '. Intenta de nuevo o escribe.';
        hablar('Lo siento, hubo un error con la entrada de voz. Por favor, intenta de nuevo o escribe tu número.');
        // Restaura el estado del botón después de un error
        botonVoz.textContent = "Di tu número";
        botonVoz.disabled = false;
    };

    // Cuando el reconocimiento de voz termina (por stop() o por silencio prolongado)
    reconocimiento.onend = function() {
        // Este evento se dispara incluso si onresult/onerror ya se dispararon.
        // Solo asegúrate de que el botón se restaure si no fue ya restaurado por onresult/onerror.
        if (botonVoz.disabled) { // Si el botón sigue deshabilitado, significa que no hubo onresult/onerror
            botonVoz.textContent = "Di tu número";
            botonVoz.disabled = false;
            // Si el temporizador no se limpió por onresult/onerror, límpialo aquí también
            clearTimeout(recognitionTimeout); 
        }
        console.log('Reconocimiento de voz finalizado.');
    };

} else {
    // Si el navegador no soporta Speech Recognition, oculta el botón de voz
    if (botonVoz) { // Asegúrate de que el botón exista antes de intentar manipularlo
        botonVoz.style.display = 'none';
    }
    console.warn('Tu navegador no soporta el reconocimiento de voz. El botón de voz está deshabilitado.');
}

// --- Lógica del Juego ---

// Función para verificar la suposición del usuario
function verificarAdivinanza() {
    const suposicion = parseInt(inputSuposicion.value);

    // Validar que la entrada sea un número dentro del rango
    if (isNaN(suposicion) || suposicion < minNumero || suposicion > maxNumero) {
        mensaje.textContent = `Por favor, ingresa un número válido entre ${minNumero} y ${maxNumero}.`;
        mensaje.classList.add('incorrecto'); // Añade clase para color de error
        hablar(`Por favor, ingresa un número válido entre ${minNumero} y ${maxNumero}.`);
        inputSuposicion.value = ''; // Limpia el input
        return; // Salir de la función si la entrada es inválida
    }

    // Remover clases de mensaje anteriores
    mensaje.classList.remove('correcto', 'incorrecto');

    intentos++; // Incrementa el contador de intentos
    intentosRestantes.textContent = `Intentos restantes: ${intentosMaximos - intentos}`;

    if (suposicion === numeroSecreto) {
        mensaje.textContent = `¡Felicidades! Adivinaste el número ${numeroSecreto} en ${intentos} intentos.`;
        mensaje.classList.add('correcto'); // Añade clase para color de éxito
        hablar(`¡Felicidades! Adivinaste el número ${numeroSecreto} en ${intentos} intentos.`);
        finalizarJuego(true); // El usuario ganó
    } else if (intentos >= intentosMaximos) {
        mensaje.textContent = `¡Te quedaste sin intentos! El número era ${numeroSecreto}.`;
        mensaje.classList.add('incorrecto'); // Añade clase para color de error
        hablar(`¡Te quedaste sin intentos! El número era ${numeroSecreto}.`);
        finalizarJuego(false); // El usuario perdió
    } else if (suposicion < numeroSecreto) {
        mensaje.textContent = "¡Demasiado bajo! Intenta de nuevo.";
        mensaje.classList.add('incorrecto');
        hablar("Demasiado bajo. Intenta de nuevo.");
    } else { // suposicion > numeroSecreto
        mensaje.textContent = "¡Demasiado alto! Intenta de nuevo.";
        mensaje.classList.add('incorrecto');
        hablar("Demasiado alto. Intenta de nuevo.");
    }
    
    inputSuposicion.value = ''; // Limpiar el campo de entrada después de cada intento
    inputSuposicion.focus(); // Volver a enfocar el input para una nueva entrada
}

// Función para finalizar el juego (ganar o perder)
function finalizarJuego(gano) {
    inputSuposicion.disabled = true; // Deshabilita el input
    botonComprobar.disabled = true; // Deshabilita el botón de comprobar
    if (botonVoz) { // Solo deshabilita si el botón de voz existe
        botonVoz.disabled = true; // Deshabilita el botón de voz
    }
    botonReiniciar.classList.remove('oculto'); // Muestra el botón de reiniciar
    
    // Si el reconocimiento de voz estaba activo, deténlo y limpia el temporizador
    if (reconocimiento && reconocimiento.recognizing) {
        reconocimiento.stop();
    }
    clearTimeout(recognitionTimeout); // Asegúrate de limpiar el temporizador
}

// Función para reiniciar el juego
function reiniciarJuego() {
    location.reload(); // La forma más simple de reiniciar el juego y todas las variables
    // Opcional: Reiniciar manualmente si no quieres recargar la página
    /*
    numeroSecreto = Math.floor(Math.random() * 100) + 1;
    intentos = 0;
    mensaje.textContent = '';
    mensaje.classList.remove('correcto', 'incorrecto');
    intentosRestantes.textContent = `Intentos restantes: ${intentosMaximos}`;
    inputSuposicion.value = '';
    inputSuposicion.disabled = false;
    botonComprobar.disabled = false;
    if (SpeechRecognition) { // Solo si el reconocimiento de voz está soportado
        if (botonVoz) botonVoz.disabled = false;
    }
    botonReiniciar.classList.add('oculto');
    inputSuposicion.focus();
    hablar(`He pensado un nuevo número entre ${minNumero} y ${maxNumero}. ¡Adivínalo!`);
    */
}

// --- Event Listeners ---
botonComprobar.addEventListener('click', verificarAdivinanza);
botonReiniciar.addEventListener('click', reiniciarJuego);

// Permite presionar Enter en el input para verificar la suposición
inputSuposicion.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        verificarAdivinanza();
    }
});

// Listener para el botón de activar reconocimiento de voz
if (botonVoz && SpeechRecognition) { // Asegúrate de que el botón y la API existan
    botonVoz.addEventListener('click', function() {
        if (reconocimiento) {
            // Asegúrate de que no haya una sesión de reconocimiento activa
            if (reconocimiento.recognizing) {
                reconocimiento.stop();
            }

            mensaje.textContent = 'Escuchando... Di tu número.';
            hablar('Escuchando. Di tu número.');
            reconocimiento.start(); // Inicia el reconocimiento de voz
            botonVoz.textContent = "Escuchando..."; // Cambia el texto del botón
            botonVoz.disabled = true; // Deshabilita el botón mientras escucha

            // Configura un temporizador para detener el reconocimiento si no hay input después de 5 segundos
            recognitionTimeout = setTimeout(() => {
                if (reconocimiento && reconocimiento.recognizing) {
                    reconocimiento.stop(); // Detiene el reconocimiento si el temporizador expira
                    mensaje.textContent = 'No detecté tu voz. Por favor, intenta de nuevo o escribe tu número.';
                    hablar('No detecté tu voz. Por favor, intenta de nuevo o escribe tu número.');
                    botonVoz.textContent = "Di tu número";
                    botonVoz.disabled = false;
                }
            }, 5000); // 5 segundos
        }
    });
}

// Mensaje de inicio de juego con voz al cargar la página
window.addEventListener('load', () => {
    hablar(`Hola. He pensado un número entre ${minNumero} y ${maxNumero}. Tienes ${intentosMaximos} intentos para adivinarlo.`);
    inputSuposicion.focus();
});