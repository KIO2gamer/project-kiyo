# Design Document

## Overview

The Discord bot cleanup will systematically remove unnecessary features, unused dependencies, and redundant code while preserving the existing command structure. The cleanup will focus on reducing the bot's footprint, improving maintainability, and ensuring all remaining features are functional and well-organized.

## Architecture

### Cleanup Strategy

The cleanup will follow a layered approach:

1. **Dependency Analysis Layer** - Identify and remove unused npm packages
2. **Command Analysis Layer** - Evaluate command necessity and functionality
3. **Database Cleanup Layer** - Remove unused schemas and models
4. **Utility Consolidation Layer** - Merge redundant utility functions
5. **Configuration Cleanup Layer** - Streamline environment variables and configs

### Preservation Principles

-   Maintain the existing folder structure in `src/commands/`
-   Keep the command loading mechanism intact
-   Preserve all functional and commonly used commands
-   Maintain database connections for active features

## Components and Interfaces

### 1. Dependency Analyzer

**Purpose:** Identify unused npm packages in package.json

**Implementation:**

-   Parse all JavaScript files to extract `require()` and `import` statements
-   Cross-reference with package.json dependencies
-   Generate removal list for unused packages

**Key Dependencies to Evaluate:**

-   `@discordjs/opus` and `@discordjs/voice` - Only needed if music commands are kept
-   `@google/generative-ai` - Only needed if AI commands are functional
-   `@iamtraction/google-translate` - Check if translation commands work
-   `ytdl-core`, `play-dl` - Music-related dependencies
-   `mathjs` - Only needed for calculator functionality
-   `he` - HTML entity decoding, check usage
-   `jsonwebtoken` - OAuth functionality
-   `googleapis` - YouTube API integration

### 2. Command Evaluator

**Purpose:** Assess command necessity and functionality

**Evaluation Criteria:**

-   **Keep:** Essential moderation, utility, and information commands
-   **Review:** Fun commands with minimal value or broken functionality
-   **Remove:** Commands requiring missing API keys or deprecated services

**Commands to Potentially Remove:**

-   Overly specific fun commands (e.g., "do_not_touch", "skibidi")
-   Commands requiring external APIs without proper error handling
-   Development/testing commands in production

### 3. Database Schema Cleaner

**Purpose:** Remove unused database models and schemas

**Analysis Approach:**

-   Scan all command files for database model imports
-   Identify schemas not referenced in any commands or events
-   Remove unused schema files

**Schemas to Evaluate:**

-   `OauthCode.js` - OAuth functionality usage
-   `ChatHistory.js` - AI chat history storage
-   `ReactionRole.js` - Reaction role functionality
-   `xp_data.js` - XP/leveling system usage

### 4. Utility Consolidator

**Purpose:** Merge redundant utility functions

**Consolidation Targets:**

-   Error handling patterns
-   Permission checking logic
-   String formatting functions
-   Logging utilities

### 5. Configuration Streamliner

**Purpose:** Clean up environment variables and configuration

**Actions:**

-   Remove unused environment variables from .env.example
-   Simplify bot configuration object
-   Update documentation for required vs optional configs

## Data Models

### Cleanup Report Model

```javascript
{
  removedDependencies: [String],
  removedCommands: [String],
  removedSchemas: [String],
  consolidatedUtils: [String],
  cleanedConfigs: [String],
  estimatedSizeReduction: Number,
  functionalityImpact: String
}
```

### Command Analysis Model

```javascript
{
  commandName: String,
  category: String,
  dependencies: [String],
  apiRequirements: [String],
  usageComplexity: String, // 'low', 'medium', 'high'
  recommendation: String // 'keep', 'modify', 'remove'
}
```

## Error Handling

### Dependency Removal Safety

-   Verify no imports exist before removing packages
-   Test bot startup after each dependency removal
-   Maintain rollback capability

### Command Removal Safety

-   Ensure command loader doesn't break with missing files
-   Preserve folder structure even if folders become empty
-   Update help command to reflect removed commands

### Database Schema Safety

-   Check for foreign key relationships before removal
-   Ensure no events or commands reference removed schemas
-   Maintain database connection stability

## Testing Strategy

### Pre-Cleanup Testing

1. Document current bot functionality
2. Test all commands to identify already broken features
3. Record current dependency tree and bundle size

### During Cleanup Testing

1. Test bot startup after each major change
2. Verify command loading mechanism remains functional
3. Test database connections after schema changes

### Post-Cleanup Testing

1. Comprehensive command testing
2. Performance comparison (startup time, memory usage)
3. Functionality verification for all retained features

### Test Categories

-   **Unit Tests:** Individual command functionality
-   **Integration Tests:** Database connections and API integrations
-   **System Tests:** Full bot startup and command registration
-   **Performance Tests:** Memory usage and response times

## Implementation Phases

### Phase 1: Analysis and Documentation

-   Generate dependency usage report
-   Create command functionality matrix
-   Document current bot capabilities

### Phase 2: Safe Removals

-   Remove clearly unused dependencies
-   Remove broken or non-functional commands
-   Clean up development artifacts

### Phase 3: Consolidation

-   Merge redundant utility functions
-   Streamline configuration files
-   Update documentation

### Phase 4: Optimization

-   Final dependency cleanup
-   Code formatting and linting
-   Performance verification

## Success Metrics

-   **Size Reduction:** Target 20-30% reduction in node_modules size
-   **Startup Performance:** Maintain or improve bot startup time
-   **Maintainability:** Reduce code complexity and duplication
-   **Functionality:** Preserve all essential bot features
-   **Documentation:** Clear documentation of remaining features
