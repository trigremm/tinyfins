# Makefile
include makefile_docker_compose.mk

PORT ?= 8000

.PHONY: help run

help:
	@echo "tinyfins — детский аквариум"
	@echo "  make run       локальный сервер без докера: http://localhost:$(PORT)"
	@echo "  make d(eploy)  git pull + пересборка контейнера"
	@echo "  make r         recreate: build + stop + up (контейнер на 127.0.0.1:8140)"
	@echo "  make l(ogs)    логи контейнера"

run:
	@echo "Аквариум: http://localhost:$(PORT)  (Ctrl+C — остановить)"
	python3 -m http.server $(PORT)
