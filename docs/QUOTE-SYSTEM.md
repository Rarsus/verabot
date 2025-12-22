# Quote System Implementation

This document describes the quote system implementation ported from verabot2.0 to verabot.

## Overview

The quote system allows users to store, retrieve, and search quotes through Discord commands. The implementation follows the verabot architecture patterns with clean separation of concerns.

## Architecture

### Database Layer

- **Table:** `quotes`
  - `id` - Auto-incrementing primary key
  - `text` - Quote text (required)
  - `author` - Quote author (defaults to "Anonymous")
  - `added_by` - User ID who added the quote
  - `added_at` - Timestamp when quote was added
  - `created_at` - Database record creation timestamp

### Repository Layer

**QuoteRepository** (`src/infra/db/Repositories.js`)

Provides data access methods:

- `add(text, author, addedBy)` - Add a new quote
- `getAll()` - Get all quotes
- `getById(id)` - Get quote by ID
- `getRandom()` - Get a random quote
- `search(query)` - Search quotes by text or author
- `count()` - Get total quote count

### Service Layer

**QuoteService** (`src/core/services/QuoteService.js`)

Handles business logic:

- Input validation (text length, author length)
- Data sanitization (trimming whitespace)
- Error handling
- Delegates data operations to repository

### Handler Layer

Located in `src/app/handlers/quotes/`:

- **AddQuoteHandler** - Add new quotes
- **QuoteHandler** - Retrieve quote by ID
- **RandomQuoteHandler** - Get random quote
- **ListQuotesHandler** - List all quotes
- **SearchQuotesHandler** - Search quotes

Each handler:

- Validates command parameters
- Calls the appropriate service method
- Returns CommandResult (success/failure)

## Commands

All commands are registered under the `/quote` command group:

- `/quote addquote text:<quote> [author:<name>]` - Add a new quote
- `/quote quote id:<number>` - Get quote by ID
- `/quote randomquote` - Get a random quote
- `/quote listquotes` - List all quotes
- `/quote searchquotes query:<search>` - Search quotes

## Testing

Comprehensive unit tests are provided:

- `tests/unit/services/QuoteService.test.js` - Service layer tests
- `tests/unit/handlers/quotes/AddQuoteHandler.test.js` - Add quote handler tests
- `tests/unit/handlers/quotes/RandomQuoteHandler.test.js` - Random quote handler tests

## Integration

The quote system is fully integrated into the verabot bootstrap process:

1. QuoteRepository is created in `createRepositories()`
2. QuoteService is instantiated in `bootstrap()`
3. All handlers are registered in the CommandRegistry
4. Commands are available through Discord slash commands

## Differences from verabot2.0

While inspired by verabot2.0, the implementation has been adapted to fit verabot's architecture:

1. Uses better-sqlite3 (synchronous) instead of sqlite3 (callback-based)
2. Follows verabot's handler/service/repository pattern
3. Uses CommandResult for standardized responses
4. Integrates with verabot's command registry and middleware pipeline
5. Uses verabot's dependency injection container

## Future Enhancements

Potential improvements:

- Quote editing and deletion
- Quote categories/tags
- Quote ratings
- Export functionality (JSON/CSV)
- Quote of the day feature
- User quote statistics
