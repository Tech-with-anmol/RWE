use rusqlite::{Connection, Result};

pub struct Migration {
    pub version: u32,
    pub name: String,
    pub up_sql: String,
}

pub struct MigrationRunner {
    migrations: Vec<Migration>,
}

impl MigrationRunner {
    pub fn new() -> Self {
        let mut runner = Self {
            migrations: Vec::new(),
        };
        runner.add_initial_migrations();
        runner
    }

    fn add_initial_migrations(&mut self) {
        self.migrations.push(Migration {
            version: 1,
            name: "initial_schema".to_string(),
            up_sql: r#"
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    summary TEXT,
                    notes TEXT
                );

                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id INTEGER NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    seq INTEGER NOT NULL,
                    FOREIGN KEY(conversation_id) REFERENCES conversations(id)
                );

                CREATE TABLE IF NOT EXISTS mindmaps (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id INTEGER NOT NULL UNIQUE,
                    title TEXT NOT NULL,
                    nodes TEXT NOT NULL,
                    connections TEXT NOT NULL,
                    theme TEXT DEFAULT 'default',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(conversation_id) REFERENCES conversations(id)
                );

                CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
                CREATE INDEX IF NOT EXISTS idx_messages_seq ON messages(seq);
                CREATE INDEX IF NOT EXISTS idx_mindmaps_conversation ON mindmaps(conversation_id);
            "#.to_string(),
        });

        self.migrations.push(Migration {
            version: 2,
            name: "add_user_preferences".to_string(),
            up_sql: r#"
                CREATE TABLE IF NOT EXISTS user_preferences (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE NOT NULL,
                    value TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                INSERT OR IGNORE INTO user_preferences (key, value) VALUES ('theme', 'system');
                INSERT OR IGNORE INTO user_preferences (key, value) VALUES ('app_version', '1.0.0');
            "#.to_string(),
        });
    }

    pub fn setup_migration_table(&self, conn: &Connection) -> Result<()> {
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            "#,
            [],
        )?;
        Ok(())
    }

    pub fn get_current_version(&self, conn: &Connection) -> Result<u32> {
        match conn.query_row(
            "SELECT MAX(version) FROM schema_migrations",
            [],
            |row| row.get::<_, Option<u32>>(0),
        ) {
            Ok(Some(version)) => Ok(version),
            Ok(None) => Ok(0),
            Err(_) => Ok(0),
        }
    }

    pub fn run_migrations(&self, conn: &Connection) -> Result<()> {
        self.setup_migration_table(conn)?;
        let current_version = self.get_current_version(conn)?;

        for migration in &self.migrations {
            if migration.version > current_version {
                println!("Running migration {}: {}", migration.version, migration.name);
                
                conn.execute_batch(&migration.up_sql)?;
                
                conn.execute(
                    "INSERT INTO schema_migrations (version, name) VALUES (?1, ?2)",
                    [&migration.version.to_string(), &migration.name],
                )?;
                
                println!("Migration {} completed", migration.version);
            }
        }

        Ok(())
    }
}
