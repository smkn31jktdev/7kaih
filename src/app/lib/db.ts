import { DataAPIClient, Collection, Db } from "@datastax/astra-db-ts";

let _db: Db | null = null;

function getDb(): Db {
  if (!_db) {
    const client = new DataAPIClient(process.env.ASTRA_DB_TOKEN!);
    _db = client.db(process.env.ASTRA_DB_ENDPOINT!, {
      keyspace: "smkn31jkt",
    });
  }
  return _db;
}

function lazyCollection(name: string): Collection {
  return new Proxy({} as Collection, {
    get(_target, prop, receiver) {
      const col = getDb().collection(name);
      const value = Reflect.get(col, prop, receiver);
      return typeof value === "function" ? value.bind(col) : value;
    },
  });
}

export const adminCollection = lazyCollection("akun_admin");
export const studentCollection = lazyCollection("akun_siswa");
export const kegiatanCollection = lazyCollection("kebiasaan_hebat");
export const buktiCollection = lazyCollection("bukti");
export const kehadiranCollection = lazyCollection("kehadiran");

export default getDb;
