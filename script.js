// Inicializar datos desde localStorage
let availabilities = JSON.parse(localStorage.getItem('availabilities')) || [];
let confirmedUsers = JSON.parse(localStorage.getItem('confirmedUsers')) || [];
let nextMissionTime = localStorage.getItem('nextMissionTime') || null;

// Inicializar la página
document.addEventListener('DOMContentLoaded', () => {
    updateScheduleTable();
    updateCountdown();
    updateConfirmedUsers();
});

// Enviar disponibilidad
function submitAvailability() {
    const name = document.getElementById('name').value.trim();
    const timezone = document.getElementById('timezone').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;

    if (!name || !timezone || !startTime || !endTime) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    if (startTime >= endTime) {
        alert('La hora de fin debe ser posterior a la hora de inicio.');
        return;
    }

    // Convertir horas locales a UTC para comparación
    const user = {
        name,
        timezone,
        startTime,
        endTime
    };

    availabilities = availabilities.filter(a => a.name !== name); // Actualizar si el usuario ya existe
    availabilities.push(user);
    localStorage.setItem('availabilities', JSON.stringify(availabilities));

    alert('Disponibilidad enviada correctamente.');
    document.getElementById('name').value = '';
    document.getElementById('timezone').value = '';
    document.getElementById('start-time').value = '';
    document.getElementById('end-time').value = '';

    updateScheduleTable();
    suggestNextMission();
}

// Actualizar tabla de horarios
function updateScheduleTable() {
    const table = document.getElementById('schedule-table');
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');

    // Limpiar tabla
    thead.innerHTML = '<th>Hora (UTC)</th>';
    tbody.innerHTML = '';

    // Añadir nombres a la cabecera
    availabilities.forEach(user => {
        const th = document.createElement('th');
        th.textContent = user.name;
        thead.appendChild(th);
    });

    // Crear filas para las próximas 24 horas
    const now = new Date();
    for (let i = 0; i < 24; i++) {
        const hour = new Date(now.getTime() + i * 60 * 60 * 1000);
        const hourStr = hour.toISOString().slice(11, 16); // Ej. 14:00
        const tr = document.createElement('tr');
        const tdHour = document.createElement('td');
        tdHour.textContent = hourStr;
        tr.appendChild(tdHour);

        availabilities.forEach(user => {
            const td = document.createElement('td');
            if (isAvailable(user, hour)) {
                td.classList.add('available');
                td.textContent = '✓';
            } else {
                td.textContent = '-';
            }
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    }
}

// Verificar si un usuario está disponible en una hora específica
function isAvailable(user, hour) {
    // Convertir hora local del usuario a UTC
    const offset = parseTimezoneOffset(user.timezone);
    const start = parseTime(user.startTime, offset);
    const end = parseTime(user.endTime, offset);
    const checkTime = hour.getUTCHours() * 60 + hour.getUTCMinutes();

    return checkTime >= start && checkTime < end;
}

// Parsear offset de zona horaria (ej. UTC+01:00 -> 1)
function parseTimezoneOffset(timezone) {
    const match = timezone.match(/UTC([+-])(\d{2}):(\d{2})/);
    if (!match) return 0;
    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2]);
    const minutes = parseInt(match[3]);
    return sign * (hours * 60 + minutes);
}

// Convertir hora local a minutos en UTC
function parseTime(time, offset) {
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes - offset;
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;
    return totalMinutes;
}

// Sugerir próxima misión
function suggestNextMission() {
    const now = new Date();
    let bestTime = null;
    let maxAvailable = 0;

    for (let i = 0; i < 24; i++) {
        const hour = new Date(now.getTime() + i * 60 * 60 * 1000);
        let count = 0;
        availabilities.forEach(user => {
            if (isAvailable(user, hour)) count++;
        });
        if (count > maxAvailable) {
            maxAvailable = count;
            bestTime = hour;
        }
    }

    if (bestTime) {
        nextMissionTime = bestTime.toISOString();
        localStorage.setItem('nextMissionTime', nextMissionTime);
        updateCountdown();
    }
}

// Actualizar temporizador
function updateCountdown() {
    if (!nextMissionTime) return;

    const countdownElement = document.getElementById('countdown');
    const missionTime = new Date(nextMissionTime);
    const interval = setInterval(() => {
        const now = new Date();
        const diff = missionTime - now;

        if (diff <= 0) {
            countdownElement.textContent = '¡La misión ha comenzado!';
            clearInterval(interval);
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        countdownElement.textContent = `Próxima misión en ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

// Confirmar participación
function confirmParticipation() {
    const name = prompt('Ingresa tu nombre para confirmar:');
    if (!name) return;

    if (!availabilities.some(a => a.name === name)) {
        alert('No estás registrado. Ingresa tu disponibilidad primero.');
        return;
    }

    if (!confirmedUsers.includes(name)) {
        confirmedUsers.push(name);
        localStorage.setItem('confirmedUsers', JSON.stringify(confirmedUsers));
        updateConfirmedUsers();
        alert('Participación confirmada.');
    } else {
        alert('Ya has confirmado tu participación.');
    }
}

// Actualizar lista de usuarios confirmados
function updateConfirmedUsers() {
    const confirmedElement = document.getElementById('confirmed-users');
    if (confirmedUsers.length === 0) {
        confirmedElement.textContent = 'Usuarios confirmados: Ninguno';
    } else {
        confirmedElement.textContent = `Usuarios confirmados: ${confirmedUsers.join(', ')}`;
    }
}
