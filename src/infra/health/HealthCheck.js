async function healthCheck(container) {
  return {
    status: 'ok',
    db: container.db.isConnected() ? 'up' : 'down',
    ws: container.wsClient?.isConnected() ? 'up' : 'down',
    discord: container.discordClient?.user ? 'up' : 'down'
  };
}

module.exports = { healthCheck };
