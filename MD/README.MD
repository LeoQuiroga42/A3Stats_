# Arma & Reforger Stats Platform

Plataforma Web integral para la recolección, procesamiento y visualización de estadísticas de servidores de simulación militar, soportando nativamente **Arma 3** (motor Real Virtuality) y **Arma Reforger** (motor Enfusion).

## 📖 Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Requisitos Previos](#requisitos-previos)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Estándares de Desarrollo](#estándares-de-desarrollo)
7. [Licencia](#licencia)

## 🎯 Descripción General
El objetivo de esta plataforma es unificar los datos generados por sesiones y campañas de juego en ambos simuladores. Permite analizar métricas como tiempo de juego, K/D ratio, precisión, roles desempeñados y uso de vehículos, traduciendo logs de servidor crudos (o datos de API) en un dashboard interactivo.

## 🏗 Arquitectura del Sistema
El sistema se divide en tres capas principales:
- **Core Parsers:** Scripts dedicados a interpretar los formatos de datos divergentes entre el motor RV (Arma 3) y Enfusion (Arma Reforger).
- **Backend / API:** Encargado de la lógica de negocio, validación de datos y almacenamiento en base de datos.
- **Frontend / Dashboard:** Interfaz de usuario para la visualización de las estadísticas.

## ⚙️ Requisitos Previos
* [Motor de Base de Datos - Ej: PostgreSQL/MongoDB] vX.X+
* [Entorno de ejecución Backend - Ej: Node.js/Python] vX.X+
* [Gestor de paquetes - Ej: npm/yarn/pip]
* Docker y Docker Compose (Opcional, pero recomendado para despliegues aislados).

## 🚀 Instalación y Configuración
1. Clona este repositorio:
   ```bash
   git clone https://github.com/LeoQuiroga42/A3Stats
   ```
2. Instala dependencias para Backend y Frontend según corresponda en sus directorios.
3. Configura las variables de entorno basándote en un archivo `.env.example`.
4. Inicia los servicios.

## 📁 Estructura del Proyecto
El código sigue una estricta separación de responsabilidades:
* `/frontend`: Aplicación web (UI).
* `/backend`: API REST/GraphQL y lógica central.
* `/core`: Scripts y parsers dedicados en común entre A3 y Reforger.
* `/docs`: Todos los diagramas y documentación técnica.
* `/deploy`: Dockerfiles, CI/CD y utilidades para su despliegue en producción.

## 🛠 Estándares de Desarrollo
- Clean Code y principios SOLID en todo momento.
- Todo desarrollo nuevo debe actualizar `CHANGELOG.md` siguiendo el esquema semántico de versiones (SemVer).
- Comentarios y documentaciones rigurosamente en Español.

## 📄 Licencia
Este proyecto es de uso privado o está regido bajo la licencia acordada por el autor original (LeoQuiroga42).