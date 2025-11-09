/**
 * @function formatDateToBogota
 * @description Converts a UTC date to Bogotá (Colombia) local time in ISO-like format (YYYY-MM-DDTHH:mm:ss).
 * @param {Date} date - Date object in UTC.
 * @returns {string} Date formatted to Bogotá local time.
 */
export function formatDateToBogota(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return 'Invalid date'
    }

    return date.toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })
}

