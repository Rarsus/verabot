/**
 * Perform health check of all critical system components
 * Checks database, WebSocket, and Discord client connectivity
 * @param {Object} container - Dependency injection container with db, wsClient, discordClient
 * @returns {Promise<Object>} Health status object
 * @returns {string} returns.status - Overall status (always 'ok' if function succeeds)
 * @returns {string} returns.db - Database status ('up' if connected, 'down' otherwise)
 * @returns {string} returns.ws - WebSocket status ('up' if connected, 'down' otherwise)
 * @returns {string} returns.discord - Discord client status ('up' if user logged in, 'down' otherwise)
 * @example
 * const health = await healthCheck(container);
 * // Returns: { status: 'ok', db: 'up', ws: 'up', discord: 'up' }
 * if (health.db === 'down') console.log('Database connection lost');
 */
async function healthCheck(container) {
  return {
    status: 'ok',
    db: container.db.isConnected() ? 'up' : 'down',
    ws: container.wsClient?.isConnected() ? 'up' : 'down',
    discord: container.discordClient?.user ? 'up' : 'down'
  };
}

module.exports = { healthCheck };
