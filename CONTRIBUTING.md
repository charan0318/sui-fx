# 🤝 Contributing to SUI-FX

<p align="center">
  <img src="https://img.shields.io/badge/Contributors-Welcome-brightgreen?style=for-the-badge" alt="Contributors Welcome"/>
  <img src="https://img.shields.io/badge/Code_of_Conduct-Enforced-blue?style=for-the-badge" alt="Code of Conduct"/>
  <img src="https://img.shields.io/badge/Help_Wanted-Good_First_Issues-yellow?style=for-the-badge" alt="Help Wanted"/>
</p>

**We love contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or helping with design, every contribution makes SUI-FX better.**

---

## 🚀 Quick Start for Contributors

### 1. Fork & Clone
```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/your-username/sui-fx.git
cd sui-fx

# Add the original repository as upstream
git remote add upstream https://github.com/charan0318/sui-fx.git
```

### 2. Set Up Development Environment
```bash
# Install dependencies
npm install

# Copy environment template
cd packages/backend
cp .env.example .env
# Edit .env with your development settings

# Start development servers
cd ../..
npm run dev
```

### 3. Create Feature Branch
```bash
# Keep your main branch up to date
git checkout main
git pull upstream main

# Create a new feature branch
git checkout -b feature/amazing-feature
```

### 4. Make Your Changes
- Write clean, tested code
- Follow our coding standards
- Update documentation as needed
- Add tests for new features

### 5. Submit Pull Request
```bash
# Commit your changes
git add .
git commit -m "feat: add amazing feature"

# Push to your fork
git push origin feature/amazing-feature

# Open a pull request on GitHub
```

---

## 📝 Types of Contributions

### 🐛 Bug Reports
Help us identify and fix issues:
- Check [existing issues](https://github.com/charan0318/sui-fx/issues) first
- Use our bug report template
- Include steps to reproduce
- Provide environment details
- Add screenshots or logs if helpful

### ✨ Feature Requests
Suggest new features or improvements:
- Open a [discussion](https://github.com/charan0318/sui-fx/discussions) first
- Describe the problem you're solving
- Explain your proposed solution
- Wait for community feedback before implementing

### 🔧 Code Contributions
Submit code improvements:
- Bug fixes
- New features
- Performance improvements
- Code refactoring
- Test coverage improvements

### 📚 Documentation
Help improve our docs:
- Fix typos and grammar
- Add missing documentation
- Improve examples
- Create tutorials
- Translate to other languages

### 🎨 Design & UX
Improve user experience:
- UI/UX improvements
- Design system components
- Accessibility enhancements
- Mobile responsiveness

---

## 📋 Development Standards

### 🏗️ Code Style
We use automated tools to maintain consistent code style:

```bash
# Linting
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues

# Formatting
npm run format        # Format with Prettier
npm run format:check  # Check formatting

# Type checking
npm run type-check    # TypeScript validation
```

**Key Standards:**
- **TypeScript** for all new code
- **ESLint + Prettier** for consistent formatting
- **Conventional Commits** for commit messages
- **Camel case** for variables and functions
- **Pascal case** for classes and components

### 🧪 Testing Requirements
All contributions should include appropriate tests:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:backend
npm run test:frontend
npm run test:integration

# Generate coverage report
npm run test:coverage
```

**Testing Guidelines:**
- **Unit tests** for business logic
- **Integration tests** for API endpoints
- **E2E tests** for critical user flows
- **Minimum 80% coverage** for new features
- **Test edge cases** and error conditions

### 📝 Commit Message Format
We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat(api): add rate limiting for faucet requests
fix(ui): resolve mobile responsiveness issue
docs(readme): update installation instructions
test(backend): add unit tests for sui service
```

---

## 🔄 Pull Request Process

### Before Submitting
- [ ] Code follows our style guidelines
- [ ] All tests pass locally
- [ ] New features include tests
- [ ] Documentation is updated
- [ ] Commit messages follow conventional format
- [ ] No merge conflicts with main branch

### Pull Request Template
When creating a PR, please:
1. **Use our PR template** (auto-populated)
2. **Provide clear description** of changes
3. **Link related issues** using keywords like "Fixes #123"
4. **Add screenshots** for UI changes
5. **Request review** from relevant maintainers

### Review Process
1. **Automated checks** run on all PRs
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Documentation review** if applicable
5. **Approval and merge** by maintainers

---

## 🏷️ Issue Labels

We use labels to organize and prioritize work:

### Priority
- `priority: critical` - Security issues, major bugs
- `priority: high` - Important features, significant bugs
- `priority: medium` - Standard features and improvements
- `priority: low` - Nice-to-have features, minor issues

### Type
- `type: bug` - Something isn't working
- `type: feature` - New feature request
- `type: enhancement` - Improvement to existing feature
- `type: documentation` - Documentation updates
- `type: question` - General questions

### Status
- `status: needs-triage` - Needs initial review
- `status: in-progress` - Currently being worked on
- `status: needs-review` - Ready for review
- `status: blocked` - Blocked by external dependency

### Difficulty
- `good first issue` - Good for newcomers
- `difficulty: easy` - Simple changes
- `difficulty: medium` - Moderate complexity
- `difficulty: hard` - Complex changes requiring deep knowledge

---

## 🛡️ Security Contributions

### Reporting Security Issues
For security vulnerabilities:
- **Do NOT** create public issues
- **Email** security@yourdomain.com privately
- **Include** detailed description and steps to reproduce
- **Wait** for response before public disclosure

### Security Guidelines
When contributing:
- Never commit secrets or private keys
- Follow secure coding practices
- Validate all user inputs
- Use parameterized queries
- Implement proper authentication
- Follow principle of least privilege

---

## 👥 Community Guidelines

### Code of Conduct
We are committed to providing a welcoming and inclusive experience for everyone. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

### Communication Channels
- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and ideas
- **Discord** - Real-time community chat
- **Email** - Private or sensitive matters

### Getting Help
New to contributing? We're here to help!
- Look for `good first issue` labels
- Ask questions in discussions
- Join our Discord community
- Read our documentation thoroughly

---

## 🏆 Recognition

### Contributors
All contributors are recognized in:
- **README.md** contributors section
- **GitHub contributors** page
- **Release notes** for significant contributions
- **Hall of Fame** for long-term contributors

### Maintainer Path
Regular contributors may be invited to become maintainers with:
- Code review privileges
- Merge permissions
- Triage responsibilities
- Release management participation

---

## 📞 Need Help?

### Resources
- **[README.md](../README.md)** - Project overview and setup
- **[API Documentation](../API_DOCUMENTATION.md)** - Complete API reference
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production deployment
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues

### Contact
- **GitHub Issues** - Technical questions
- **GitHub Discussions** - Ideas and general questions
- **Discord** - Real-time community support
- **Email** - Private or sensitive matters

---

<p align="center">
  <strong>Thank you for contributing to SUI-FX! 🚀</strong>
</p>

<p align="center">
  <a href="https://github.com/charan0318/sui-fx/issues">Report Issues</a> •
  <a href="https://github.com/charan0318/sui-fx/discussions">Discussions</a> •
  <a href="https://discord.gg/your-server">Discord Community</a>
</p>
