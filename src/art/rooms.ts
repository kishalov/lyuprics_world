import type { Npc, NpcLook } from '@/data/npcs';
import { INK, PAPER, rough } from './scenes';

/** Персонаж-заглушка (внутренности группы; координаты: ноги в 0,0, рост ~310). */
export function figureInner(look: NpcLook): string {
  const L = look;
  const hats: Record<string, string> = {
    beret:`<path d="M-62 -262 C-60 -300,40 -312,66 -268 C40 -274,-30 -276,-62 -262Z" fill="#7a3a2a" stroke-width="4"/><path d="M4 -300 v-10" stroke-width="5"/>`,
    kerchief:`<path d="M-60 -232 C-66 -300,66 -300,60 -232 C40 -266,-40 -266,-60 -232Z" fill="#c45a3c" stroke-width="4"/><path d="M52 -240 l24 14 l-6 -24Z" fill="#c45a3c" stroke-width="3.5"/><g fill="${PAPER}" stroke="none"><circle cx="-24" cy="-270" r="4"/><circle cx="10" cy="-278" r="4"/><circle cx="34" cy="-262" r="4"/></g>`,
    hood:`<path d="M-74 -150 C-90 -260,-40 -310,0 -310 C40 -310,90 -260,74 -150" fill="${L.coat}" stroke-width="4"/>`,
    none:`<path d="M-56 -238 C-58 -290,56 -294,56 -240 C40 -262,10 -250,-8 -266 C-22 -250,-44 -258,-56 -238Z" fill="${L.hair}" stroke-width="4"/>`
  };
  const hair= L.hat==='hood' ? `<path d="M-50 -210 C-56 -262,56 -262,50 -210 C30 -240,-30 -240,-50 -210Z" fill="${L.hair}" stroke-width="3.5"/>`
    : L.hat==='none' ? '' : `<path d="M-56 -232 C-64 -200,-60 -190,-50 -186 M56 -232 C64 -200,60 -190,50 -186" stroke="${L.hair}" stroke-width="12" fill="none"/>`;
  const extra = L.extra==='glasses'?`<g fill="none" stroke-width="3.2"><circle cx="-20" cy="-222" r="14"/><circle cx="20" cy="-222" r="14"/><path d="M-6 -222 h12"/></g>`
    : L.extra==='apron'?`<path d="M-36 -120 H36 L42 -10 H-42Z" fill="#efe2cf" stroke-width="3.5"/><path d="M-30 -60 q10 6 20 -2" fill="none" stroke-width="2.4" opacity=".6"/>`:'';
  return `<g stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="0" cy="0" rx="86" ry="14" fill="${INK}" opacity=".12" stroke="none"/>
    <g class="breathe">
      ${L.hat==='hood'?hats.hood:''}
      <path d="M-74 0 C-80 -70,-68 -150,-40 -168 H40 C68 -150,80 -70,74 0Z" fill="${L.coat}" stroke-width="4.5"/>
      ${L.extra==='apron'?extra:''}
      <path d="M-58 -140 C-82 -100,-80 -70,-62 -58 M58 -140 C82 -100,80 -70,62 -58" fill="none" stroke-width="4"/>
      <circle cx="-62" cy="-56" r="11" fill="${L.skin}" stroke-width="3.5"/><circle cx="62" cy="-56" r="11" fill="${L.skin}" stroke-width="3.5"/>
      <path d="M-16 -170 V-150 H16 V-170" fill="${L.skin}" stroke-width="3.5"/>
      <circle cx="0" cy="-220" r="56" fill="${L.skin}" stroke-width="4.5"/>
      ${hair}
      <circle cx="-30" cy="-200" r="9" fill="#e38b7a" opacity=".45" stroke="none"/><circle cx="30" cy="-200" r="9" fill="#e38b7a" opacity=".45" stroke="none"/>
      <g class="eyes"><ellipse cx="-19" cy="-222" rx="4.5" ry="6" fill="${INK}" stroke="none"/><ellipse cx="19" cy="-222" rx="4.5" ry="6" fill="${INK}" stroke="none"/></g>
      ${L.extra==='glasses'?extra:''}
      <path class="mouth" d="M-12 -194 Q0 -184 12 -194" fill="none" stroke-width="3.5"/>
      ${L.hat!=='hood'?hats[L.hat]:''}
    </g></g>`;
}
/** Комната-заглушка (содержимое <svg viewBox="0 0 1200 800">, без персонажа). */
export function roomInner(npc: Npc): string {
  const kind=npc.room, W=1200,H=800;
  const tower = kind==='tower';
  const wall = tower
    ? `<rect width="${W}" height="580" fill="#e9dccb"/>${Array.from({length:9},(_,r)=>Array.from({length:9},(_,c)=>`<path d="M${(c*150)+(r%2?75:0)-40} ${r*66+8} h132 q8 0 8 8 v48 q0 8 -8 8 h-132 q-8 0 -8 -8 v-48 q0 -8 8 -8Z" fill="none" stroke-width="2.2" opacity=".45"/>`).join('')).join('')}`
    : `<rect width="${W}" height="580" fill="#efe0cd"/>${Array.from({length:16},(_,i)=>`<path d="M${i*80} 0 V580" stroke-width="2" opacity=".28"/>`).join('')}<path d="M0 40 H${W}" stroke-width="3" opacity=".5"/>`;
  const floor = `<path d="M0 580 H${W} V${H} H0Z" fill="#e2cdb4"/><path d="M0 580 H${W}" stroke-width="4"/>
    ${Array.from({length:13},(_,i)=>`<path d="M${600+(i-6)*70} 580 L${600+(i-6)*190} ${H}" stroke-width="2" opacity=".35"/>`).join('')}`;
  const win = tower
    ? `<g transform="translate(800 120)"><path d="M0 230 V70 Q70 -20 140 70 V230Z" fill="#d8e4e6" stroke-width="5"/><path d="M70 10 V230 M0 140 H140" stroke-width="3"/><path d="M10 210 q40 -40 60 -20 t60 -10" fill="none" stroke-width="2.4" opacity=".6"/></g>`
    : `<g transform="translate(780 110)"><rect width="240" height="200" fill="#dfe8e4" stroke-width="5"/><path d="M120 0 V200 M0 100 H240" stroke-width="4"/>
       <path d="M0 160 C60 130,120 150,240 120 M10 190 q30-20 60-6" fill="none" stroke-width="2.6" opacity=".55"/><path d="M-14 -10 H254" stroke-width="7"/>
       <path d="M-10 -6 C 20 80,-6 140,10 214" fill="#c9a07c" stroke-width="3" opacity=".9"/><path d="M250 -6 C 220 80,246 140,230 214" fill="#c9a07c" stroke-width="3" opacity=".9"/></g>`;
  const shelf = (items: string) =>`<g transform="translate(90 170)"><path d="M0 0 H300 M0 130 H300" stroke-width="6"/>${items}</g>`;
  const jar = (x: number, y: number, h = 46, fill: string = PAPER) =>`<path d="M${x-16} ${y} v${-h+10} q0 -10 6 -10 h20 q6 0 6 10 v${h-10}Z" fill="${fill}" stroke-width="3"/><path d="M${x-12} ${y-h} h24" stroke-width="5"/>`;
  const pot = (x: number, y: number, s = 1) =>`<path transform="translate(${x} ${y}) scale(${s})" d="M-22 0 C-36 -20,-30 -44,-14 -50 V-58 H14 V-50 C30 -44,36 -20,22 0Z" fill="#c98a5a" stroke-width="3"/>`;
  let props='';
  if(kind==='map') props = shelf(`${jar(40,-2)}${jar(80,-2,36)}<g transform="translate(150 -40)"><rect width="110" height="34" rx="16" fill="${PAPER}" stroke-width="3"/><path d="M10 0 v34 M100 0 v34" stroke-width="2"/></g>${jar(60,128,40)}<g transform="translate(130 84)"><rect width="140" height="40" rx="18" fill="#efe2cf" stroke-width="3"/></g>`)
      + `<g transform="translate(430 110)"><rect x="-10" y="-10" width="250" height="200" fill="#c9a07c" stroke-width="5"/><image href="/map.webp" width="230" height="180" preserveAspectRatio="xMidYMid slice"/><rect width="230" height="180" fill="none" stroke-width="3"/></g>`
      + `<g transform="translate(870 560)"><path d="M-180 0 H180 V-20 H-180Z" fill="#b98a62" stroke-width="4"/><path d="M-160 0 V150 M160 0 V150" stroke-width="7"/><path d="M-120 -20 l40 -30 h120 l20 30" fill="#f4ead9" stroke-width="3"/><path d="M-80 -42 h100 M-74 -32 h80" stroke-width="2" opacity=".6"/><path d="M90 -22 l40 -70" stroke-width="3"/><circle cx="-150" cy="-34" r="16" fill="${PAPER}" stroke-width="3"/><path d="M-150 -46 v24 M-162 -34 h24" stroke-width="2"/></g>`;
  if(kind==='herbs') props = `<g stroke-width="3">${[130,220,310,400,490,600,690].map((x,i)=>`<path d="M${x} 40 v${40+i%3*14}" /><path d="M${x} ${80+i%3*14} l-14 ${50} M${x} ${80+i%3*14} l0 56 M${x} ${80+i%3*14} l14 ${50}" stroke="#5f7a3e" stroke-width="5"/>`).join('')}</g>`
      + shelf(`${jar(30,-2,50,'#d9e3c4')}${jar(80,-2,40,'#ead7a6')}${jar(130,-2,56,'#d9e3c4')}${jar(190,-2,44,'#e7c9b8')}${jar(250,-2)}${jar(60,128,40,'#ead7a6')}${jar(140,128,50,'#d9e3c4')}${jar(220,128)}`)
      + `<g transform="translate(900 640)"><path d="M-90 -80 C-110 20,110 20,90 -80Z" fill="#5a4a44" stroke-width="5"/><path d="M-100 -82 H100" stroke-width="8"/><path d="M-60 40 l-20 40 M60 40 l20 40" stroke-width="6"/><path d="M-40 -100 q10 -20 0 -40 M10 -100 q10 -20 0 -40" fill="none" stroke-width="3"/></g>`;
  if(kind==='pots') props = shelf(`${pot(40,-2)}${pot(100,-2,.8)}${pot(160,-2,1.1)}${pot(230,-2,.9)}${pot(60,128,.9)}${pot(130,128,1.2)}${pot(210,128,.8)}${pot(270,128,.9)}`)
      + `<g transform="translate(900 640)"><path d="M-110 0 H110 V40 H-110Z" fill="#b98a62" stroke-width="4"/><path d="M-90 40 V140 M90 40 V140" stroke-width="7"/><ellipse cx="0" cy="-6" rx="80" ry="14" fill="#9b8a7a" stroke-width="4"/><path d="M-34 -20 C-44 -60,-20 -90,-16 -100 H16 C20 -90,44 -60,34 -20Z" fill="#c98a5a" stroke-width="4"/></g>`
      + `${pot(470,575,1.4)}${pot(540,580,1)}`;
  if(kind==='tower') props = `<g transform="translate(160 600)" fill="${PAPER}" stroke-width="4">${Array.from({length:7},(_,i)=>`<path d="M${i*40} ${-i*70} h120 v24 h-120Z"/>`).join('')}<path d="M0 0 L280 -490" fill="none" stroke-width="3" opacity=".5"/></g>`
      + `<g transform="translate(560 200)"><path d="M0 0 H300 M0 140 H300" stroke-width="6"/>${[30,90,150,210,270].map((x,i)=>jar(x,-2,40+i%2*14,i%2?'#e3ecf0':'#f4f1ea')).join('')}${[60,140,220].map(x=>jar(x,138,50,'#e3ecf0')).join('')}
         ${[30,150,270].map(x=>`<path d="M${x} -20 q-6 10 0 14 q6 -4 0 -14Z" fill="#9dbfd0" stroke-width="2"/>`).join('')}</g>`;
  const rug = `<ellipse cx="560" cy="700" rx="260" ry="46" fill="#c45a3c" opacity=".25" stroke-width="3" stroke-dasharray="3 9"/>`;
  return `<defs>${rough}</defs>
    <g filter="url(#rough)" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round" fill="none">${wall}${floor}${win}${rug}${props}</g>`;
}

