import mysql from "mysql2/promise";
import { appConfig } from "@/lib/config";

let pool: mysql.Pool | null = null;

export function getMysqlPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...appConfig.mysql,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  return pool;
}
