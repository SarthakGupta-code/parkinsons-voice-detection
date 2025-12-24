# Contributing to PD-Voice-Detect

Thank you for your interest in contributing to PD-Voice-Detect! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in the Issues section
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node/Python versions)
   - Screenshots if applicable

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Proposed implementation approach (if any)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow the coding standards
   - Write/update tests
   - Update documentation
4. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```
   Use [Conventional Commits](https://www.conventionalcommits.org/) format
5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Create a Pull Request**
   - Provide clear description
   - Reference related issues
   - Request review from maintainers

## Coding Standards

### JavaScript/TypeScript

- Use ESLint and Prettier (configured in project)
- Follow Airbnb style guide
- Use TypeScript for type safety
- Write JSDoc comments for functions
- Maximum line length: 100 characters

### Python

- Follow PEP 8 style guide
- Use type hints
- Write docstrings for functions/classes
- Maximum line length: 100 characters
- Use Black for formatting

### Git Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding/updating tests
- `chore:` Maintenance tasks

Example:
```
feat(auth): add OAuth 2.0 social login support
```

## Development Setup

See [README.md](README.md) for detailed setup instructions.

### Quick Start

1. Clone the repository
2. Install dependencies for each service
3. Set up environment variables
4. Run database migrations
5. Start development servers

## Testing

- Write tests for all new features
- Maintain 80%+ code coverage
- Run tests before submitting PR
- Ensure all CI checks pass

## Documentation

- Update README.md if needed
- Add JSDoc/Python docstrings
- Update API documentation
- Add examples for new features

## Questions?

Feel free to open an issue with the `question` label or contact the maintainers.

Thank you for contributing! 🎉

