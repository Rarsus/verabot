# 14. Adding Commands

Step-by-step guide to creating new commands.

---

## Prerequisites

- Read [Command Architecture](./8-COMMAND-ARCHITECTURE.md)
- Understand [Best Practices](./12-BEST-PRACTICES.md)
- Familiarize with [Design Patterns](./10-DESIGN-PATTERNS.md)

---

## 1. Create Command File

Create `src/app/handlers/[category]/MyCommand.js`:

```javascript
const Command = require('../../../core/commands/Command');

class MyCommand extends Command {
  constructor() {
    super({
      name: 'mycommand',
      description: 'My command description',
      category: 'core',
    });
  }

  async execute(input) {
    // Command logic
    return new CommandResult(true, data, 'Success');
  }
}

module.exports = MyCommand;
```

---

## 2. Create Test File

Create `tests/unit/handlers/MyCommand.test.js`:

```javascript
const MyCommand = require('../../../src/app/handlers/category/MyCommand');

describe('MyCommand', () => {
  let command;

  beforeEach(() => {
    command = new MyCommand();
  });

  test('should execute successfully', async () => {
    const result = await command.execute({ data: 'test' });
    expect(result.isSuccess()).toBe(true);
  });
});
```

---

## 3. Register Command

Commands auto-register via `CommandRegistry`.

---

## 4. Add to Help Text

Update `help.json` with command description and examples.

---

## 5. Set Permissions

If needed, update `PermissionService` with permission requirements.

---

## 6. Run Tests

```bash
npm test
```

---

## 7. Verify in Discord

Test slash and prefix command versions.

---

**Previous:** [API Reference](./13-API-REFERENCE.md) | **Next:** [Testing](./15-TESTING.md)
