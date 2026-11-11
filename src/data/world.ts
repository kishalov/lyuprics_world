/* =====================================================================
   СТРУКТУРА МИРА — всё, что меняется чаще всего, живёт здесь.

   type:
     'map'      — приближение на общей карте (view: центр x,y в % и масштаб s)
     'scene'    — отдельная нарисованная сцена (art: ключ из src/art/scenes.ts
                  ИЛИ image: путь к вашей картинке в /public)
     'interior' — дом изнутри с жителем (npc: ключ из npcs.ts) и диалогом
     'leaf'     — место пока «в тумане»: только приближение и карточка
     'locked'   — точка, которую видно, но открыть нельзя (пустой дом)

   at: {x, y, r} — где лежит точка на РОДИТЕЛЬСКОМ уровне, в % ширины/высоты
                   картинки родителя; r — радиус кольца в % ширины.
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
  at?: { x: number; y: number; r: number };
  view?: View; // для type 'map'
  region?: boolean; // зона с подсветкой по контуру (poly) вместо кольца
  poly?: string; // контур зоны: "x,y x,y …" в % карты
  level?: string; // подпись уровня в карточке
  sub?: string; // подсказка под названием при наведении
  desc?: string; // текст карточки
  art?: string; // для 'scene': ключ рисунка-заглушки
  image?: string; // для 'scene': ваша картинка, например "/scenes/kruzhye.webp"
  aspect?: number; // соотношение сторон сцены (ширина / высота)
  npc?: string; // для 'interior'
  children?: WorldNode[];
}

/** Соотношение сторон общей карты (public/map.webp). Поменяйте, если поменяете карту. */
export const MAP_IMAGE = "/map.webp";
export const MAP_ASPECT = 3161 / 2553;

export const WORLD: WorldNode = {
  id: "world",
  name: "Земли Ыш",
  type: "map",
  view: { x: 50, y: 46, s: 1 },
  level: "Мир",
  desc: "Выберите регион или место на карте — карта приблизится, и откроются новые точки.",
  children: [
    {
      id: "pitychiy-les",
      name: "Питучий лес",
      type: "map",
      region: true,
      at: { x: 50, y: 40, r: 9 },
      poly: "25,24 33,19 42,17 50,21 56,18 65,19 75,21 78,30 82,35 72,42 60,49 45,52 30,52 25,45 24,32",
      view: { x: 52, y: 35, s: 2.15 },
      level: "Регион",
      desc: "Самый большой лес земель Ыш. Внутри — деревня, болото, лощина и пруд.",
      children: [
        {
          id: "kruzhye",
          name: "Кружье",
          type: "scene",
          at: { x: 34.3, y: 24.4, r: 3.6 },
          level: "Деревня",
          sub: "деревня · можно зайти",
          art: "kruzhye",
          aspect: 1.6,
          desc: "Тихая деревня на опушке. В некоторых домах горит свет — туда можно постучаться.",
          children: [
            { id: "dom-kartografa", name: "Дом картографа", type: "interior", at: { x: 20.6, y: 44, r: 9 }, npc: "miron", sub: "Мирон дома" },
            { id: "dom-travnicy", name: "Дом травницы", type: "interior", at: { x: 50, y: 29.5, r: 8 }, npc: "varvara", sub: "Варвара дома" },
            { id: "goncharnya", name: "Гончарня", type: "interior", at: { x: 76.9, y: 47, r: 9.5 }, npc: "gosha", sub: "Гоша за кругом" },
            { id: "pustoy-dom", name: "Пустой дом", type: "locked", at: { x: 63.1, y: 73, r: 6.5 }, sub: "здесь пока никто не живёт" },
          ],
        },
        { id: "chvakayushchee-boloto", name: "Чвакающее болото", type: "leaf", at: { x: 59, y: 26.4, r: 4 } },
        { id: "ovrazhnaya-loshchina", name: "Овражная лощина", type: "leaf", at: { x: 68.5, y: 34.6, r: 4 } },
        { id: "zerkalnyy-prud", name: "Зеркальный пруд", type: "leaf", at: { x: 34, y: 45.6, r: 4 } },
      ],
    },
    {
      id: "barhonda",
      name: "Бархонда",
      type: "map",
      region: true,
      at: { x: 28.5, y: 60.5, r: 8 },
      poly: "14,57 27,53 45,52 46,58 42,64 30,70 18,73 11,70 12,62",
      view: { x: 28, y: 62.5, s: 2.6 },
      level: "Регион",
      desc: "Южные равнины. Над ними — одинокая башня.",
      children: [
        { id: "bashnya", name: "Башня слёз и соли", type: "interior", at: { x: 17.6, y: 66, r: 4.2 }, npc: "sol", sub: "можно подняться" },
      ],
    },
    { id: "rynok", name: "Рынок", type: "leaf", at: { x: 48, y: 14.6, r: 4.6 } },
    { id: "mys", name: "Мыс «Живущий»", type: "leaf", at: { x: 73.5, y: 11.6, r: 5.4 } },
    { id: "holmy", name: "Питучие холмы", type: "leaf", at: { x: 17, y: 44.6, r: 4.8 } },
    { id: "hrebet", name: "Драконий хребет", type: "leaf", at: { x: 57, y: 53.6, r: 5.2 } },
    { id: "mistikorp", name: "Мистикорп", type: "leaf", at: { x: 84, y: 45, r: 4.8 } },
    { id: "bezdna-hu", name: "Бездна Ху", type: "leaf", at: { x: 73, y: 57.4, r: 4.6 } },
    { id: "zagorye", name: "Загорье", type: "leaf", at: { x: 55.5, y: 61.2, r: 4.2 } },
    { id: "amorantikum", name: "Аморантикум", type: "leaf", at: { x: 86, y: 63.5, r: 5 } },
    { id: "shepchushchee", name: "Шепчущее королевство", type: "leaf", at: { x: 63.5, y: 68.4, r: 5.4 } },
    { id: "yagodnyy", name: "Ягодный перевал", type: "leaf", at: { x: 74, y: 79, r: 5 } },
  ],
};
