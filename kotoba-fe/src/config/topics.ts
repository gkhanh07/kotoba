// Vocab topics (phase 40b): the BE holds only the key on each word; content.spec.ts pins the same list.
export const TOPICS = {
  people: { vi: "Con người", en: "People" },
  body: { vi: "Cơ thể", en: "Body" },
  health: { vi: "Sức khoẻ", en: "Health" },
  food: { vi: "Đồ ăn", en: "Food" },
  home: { vi: "Nhà cửa", en: "Home" },
  clothes: { vi: "Quần áo", en: "Clothes" },
  school: { vi: "Trường học", en: "School" },
  work: { vi: "Công việc", en: "Work" },
  time: { vi: "Thời gian", en: "Time" },
  numbers: { vi: "Số đếm", en: "Numbers" },
  weather: { vi: "Thời tiết", en: "Weather" },
  nature: { vi: "Thiên nhiên", en: "Nature" },
  animals: { vi: "Động vật", en: "Animals" },
  places: { vi: "Địa điểm", en: "Places" },
  transport: { vi: "Đi lại", en: "Transport" },
  shopping: { vi: "Mua sắm", en: "Shopping" },
  hobbies: { vi: "Sở thích", en: "Hobbies" },
  feelings: { vi: "Cảm xúc", en: "Feelings" },
  communication: { vi: "Giao tiếp", en: "Communication" },
} as const;
export type Topic = keyof typeof TOPICS;
export const isTopic = (x: string): x is Topic => Object.hasOwn(TOPICS, x);
