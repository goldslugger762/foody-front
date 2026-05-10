export type Post = {
  id: number;
  user: string;
  realName: string;
  when: string;
  dish: string;
  place: string;
  rating: number;
  price: string;
  text: string;
  tags: string[];
  photos: number;
  likes: number;
  comments: number;
  seed: number;
};

export type Palette = "fresh" | "citrus" | "dusk";
export type Density = "comfortable" | "cozy";

export type Tweaks = {
  brand: string;
  palette: Palette;
  density: Density;
};

export const DEFAULT_TWEAKS: Tweaks = {
  brand: "#2ECC71",
  palette: "fresh",
  density: "comfortable",
};

export const POSTS: Post[] = [
  {
    id: 1,
    user: "@ivanov_ivan",
    realName: "Иван Иванов",
    when: "2 ч",
    dish: "Тако с лангустином и манго",
    place: "El Camino · Никольская, 10",
    rating: 4.9,
    price: "₽680",
    text: "Шеф уговорил попробовать с тёплой сальсой — мякоть просто тает, а перчик чили работает на финале. Возьму ещё.",
    tags: ["#тако", "#морепродукты", "#центр"],
    photos: 3,
    likes: 999,
    comments: 262,
    seed: 0,
  },
  {
    id: 2,
    user: "@masha.eats",
    realName: "Маша Петрова",
    when: "5 ч",
    dish: "Маття чизкейк",
    place: "Hokkaidō · Патрики",
    rating: 4.7,
    price: "₽490",
    text: "Текстура воздушная, маття не горчит. Подача мини — на двоих маловато, заказывайте по штуке каждому.",
    tags: ["#чизкейк", "#маття", "#патрики"],
    photos: 4,
    likes: 1413,
    comments: 88,
    seed: 5,
  },
  {
    id: 3,
    user: "@kostya.cooks",
    realName: "Костя",
    when: "вчера",
    dish: "Хачапури по-аджарски",
    place: "Сулико · Кутузовский 22",
    rating: 4.8,
    price: "₽650",
    text: "Жёлток разбили прямо на лодочке. Хлеб — хрустит снаружи, тянется внутри. Лучшее в районе, проверено.",
    tags: ["#хачапури", "#грузинская", "#ужин"],
    photos: 2,
    likes: 742,
    comments: 41,
    seed: 2,
  },
];
