/* =====================================================================
   СТРУКТУРА МИРА — всё, что меняется чаще всего, живёт здесь.

   type:
     'map'      — приближение на карте с вложенными точками (children)
     'leaf'     — место пока «в тумане»: только приближение и карточка
     'scene'    — отдельная картинка локации (image: "/scenes/имя.webp")
     'interior' — дом изнутри с жителем (npc: ключ из npcs.ts) и диалогом
     'locked'   — точка, которую видно, но открыть нельзя (пустой дом)

   layer — id слоя карты (имя PNG в art-src/map/). У такого места
           нажимается сам рисунок, а камера сама подбирает приближение.
   at: {x, y, r} — для мест со слоем: где стоит подпись;
                   для остальных: центр кольца и его радиус.
                   Всё в процентах холста карты (или картинки сцены).
   view — ручное приближение {x, y, s}, если автоматическое не нравится.
   id — латиница, цифры и дефисы: из них собирается адрес страницы.
   ===================================================================== */

export type NodeType = "map" | "scene" | "interior" | "leaf" | "locked";

export interface View {
  x: number;
  y: number;
  s: number;
}

export interface WorldNode {
  id: string;
  name: string;
  type: NodeType;
  layer?: string;
  at?: { x: number; y: number; r?: number };
  view?: View;
  level?: string; // подпись уровня в карточке
  sub?: string; // подсказка под названием при наведении
  desc?: string; // текст карточки
  image?: string; // для 'scene'
  art?: string; // для 'scene': ключ рисунка-заглушки из src/art/scenes.ts
  aspect?: number; // для 'scene': ширина / высота картинки
  npc?: string; // для 'interior'
  children?: WorldNode[];
}

export const WORLD: WorldNode = {
  id: "world",
  name: "Земли Ыш",
  type: "map",
  view: { x: 50, y: 50, s: 1 },
  level: "Мир",
  desc: "Карта мира. Каждое место можно приблизить, а в некоторых домах живут персонажи.",
  children: [
    {
      id: "kruzhye",
      name: "Кружье",
      type: "map",
      layer: "kruzhye",
      at: { x: 33, y: 29.6 },
      level: "Деревня",
      desc: "Тихая деревня у леса. В некоторых домах горит свет — туда можно постучаться.",
      children: [
        { id: "dom-kartografa", name: "Дом картографа", type: "interior", at: { x: 32, y: 26.4, r: 2.4 }, npc: "miron", sub: "Мирон дома" },
        { id: "dom-travnicy", name: "Дом травницы", type: "interior", at: { x: 38.8, y: 25.4, r: 2.1 }, npc: "varvara", sub: "Варвара дома" },
        { id: "goncharnya", name: "Гончарня", type: "interior", at: { x: 29, y: 22.6, r: 2.3 }, npc: "gosha", sub: "Гоша за кругом" },
        { id: "pustaya-zemlyanka", name: "Пустая землянка", type: "locked", at: { x: 34.2, y: 20.8, r: 1.8 }, sub: "здесь пока никто не живёт" },
        { id: "pustoy-dom", name: "Пустой дом", type: "locked", at: { x: 37, y: 20.6, r: 1.9 }, sub: "здесь пока никто не живёт" },
      ],
    },
    {
      id: "pitychiy-les",
      name: "Питучий лес",
      type: "map",
      layer: "pitychiy-les",
      at: { x: 50, y: 38 },
      level: "Регион",
      desc: "Самый большой лес земель Ыш. Внутри — пруд, болото и лощина.",
      children: [
        { id: "zerkalnyy-prud", name: "Зеркальный пруд", type: "leaf", at: { x: 37.5, y: 41, r: 3.4 } },
        { id: "chvakayushchee-boloto", name: "Чвакающее болото", type: "leaf", at: { x: 59, y: 23.5, r: 4 } },
        { id: "ovrazhnaya-loshchina", name: "Овражная лощина", type: "leaf", at: { x: 67.5, y: 27.5, r: 3.4 } },
      ],
    },
    {
      id: "barhonda",
      name: "Бархонда",
      type: "map",
      layer: "barhonda",
      at: { x: 21, y: 77.4 },
      level: "Регион",
      desc: "Песчаные дюны на юго-западе. Над ними — одинокая кривая башня.",
      children: [
        { id: "bashnya", name: "Башня слёз и соли", type: "interior", at: { x: 14.6, y: 64, r: 2.8 }, npc: "sol", sub: "можно подняться" },
      ],
    },
    { id: "rynok", name: "Рынок", type: "leaf", layer: "rynok", at: { x: 48.3, y: 21.4 } },
    { id: "mys", name: "Мыс «Живущий»", type: "leaf", layer: "mys", at: { x: 75.5, y: 8 } },
    { id: "holmy", name: "Питучие холмы", type: "leaf", layer: "holmy", at: { x: 16, y: 54.8 } },
    { id: "hrebet", name: "Драконий хребет", type: "leaf", layer: "hrebet", at: { x: 42, y: 55.5 } },
    { id: "mistikorp", name: "Мистикорп", type: "leaf", layer: "mistikorp", at: { x: 87.2, y: 21.5 } },
    { id: "bezdna-hu", name: "Бездна Ху", type: "leaf", layer: "bezdna-hu", at: { x: 74, y: 56 } },
    { id: "zagorye", name: "Загорье", type: "leaf", layer: "zagorye", at: { x: 40, y: 75.6 } },
    { id: "amorantikum", name: "Аморантикум", type: "leaf", layer: "amorantikum", at: { x: 84, y: 77.6 } },
    { id: "shepchushchee", name: "Шепчущее королевство", type: "leaf", layer: "shepchushchee", at: { x: 59, y: 79.6 } },
    { id: "yagodnyy", name: "Ягодный перевал", type: "leaf", layer: "yagodnyy", at: { x: 71, y: 92.4 } },
  ],
};
