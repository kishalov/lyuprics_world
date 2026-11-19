export interface MapLayer {
  id: string;
  src: string;
  base: boolean; // подложка: рисуется первой и не нажимается
  x: number; // положение и размер в процентах холста
  y: number;
  w: number;
  h: number;
}
