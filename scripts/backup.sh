#!/bin/bash

# Configuration
PROJECT_DIR="/home/opc/projects/milkontrol"
BACKUP_DIR="/home/opc/backups/milkontrol"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Extract DATABASE_URL from .env
DB_URL=$(grep DATABASE_URL "$PROJECT_DIR/.env" | cut -d '"' -f 2)

# Dump the database and compress
echo "Starting backup to $BACKUP_FILE..."
pg_dump "$DB_URL" | gzip > "$BACKUP_FILE"

# Check if dump was successful
if [ $? -eq 0 ]; then
  echo "Backup completed successfully."
else
  echo "Error during backup."
  exit 1
fi

# Rotate backups: Keep only the 7 most recent backups to save disk space
echo "Rotating backups (keeping last 7 days)..."
ls -tp "$BACKUP_DIR"/backup_*.sql.gz | grep -v '/$' | tail -n +8 | xargs -I {} rm -- {}

echo "Done."
