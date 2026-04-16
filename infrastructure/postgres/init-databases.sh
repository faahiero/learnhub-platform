#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE learnhub_identity;
    CREATE DATABASE learnhub_courses;
    CREATE DATABASE learnhub_enrollments;
EOSQL
