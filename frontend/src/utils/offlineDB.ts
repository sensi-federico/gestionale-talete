import Dexie, { Table } from "dexie";
import { OfflineRilevamento } from "@shared/types";

export class OfflineDatabase extends Dexie {
  pendingRilevamenti!: Table<OfflineRilevamento, string>;

  constructor() {
    super("talete-offline-db");
    this.version(1).stores({
      pendingRilevamenti: "localId, isSynced, localCreatedAt"
    });
  }
}

export const offlineDB = new OfflineDatabase();
