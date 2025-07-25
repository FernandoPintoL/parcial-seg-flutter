// Socket configuration utility
// This file provides functions to get the appropriate socket URL based on the environment

// Default socket URLs
const SOCKET_PROD_URL = 'https://socketserverfpl.up.railway.app';
const SOCKET_LOCAL_URL = 'http://localhost:4000';

// Socket connection options
const socketOptions = {
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    transports: ['websocket', 'polling']
};

/**
 * Get the socket URL based on the environment
 * @param useLocal Force using local socket server
 * @returns Socket URL and options
 */
export function getSocketConfig(useLocal = false) {
    // Check if environment variables are defined
    const envLocalSocketUrl = import.meta.env.VITE_SOCKET_URL_LOCAL;
    const envOnlineSocketUrl = import.meta.env.VITE_SOCKET_URL_ONLINE;
    const envUseLocalSocket = import.meta.env.VITE_USE_LOCAL_SOCKET === 'true';

    // Determine which socket URL to use
    let socketUrl;

    if (useLocal || envUseLocalSocket) {
        // Use local socket server if explicitly requested
        socketUrl = envLocalSocketUrl || SOCKET_LOCAL_URL;
    } else {
        // Otherwise use production socket server
        socketUrl = envOnlineSocketUrl || SOCKET_PROD_URL;
    }

    console.log(`Using socket URL: ${socketUrl}, local: ${useLocal || envUseLocalSocket}`);

    return {
        url: socketUrl,
        options: socketOptions
    };
}

/**
 * Toggle between local and production socket servers
 * @param currentlyUsingLocal Whether currently using local socket
 * @returns New socket configuration
 */
export function toggleSocketEnvironment(currentlyUsingLocal : any) {
    return getSocketConfig(!currentlyUsingLocal);
}
