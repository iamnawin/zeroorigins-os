```markdown
# zeroorigins-os Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `zeroorigins-os` TypeScript codebase. You'll learn how to structure files, write imports and exports, and follow the project's testing and commit conventions. While no specific frameworks or automated workflows are detected, the repository emphasizes consistency in naming, modular code organization, and clear testing practices.

## Coding Conventions

### File Naming
- Use **kebab-case** for all filenames.
  - **Example:**  
    `user-service.ts`  
    `api-handler.test.ts`

### Import Style
- Use **alias imports** for modules.
  - **Example:**
    ```typescript
    import userService from '@services/user-service';
    ```

### Export Style
- Use **default exports** for modules.
  - **Example:**
    ```typescript
    const userService = { /* ... */ };
    export default userService;
    ```

### Commit Patterns
- Commit messages are **freeform** with no strict prefix requirement.
- Average commit message length: **~55 characters**.
  - **Example:**  
    `Fix user authentication bug in login handler`

## Workflows

_No automated workflows detected in this repository._  
You are encouraged to follow the coding and testing patterns described below.

## Testing Patterns

- **Test files** use the `*.test.*` naming pattern.
  - **Example:**  
    `user-service.test.ts`
- **Testing framework** is not explicitly specified; inspect existing test files for style and structure.
- Place tests alongside or near the modules they cover.

  **Example test file structure:**
  ```typescript
  import userService from './user-service';

  describe('userService', () => {
    it('should return user data', () => {
      // test implementation
    });
  });
  ```

## Commands
| Command         | Purpose                                  |
|-----------------|------------------------------------------|
| /conventions    | Show coding conventions and examples      |
| /test-patterns  | Show how to write and organize tests      |
| /overview       | Show summary of repository patterns       |
```
