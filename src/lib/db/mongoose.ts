import mongoose from 'mongoose';
import dns from 'node:dns';

// In Node.js on Windows/local networks, the default DNS resolver often refuses
// SRV lookups (querySrv ECONNREFUSED) for MongoDB Atlas (mongodb+srv://).
// We configure Google (8.8.8.8) and Cloudflare (1.1.1.1) public DNS resolvers by default.
function configureDns() {
  try {
    const customServers = process.env.MONGODB_DNS_SERVERS
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (customServers && customServers.length > 0) {
      dns.setServers(customServers);
    } else {
      // Default to reliable public DNS resolvers
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    }
  } catch (err) {
    // If setServers is restricted or fails, continue with system defaults
    console.warn('[DB] Custom DNS setup skipped:', err instanceof Error ? err.message : err);
  }
}

// Initial DNS configuration
configureDns();

// Use a cached connection to avoid creating multiple connections in dev mode
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI?.trim();

  if (!MONGODB_URI || MONGODB_URI.includes('<username>') || MONGODB_URI.includes('cluster0.example.mongodb.net')) {
    throw new Error(
      'MONGODB_URI is missing or still using a placeholder value. Add a valid MongoDB Atlas connection string in your .env or .env.local file.'
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    configureDns();

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;

    // If SRV lookup failed, try one more time by explicitly forcing 8.8.8.8
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      err.code === 'ECONNREFUSED' &&
      'syscall' in err &&
      err.syscall === 'querySrv'
    ) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        cached.promise = mongoose.connect(MONGODB_URI, {
          bufferCommands: false,
          maxPoolSize: 10,
        });
        cached.conn = await cached.promise;
        return cached.conn;
      } catch (retryErr) {
        cached.promise = null;
        throw new Error(
          'MongoDB SRV DNS lookup was refused by your network DNS. Set MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1 in .env and restart the server.',
          { cause: retryErr }
        );
      }
    }

    throw err;
  }

  return cached.conn;
}

export default connectDB;
