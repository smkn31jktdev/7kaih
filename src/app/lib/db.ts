import { DataAPIClient } from "@datastax/astra-db-ts";

const client = new DataAPIClient(process.env.ASTRA_DB_TOKEN!);
const db = client.db(process.env.ASTRA_DB_ENDPOINT!, { keyspace: "smkn31jkt" });

export const adminCollection = db.collection("akun_admin");
export const studentCollection = db.collection("akun_siswa");
export const kegiatanCollection = db.collection("kebiasaan_hebat");
export const buktiCollection = db.collection("bukti");

export default db;
