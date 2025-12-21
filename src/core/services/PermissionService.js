class PermissionService {
  constructor(permissionRepo, categoryPolicy = null) {
    this.permissionRepo = permissionRepo;
    this.categoryPolicy = categoryPolicy;
  }

  async canExecute(command, category = 'core') {
    if (this.categoryPolicy) {
      const decision = await this.categoryPolicy(category, command);
      if (decision === false) return false;
    }

    const allowed = await this.permissionRepo.isAllowed(command.name);
    if (!allowed) return false;

    const roles = await this.permissionRepo.getRoles(command.name);
    const channels = await this.permissionRepo.getChannels(command.name);
    const users = await this.permissionRepo.getUsers(command.name);

    const meta = command.metadata || {};
    const userId = command.userId;
    const channelId = command.channelId;
    const userRoles = meta.roles || [];

    if (users.length > 0 && userId && !users.includes(userId)) return false;
    if (channels.length > 0 && channelId && !channels.includes(channelId)) return false;
    if (roles.length > 0 && !userRoles.some(r => roles.includes(r))) return false;

    return true;
  }
}

module.exports = PermissionService;
