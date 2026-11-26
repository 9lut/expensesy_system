// เลือกที่เก็บข้อมูล: DATA_SOURCE=gas → Google Sheet ผ่าน GAS · อื่น ๆ → หน่วยความจำ (ข้อมูลจำลอง)
import { gasStore } from "./store-gas";
import { mockStore } from "./store-mock";
import type { Store } from "./store";

export const getStore = (): Store => (process.env.DATA_SOURCE === "gas" ? gasStore : mockStore);
