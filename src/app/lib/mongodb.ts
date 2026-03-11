import { MongoClient, ServerApiVersion } from "mongodb";

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let clientPromise: Promise<MongoClient>;

const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

function getClientPromise(): Promise<MongoClient> {
  if (!clientPromise) {
    const uri = process.env.MONGODB_URI!;
    if (process.env.NODE_ENV === "development") {
      if (!globalWithMongo._mongoClientPromise) {
        const client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
      }
      clientPromise = globalWithMongo._mongoClientPromise;
    } else {
      const client = new MongoClient(uri, options);
      clientPromise = client.connect();
    }
  }
  return clientPromise;
}

const clientPromiseProxy = new Proxy({} as Promise<MongoClient>, {
  get(_target, prop, receiver) {
    const promise = getClientPromise();
    const value = Reflect.get(promise, prop, receiver);
    return typeof value === "function" ? value.bind(promise) : value;
  },
});

export default clientPromiseProxy;
