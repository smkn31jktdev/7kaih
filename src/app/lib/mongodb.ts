import { MongoClient, ServerApiVersion } from "mongodb";

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
};

let clientPromise: Promise<MongoClient> | null = null;

const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient> | null;
};

function createConnection(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return Promise.reject(
      new Error("MONGODB_URI environment variable is not set"),
    );
  }
  const client = new MongoClient(uri, options);
  const promise = client.connect();

  promise.catch(() => {
    // Reset cache on failure so next request retries
    if (process.env.NODE_ENV === "development") {
      globalWithMongo._mongoClientPromise = null;
    } else {
      clientPromise = null;
    }
  });

  return promise;
}

function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = createConnection();
    }
    return globalWithMongo._mongoClientPromise;
  } else {
    if (!clientPromise) {
      clientPromise = createConnection();
    }
    return clientPromise;
  }
}

const clientPromiseProxy = new Proxy({} as Promise<MongoClient>, {
  get(_target, prop, receiver) {
    const promise = getClientPromise();
    const value = Reflect.get(promise, prop, receiver);
    return typeof value === "function" ? value.bind(promise) : value;
  },
});

export default clientPromiseProxy;
