const dotenv = require('dotenv');
dotenv.config();

const DB_TYPE = process.env.DB_TYPE || 'file';

let database;

function getDatabase() {
  if (!database) {
    switch (DB_TYPE) {
      case 'file':
        const SQLiteDatabase = require('./sqlite');
        database = new SQLiteDatabase();
        break;
      case 'mongodb':
        const MongoDatabase = require('./mongodb');
        database = new MongoDatabase();
        break;
      case 'postgresql':
        const PostgreSQLDatabase = require('./postgresql');
        database = new PostgreSQLDatabase();
        break;
      default:
        throw new Error(`Unknown DB_TYPE: ${DB_TYPE}`);
    }
  }
  return database;
}

module.exports = { getDatabase };
