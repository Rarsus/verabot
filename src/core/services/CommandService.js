class CommandService {
  constructor(commandRepo) {
    this.commandRepo = commandRepo;
  }

  async isAllowed(commandName) {
    return this.commandRepo.isAllowed(commandName);
  }

  async listAllowed() {
    return this.commandRepo.listAllowed();
  }

  async addAllowed(commandName, addedBy) {
    return this.commandRepo.addAllowed(commandName, addedBy);
  }

  async removeAllowed(commandName) {
    return this.commandRepo.removeAllowed(commandName);
  }
}

module.exports = CommandService;
