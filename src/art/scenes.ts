/* Рисунки-заглушки в стиле карты. Когда появятся настоящие картинки сцен,
   укажите в world.ts image: '/scenes/имя.webp' — заглушка больше не понадобится. */

export const INK = '#4b2b23';
export const PAPER = '#f2e4d4';

export const rough =`<filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="3.2"/></filter>
<pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><line x1="0" y1="0" x2="0" y2="7" stroke="${INK}" stroke-width="1.2" opacity=".45"/></pattern>`;

function tree(x: number, y: number, s = 1, _k = 0){return `<g transform="translate(${x} ${y}) scale(${s})"><g>
  <path d="M0 0 V-34" stroke-width="5"/><path d="M-30 -40 C-46 -52,-34 -80,-14 -76 C-12 -100,18 -102,20 -78 C40 -84,46 -54,30 -42 C26 -28,-24 -26,-30 -40Z" fill="${PAPER}" stroke-width="3.4"/>
  <path d="M-12 -58 q7 -7 14 0 M6 -48 q6 -6 12 0 M-18 -44 q5-5 10 0" fill="none" stroke-width="2.4"/></g></g>`}
function pine(x: number, y: number, s = 1){return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 V-16" stroke-width="5"/><path d="M0 -110 L-26 -60 H-14 L-36 -18 H36 L14 -60 H26 Z" fill="${PAPER}" stroke-width="3.4"/></g>`}
function bush(x: number, y: number, s = 1){return `<path transform="translate(${x} ${y}) scale(${s})" d="M-30 0 C-40 -14,-26 -30,-12 -24 C-8 -40,16 -38,16 -24 C30 -30,40 -12,30 0Z" fill="${PAPER}" stroke-width="3"/>`}
function smoke(x: number, y: number){return `<g transform="translate(${x} ${y})" fill="none" stroke-width="3" opacity=".7">
  <path class="smoke" d="M0 0 q-10 -12 0 -22 t0 -22"/><path class="smoke d2" d="M4 -6 q10 -12 0 -22 t0 -22"/><path class="smoke d3" d="M-2 -4 q-8 -10 2 -20"/></g>`}
function house(x: number, y: number, v: 'a' | 'b' | 'c' | 'd', lit = true) {
  const win = (wx: number, wy: number, w = 34, h = 36) =>`<rect x="${wx}" y="${wy}" width="${w}" height="${h}" rx="3" fill="${lit?'#f3c46b':PAPER}" stroke-width="3.2"/><path d="M${wx+w/2} ${wy} V${wy+h} M${wx} ${wy+h/2} H${wx+w}" stroke-width="2.4"/>`;
  const H={
   a:`<path d="M-95 0 V-120 H95 V0Z" fill="${PAPER}" stroke-width="4"/><path d="M-118 -116 L0 -215 L118 -116Z" fill="${PAPER}" stroke-width="4"/>
      <path d="M-80 -130 L0 -198 M-40 -128 L20 -180 M30 -130 L60 -155" stroke-width="2" opacity=".6"/>
      <rect x="45" y="-238" width="28" height="60" fill="${PAPER}" stroke-width="4"/>
      <path d="M-22 0 V-70 Q0 -88 22 -70 V0" fill="${PAPER}" stroke-width="4"/><circle cx="12" cy="-34" r="3" fill="${INK}"/>
      ${win(-78,-96)}${win(44,-96)}<path d="M-95 -6 H95" stroke="url(#hatch)" stroke-width="10"/>`,
   b:`<path d="M-62 0 V-150 H62 V0Z" fill="${PAPER}" stroke-width="4"/><path d="M-80 -146 Q0 -270 80 -146Z" fill="${PAPER}" stroke-width="4"/>
      <circle cx="0" cy="-182" r="16" fill="${lit?'#f3c46b':PAPER}" stroke-width="3"/>
      <path d="M-18 0 V-58 Q0 -74 18 -58 V0" fill="${PAPER}" stroke-width="4"/>${win(-46,-128,30,32)}${win(16,-128,30,32)}
      <g stroke-width="2.4" fill="none"><path d="M-70 -150 l-6 26 M-55 -150 l-4 30 M-40 -150 l-2 22"/><circle cx="-76" cy="-120" r="5"/><circle cx="-59" cy="-116" r="5"/><circle cx="-42" cy="-124" r="5"/></g>
      `,
   c:`<path d="M-120 0 V-105 H120 V0Z" fill="${PAPER}" stroke-width="4"/><path d="M-140 -100 L-100 -175 H100 L140 -100Z" fill="${PAPER}" stroke-width="4"/>
      <path d="M-120 -128 H120 M-110 -150 H110" stroke-width="2" opacity=".55"/>
      <rect x="-30" y="-200" width="24" height="40" fill="${PAPER}" stroke-width="4"/>
      <path d="M-26 0 V-72 H26 V0" fill="${PAPER}" stroke-width="4"/>${win(-100,-82,40,34)}${win(60,-82,40,34)}
      <g fill="${PAPER}" stroke-width="3"><path d="M-160 0 q-6 -30 8 -36 q16 6 8 36Z"/><path d="M150 0 q-8 -24 6 -30 q14 6 6 30Z"/><path d="M168 0 q-4 -18 6 -20 q10 4 4 20Z"/></g>`,
   d:`<path d="M-70 0 V-100 H70 V0Z" fill="${PAPER}" stroke-width="4"/><path d="M-88 -96 L0 -170 L88 -96Z" fill="url(#hatch)" stroke-width="4"/>
      <path d="M-18 0 V-60 H18 V0" fill="${PAPER}" stroke-width="4"/><path d="M-24 -46 L24 -24 M-24 -24 L24 -46" stroke-width="4"/>
      <rect x="-56" y="-84" width="28" height="28" fill="${PAPER}" stroke-width="3"/><path d="M-60 -82 L-24 -58" stroke-width="4"/>`
  };
  return `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="4" rx="${v==='c'?150:110}" ry="12" fill="${INK}" opacity=".08" stroke="none"/>${H[v]}</g>`;
}
export function drawVillage(): string {
  const trees=[[90,330,1.1],[220,250,.9],[1460,300,1.1],[1350,250,.8],[1530,560,1],[60,700,1.2],[1500,880,1.1],[160,940,1],[420,230,.8],[1080,230,.85],[1230,880,.9],[380,880,.8]]
    .map((t,i)=>tree(t[0],t[1],t[2],i)).join('');
  const pines=[[300,230,.8],[1180,250,.9],[1560,380,.8],[30,520,.9],[1580,700,.85]].map((p) => pine(p[0], p[1], p[2])).join('');
  const road=`M800 1010 C 780 900, 700 860, 720 780 C 740 700, 860 690, 860 610 C 860 520, 760 500, 800 420 C 830 360, 900 330, 980 300`;
  return `<svg class="scene" viewBox="0 0 1600 1000" xmlns="http://www.w3.org/2000/svg"><defs>${rough}</defs>
  <g filter="url(#rough)" class="ink" fill="none" stroke="${INK}">
    <path d="M-20 300 C 200 240, 380 300, 560 260 S 900 220, 1100 250 S 1460 210, 1620 260" stroke-width="3"/>
    <path d="M300 250 C 380 200, 480 210, 560 260 M1050 245 C 1150 190, 1260 200, 1340 235" stroke-width="2.4" opacity=".6"/>
    <g stroke-width="2" opacity=".35">${Array.from({length:14},(_,i)=>`<path d="M${80+i*110} ${300+(i%3)*14} q14 -6 28 0"/>`).join('')}</g>
    <path d="${road}" stroke-width="4.5" stroke-dasharray="0.1 11"/><path d="${road}" transform="translate(26 6)" stroke-width="4.5" stroke-dasharray="0.1 11"/>
    <path d="M760 610 C 600 640, 480 700, 330 700 M880 600 C 1000 640, 1120 700, 1240 690 M820 760 C 900 800, 960 850, 1010 860" stroke-width="4" stroke-dasharray="0.1 11"/>
    ${pines}${trees}
    <g stroke-width="3"><path d="M520 760 H660 M520 760 V730 M555 760 V728 M590 760 V732 M625 760 V729 M660 760 V731 M520 742 H660"/>
      <path d="M1090 800 H1220 M1090 800 V770 M1130 800 V768 M1170 800 V771 M1210 800 V769 M1090 782 H1220"/></g>
    ${bush(470,720,.9)}${bush(1290,720,1)}${bush(980,870,.8)}${bush(560,560,.8)}
    <g transform="translate(905 700)"><ellipse rx="44" ry="14" fill="${PAPER}" stroke-width="3.5"/><path d="M-44 0 V40 Q0 58 44 40 V0" fill="${PAPER}" stroke-width="3.5"/>
      <path d="M-40 -2 V-70 M40 -2 V-70 M-52 -66 L0 -96 L52 -66Z" stroke-width="3.5" fill="${PAPER}"/><path d="M0 -66 V-20" stroke-width="2"/><rect x="-8" y="-24" width="16" height="14" fill="${PAPER}" stroke-width="2.5"/></g>
    <g transform="translate(670 520)"><path d="M0 0 V-110" stroke-width="5"/><path d="M-4 -104 H-96 L-112 -88 L-96 -72 H-4Z M4 -66 H96 L112 -50 L96 -34 H4Z" fill="${PAPER}" stroke-width="3.5"/></g>
    ${house(330,540,'a')}${house(800,425,'b')}${house(1230,560,'c')}${house(1010,815,'d',false)}
  </g>
  <g class="ink" stroke="${INK}">${smoke(389,294)}${smoke(830,193)}${smoke(1212,352)}</g>
  <g font-family="Neucha, cursive" fill="${INK}" text-anchor="middle">
    <text x="614" y="440" font-size="19">к Болоту</text><text x="728" y="478" font-size="19">к Рынку</text>
    <text x="800" y="90" font-size="58">Деревня Кружье</text>
    <path d="M560 112 Q800 140 1040 112" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g></svg>`;
}

/** Реестр сцен: ключ из world.ts (поле art) → функция, которая рисует SVG */
export const SCENES: Record<string, () => string> = {
  kruzhye: drawVillage,
};
