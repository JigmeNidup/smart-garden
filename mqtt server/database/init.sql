CREATE ROLE smart_garden_admin WITH
	LOGIN
	SUPERUSER
	CREATEDB
	CREATEROLE
	INHERIT
	NOREPLICATION
	CONNECTION LIMIT -1
	PASSWORD 'admin';

CREATE DATABASE smart_garden_db
    WITH
    OWNER = smart_garden_admin
    ENCODING = 'UTF8'
    LOCALE_PROVIDER = 'libc'
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

CREATE TABLE sensor_readings (
    id SERIAL PRIMARY KEY,
    temperature FLOAT,
    humidity FLOAT,
    light FLOAT,
    soil_moisture FLOAT,
    rainfall FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sensor_readings_created_at ON sensor_readings(created_at);

ALTER TABLE IF EXISTS public.sensor_readings
    OWNER TO smart_garden_admin;