.PHONY: setup build up down test lint migrate seed-db

setup:
	cp .env.example .env
	pip install -r backend/requirements.txt
	cd frontend && npm install

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

test:
	pytest backend/tests/

lint:
	black backend/
	flake8 backend/

migrate:
	cd backend && alembic upgrade head

seed-db:
	python backend/scripts/seed.py
