// ====================================================================
// ========================= 1. SELECTORES Y VARIABLES GLOBALES =========================
// ====================================================================

// Selectores del DOM
const canvas = document.getElementById('juegoCanvas');
const ctx = canvas.getContext('2d');
const infoElement = document.getElementById('nivel-info'); 

// Constantes de la Cuadrícula
const GRID_SIZE = 7; 
const FIXED_CANVAS_SIZE = 500; 
let CANVAS_SIZE = FIXED_CANVAS_SIZE; 
let TAMAÑO_CELDA;

// Estado del Juego
let nivelActual = 0; 
let colorActivo = null; 
let caminos = {}; 

// Estado de Arrastre
let isMouseDown = false; 
let ultimaCeldaProcesada = null; 

// ====================================================================
// ========================= 2. ESTRUCTURA DE NIVELES =========================
// ====================================================================

const niveles = [
    {
        id: 1,
        puntos: [
            { color: 'red', inicio: {r: 1, c: 1}, fin: {r: 6, c: 6} },
            { color: 'blue', inicio: {r: 1, c: 6}, fin: {r: 6, c: 1} }
        ]
    },
    {
        id: 2,
        puntos: [
            { color: 'red', inicio: {r: 2, c: 3}, fin: {r: 3, c: 3} },
            { color: 'blue', inicio: {r: 4, c: 0}, fin: {r: 4, c: 4} },
            { color: 'yellow', inicio: {r: 0, c: 6}, fin: {r: 6, c: 0} },
        ]
    },
    {
        id: 3,
        puntos: [
            { color: 'red', inicio: {r: 2, c: 2}, fin: {r: 6, c: 6} },
            { color: 'blue', inicio: {r: 6, c: 0}, fin: {r: 2, c: 5} },
            { color: 'green', inicio: {r: 3, c: 4}, fin: {r: 4, c: 3} },
            { color: 'pink', inicio: {r: 0, c: 0}, fin: {r: 5, c: 2} },
        ]
    },
    { 
        id: 4,
        puntos: [
            { color: 'red', inicio: {r: 1, c: 2}, fin: {r: 2, c: 4} },
            { color: 'blue', inicio: {r: 1, c: 5}, fin: {r: 5, c: 1} },
            { color: 'green', inicio: {r: 2, c: 2}, fin: {r: 4, c: 4} },
            { color: 'pink', inicio: {r: 0, c: 0}, fin: {r: 4, c: 2} },
            { color: 'yellow', inicio: {r: 0, c: 6}, fin: {r: 6, c: 0} }
        ]
    }
];

// ====================================================================
// ========================= 3. UTILIDADES DE DIBUJO Y CÁLCULO =========================
// ====================================================================

function ajustarCanvas() {
    CANVAS_SIZE = FIXED_CANVAS_SIZE;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    TAMAÑO_CELDA = CANVAS_SIZE / GRID_SIZE;
}

function obtenerCentroCelda(fila, columna) {
    const centroX = (columna * TAMAÑO_CELDA) + (TAMAÑO_CELDA / 2);
    const centroY = (fila * TAMAÑO_CELDA) + (TAMAÑO_CELDA / 2);
    return { x: centroX, y: centroY };
}

function obtenerColorDeCelda(celda) {
    for (const color in caminos) {
        const camino = caminos[color];
        const estaEnCamino = camino.some(c => c.r === celda.r && c.c === celda.c);
        if (estaEnCamino) {
            return color; 
        }
    }
    return null; 
}

function esAdyacente(ultima, nueva) {
    const diferenciaFilas = Math.abs(ultima.r - nueva.r);
    const diferenciaColumnas = Math.abs(ultima.c - nueva.c);
    return (diferenciaFilas + diferenciaColumnas === 1);
}

function inicializarCaminos() {
    const datosNivel = niveles[nivelActual];
    caminos = {}; 
    datosNivel.puntos.forEach(par => {
        // Inicializa solo con el punto de inicio
        caminos[par.color] = [{ r: par.inicio.r, c: par.inicio.c }];
    });
}

// ====================================================================
// ========================= 4. LÓGICA DE DIBUJO (Rendering) =========================
// ====================================================================

function dibujarCuadricula() {
    ctx.strokeStyle = '#122b9eaf'; 
    ctx.lineWidth = 2; 

    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * TAMAÑO_CELDA); 
        ctx.lineTo(CANVAS_SIZE, i * TAMAÑO_CELDA); 
        ctx.stroke(); 

        ctx.beginPath();
        ctx.moveTo(i * TAMAÑO_CELDA, 0);
        ctx.lineTo(i * TAMAÑO_CELDA, CANVAS_SIZE);
        ctx.stroke(); 
    }
}

function dibujarPuntoIndividual(coords, color) {
    const centro = obtenerCentroCelda(coords.r, coords.c);

    ctx.fillStyle = color; 
    ctx.beginPath();
    ctx.arc(centro.x, centro.y, TAMAÑO_CELDA / 3, 0, Math.PI * 2); 
    ctx.fill(); 
}

function dibujarPuntos() {
    const datosNivel = niveles[nivelActual];
    datosNivel.puntos.forEach(par => {
        dibujarPuntoIndividual(par.inicio, par.color);
        dibujarPuntoIndividual(par.fin, par.color);
    });
}

function dibujarCaminos() {
    ctx.globalCompositeOperation = 'lighter'; 

    for (const color in caminos) {
        const camino = caminos[color];
        if (camino.length < 2) continue;

        ctx.strokeStyle = color; 
        ctx.lineWidth = TAMAÑO_CELDA / 3; 
        ctx.lineCap = 'round';

        ctx.beginPath();

        let centro = obtenerCentroCelda(camino[0].r, camino[0].c);
        ctx.moveTo(centro.x, centro.y);

        for (let i = 1; i < camino.length; i++) {
            centro = obtenerCentroCelda(camino[i].r, camino[i].c);
            ctx.lineTo(centro.x, centro.y);
        }

        ctx.stroke();
    }
    
    ctx.globalCompositeOperation = 'source-over'; 
}


function actualizarCanvas() {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    dibujarCuadricula();
    dibujarCaminos(); 
    dibujarPuntos();
}

// ====================================================================
// ========================= 5. LÓGICA DE JUEGO (Arrastre y Colisiones) =========================
// ====================================================================

function esPuntoFinalOtroColor(celda, colorActual) {
    const datosNivel = niveles[nivelActual];
    return datosNivel.puntos.some(par => 
        par.color !== colorActual && par.fin.r === celda.r && par.fin.c === celda.c
    );
}

function esPuntoInicialPropio(celda, colorActual) {
    const datosNivel = niveles[nivelActual];
    const par = datosNivel.puntos.find(p => p.color === colorActual);
    return par.inicio.r === celda.r && par.inicio.c === celda.c;
}

function estaEnOtroCamino(celda, colorActual) {
    for (const color in caminos) {
        if (color === colorActual) continue; 
        const camino = caminos[color];
        if (esPuntoFinalOtroColor(celda, colorActual)) continue; 
        
        const estaOcupada = camino.some(c => c.r === celda.r && c.c === celda.c);
        if (estaOcupada) {
            return true;
        }
    }
    return false;
}

function hayColision(nuevaCelda, colorActual) {
    const caminoActual = caminos[colorActual];

    if (esPuntoFinalOtroColor(nuevaCelda, colorActual)) {
        return true; 
    }

    if (estaEnOtroCamino(nuevaCelda, colorActual)) {
        return true;
    }
    
    if (caminoActual.length > 1 && esPuntoInicialPropio(nuevaCelda, colorActual)) {
        return true;
    }

    return false;
}

function manejarInicioArrastre(celda) {
    const datosNivel = niveles[nivelActual];
    let parSeleccionado = null;

    for (const par of datosNivel.puntos) {
        if ((par.inicio.r === celda.r && par.inicio.c === celda.c) || 
            (par.fin.r === celda.r && par.fin.c === celda.c)) {
            parSeleccionado = par;
            break; 
        }
    }
    
    if (parSeleccionado) {
        colorActivo = parSeleccionado.color;
        const caminoActual = caminos[colorActivo];
        
        const esPuntoInicio = parSeleccionado.inicio.r === celda.r && parSeleccionado.inicio.c === celda.c;
        
        if (esPuntoInicio) {
            caminos[colorActivo] = [{ r: celda.r, c: celda.c }]; 
        } else {

        const indiceDeFin = caminoActual.findIndex(c => c.r === celda.r && c.c === celda.c);

            if (indiceDeFin > 0) {
                caminos[colorActivo] = caminoActual.slice(0, indiceDeFin + 1);
            } else {
                caminos[colorActivo] = [{ r: parSeleccionado.inicio.r, c: parSeleccionado.inicio.c }];
            }
        }
        
        ultimaCeldaProcesada = celda; 
        actualizarCanvas();
        return; 
    } 
    
    const colorExistente = obtenerColorDeCelda(celda);
    
    if (colorExistente) { 
        colorActivo = colorExistente;

        const camino = caminos[colorActivo];
        const indiceDeInicio = camino.findIndex(c => c.r === celda.r && c.c === celda.c);
        
        caminos[colorActivo] = camino.slice(0, indiceDeInicio + 1);
        ultimaCeldaProcesada = celda; 
        actualizarCanvas();
    } else {
        colorActivo = null;
    }
}

function manejarMovimientoArrastre(celda) {
    if (!celda || colorActivo === null) return; 

    const datosNivel = niveles[nivelActual];
    const caminoActual = caminos[colorActivo];
    const ultimaCelda = caminoActual[caminoActual.length - 1];
    
    if (ultimaCeldaProcesada && ultimaCeldaProcesada.r === celda.r && ultimaCeldaProcesada.c === celda.c) {
        return;
    }
    
    ultimaCeldaProcesada = celda; 

    if (caminoActual.length > 1) { 
        const penultimaCelda = caminoActual[caminoActual.length - 2];
        
        if (penultimaCelda.r === celda.r && penultimaCelda.c === celda.c) {
            caminoActual.pop();
            actualizarCanvas();
            return; 
        }
    }
    
    const esSiguienteCeldaAdyacente = esAdyacente(ultimaCelda, celda);
    let esSaltoValido = false;

    if (!esSiguienteCeldaAdyacente && caminoActual.length >= 2) {
        const penultimaCelda = caminoActual[caminoActual.length - 2];

        if (esAdyacente(penultimaCelda, celda)) {
            if (!hayColision(celda, colorActivo)) {
            caminoActual.pop(); 
                esSaltoValido = true;
            }
        }
    }

    if (esSiguienteCeldaAdyacente || esSaltoValido) {
        
        if (hayColision(celda, colorActivo)) {
            return; 
        }

        caminoActual.push(celda);
        
        const par = datosNivel.puntos.find(p => p.color === colorActivo);
        if (par.fin.r === celda.r && par.fin.c === celda.c) { 
            colorActivo = null; 
            
            if (comprobarVictoria()) {
                setTimeout(() => {
                    alert('¡Nivel Completado! 😎 Prepárate para el siguiente nivel.');
                    pasarSiguienteNivel(); 
                }, 100); 
            }
        }
        actualizarCanvas();
    }
}

// ====================================================================
// ========================= 6. MANEJO DE ENTRADA (Eventos) =========================
// ====================================================================
// ====================================================================
// ========================= 6. MANEJO DE ENTRADA (Eventos) =========================
// ====================================================================

function obtenerCeldaDesdeEvento(evento) {
    // Aseguramos que tomamos las coordenadas del toque si es un evento táctil
    const eventoDeCoordenadas = evento.touches ? evento.touches[0] : evento;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = eventoDeCoordenadas.clientX - rect.left; 
    const clickY = eventoDeCoordenadas.clientY - rect.top; 

    if (clickX < 0 || clickX >= CANVAS_SIZE || clickY < 0 || clickY >= CANVAS_SIZE) {
        return null; 
    }

    return {
        r: Math.floor(clickY / TAMAÑO_CELDA),
        c: Math.floor(clickX / TAMAÑO_CELDA)
    };
}

function iniciarArrastre(evento) {
    isMouseDown = true;
    
    if (evento.touches) {
        // Previene el scroll del navegador al inicio del toque
        evento.preventDefault(); 
    }
    
    const celdaClicada = obtenerCeldaDesdeEvento(evento.touches ? evento.touches[0] : evento);
    
    if (celdaClicada) {
        manejarInicioArrastre(celdaClicada);
        
        // Si se inició un color, procesamos el primer movimiento (clic)
        if (colorActivo) {
            manejarMovimientoArrastre(celdaClicada);
        }
    }
}

function moverArrastre(evento) {
    if (!isMouseDown) return; 

    if (evento.touches) {
        // ⭐ CORRECCIÓN TÁCTIL: Esto detiene el scroll de la página y soluciona el problema de sensibilidad.
        evento.preventDefault(); 
    }
    
    // A partir de aquí, solo procesamos si hay color activo (evita errores si se arrastra fuera del canvas)
    if (colorActivo === null) return; 
    
    const celdaActual = obtenerCeldaDesdeEvento(evento.touches ? evento.touches[0] : evento);
    manejarMovimientoArrastre(celdaActual);
}

function finalizarArrastre() {
    isMouseDown = false; 
    ultimaCeldaProcesada = null; 
    
    // ⭐ CORRECCIÓN DEL BUG DE BLOQUEO: NO ANULAMOS colorActivo.
    // Dejamos que el siguiente clic decida el color activo.
    // Esto previene que el juego se bloquee tras un arrastre incompleto.
    // colorActivo = null; // Línea eliminada
}

// Escuchadores de Eventos
canvas.addEventListener('mousedown', iniciarArrastre);
canvas.addEventListener('mousemove', moverArrastre);
canvas.addEventListener('mouseup', finalizarArrastre);
canvas.addEventListener('mouseleave', finalizarArrastre);

// Eventos Táctiles
canvas.addEventListener('touchstart', iniciarArrastre);
canvas.addEventListener('touchmove', moverArrastre);
canvas.addEventListener('touchend', finalizarArrastre);
canvas.addEventListener('touchcancel', finalizarArrastre);

// El reajuste ya no es necesario si el tamaño es fijo
window.addEventListener('resize', () => {
    actualizarCanvas();
});


// ====================================================================
// ========================= 7. PERSISTENCIA Y FLUJO DE NIVEL =========================
// ====================================================================

function guardarProgreso() {
    try {
        localStorage.setItem('flowFreeNivelActual', nivelActual.toString());
    } catch (e) {
        console.error("Error al guardar el progreso:", e);
    }
}

function cargarProgreso() {
    try {
        const nivelGuardado = localStorage.getItem('flowFreeNivelActual');
        if (nivelGuardado !== null) {
            const indice = parseInt(nivelGuardado, 10);
            if (!isNaN(indice) && indice >= 0 && indice < niveles.length) {
                return indice;
            }
        }
    } catch (e) {
        console.error("Error al cargar el progreso:", e);
    }
    return 0;
}

function comprobarVictoria() {
    const datosNivel = niveles[nivelActual];
    
    for (const par of datosNivel.puntos) {
        const camino = caminos[par.color];
        
        if (!camino || camino.length < 2) return false; 
        
        const ultimaCelda = camino[camino.length - 1];
        
        if (ultimaCelda.r !== par.fin.r || ultimaCelda.c !== par.fin.c) {
            return false; 
        }
    }
    return true; 
}

function pasarSiguienteNivel() {
    nivelActual++; 
    
    if (nivelActual >= niveles.length) {
        alert("¡FELICIDADES!🎉 .Has completado todos los niveles.");
        nivelActual = 0; 
    }
    
    guardarProgreso(); 
    
    if (infoElement) {
        infoElement.textContent = `Nivel: ${nivelActual + 1}`;
    }

    colorActivo = null; 
    
    iniciarJuego(); 
}

// ====================================================================
// ========================= 8. INICIO DEL JUEGO =========================
// ====================================================================

function iniciarJuego() {
    ajustarCanvas(); 
    
    nivelActual = cargarProgreso();
    if (infoElement) {
        infoElement.textContent = `Nivel: ${nivelActual + 1}`;
    }

    ultimaCeldaProcesada = null; 
    colorActivo = null; 
    inicializarCaminos(); 
    actualizarCanvas(); 
}

iniciarJuego();