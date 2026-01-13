-- Script SQL pour initialiser la base de données
-- Exécutez ce script dans MySQL pour créer la base de données

CREATE DATABASE IF NOT EXISTS Bcancer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE Bcancer;

-- La table users sera créée automatiquement par l'application au démarrage
-- Mais vous pouvez aussi la créer manuellement avec cette commande:

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

