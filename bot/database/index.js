import dotenv from 'dotenv';
dotenv.config();

const DB_TYPE = process.env.DB_TYPE || 'file';

let database;

export default async function getDatabase() {
  if (!database) {
    switch (DB_TYPE) {
      case 'file': {
        const { default: SQLiteDatabase } = await import('./sqlite.js');
        database = new SQLiteDatabase();
        break;
      }
      case 'mongodb': {
        const { default: MongoDatabase } = await import('./mongodb.js');
        database = new MongoDatabase();
        break;
      }
      case 'postgresql': {
        const { default: PostgreSQLDatabase } = await import('./postgresql.js');
        database = new PostgreSQLDatabase();
        break;
      }
      default:
        throw new Error(`Unknown DB_TYPE: ${DB_TYPE}`);
    }
  }
  return database;
}
