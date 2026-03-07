/**
 * apiFetch — drop-in replacement for fetch() that automatically injects
 * the X-Restaurant-ID header from the currently logged-in user session.
 *
 * Usage:  import apiFetch from '../utils/apiFetch'
 *         const res = await apiFetch('/orders/active')
 */
export default function apiFetch(endpoint, options = {}) {
    let restaurantId = null
    try {
        const user = JSON.parse(sessionStorage.getItem('pp_user') || 'null')
        restaurantId = user?.restaurant_id ?? null
    } catch { /* ignore */ }

    const headers = {
        ...(options.headers || {}),
        ...(restaurantId ? { 'X-Restaurant-ID': restaurantId } : {}),
    }

    // Use environment variable if deployed, otherwise fallback to relative (which uses vite proxy)
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    const url = `${baseUrl}${endpoint}`

    return fetch(url, { ...options, headers })
}
