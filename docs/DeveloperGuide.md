# Developer Guide & Guidelines

## Codebase Standards
- **Python**: Follow PEP 8 guidelines. Format files with Black and lint with Flake8.
- **TypeScript**: Strictly type variables and functions. Avoid the `any` type where possible. Follow Eslint and Prettier formatting styles.

## Backend Stack Setup
1. Create a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Set environment variables in `.env` and start PostgreSQL/Redis.
4. Run tests:
   ```bash
   pytest backend/tests/
   ```

## Frontend Stack Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start Next.js development server:
   ```bash
   npm run dev
   ```
