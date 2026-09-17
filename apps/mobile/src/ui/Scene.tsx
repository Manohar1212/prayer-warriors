import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Line, LinearGradient, Path, Polygon, Rect, RadialGradient, Stop } from 'react-native-svg';

/** Seven different pictures; each is its own composition, not a recolour of another. */
export type SceneVariant = 'mountains' | 'night' | 'sea' | 'field' | 'dove' | 'rain' | 'glass';

const ALL: SceneVariant[] = ['mountains', 'night', 'sea', 'field', 'dove', 'rain', 'glass'];

let last: SceneVariant | null = null;

/** A random scene, never the same one twice in a row. */
export function randomSceneVariant(): SceneVariant {
  const pool = ALL.filter((v) => v !== last);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  last = pick;
  return pick;
}

const W = 390;
const H = 260;

function Cross({ x, y, h = 62, w = 32, color = '#101A2A' }: { x: number; y: number; h?: number; w?: number; color?: string }) {
  const t = Math.max(4, Math.round(h / 10));
  return (
    <>
      <Rect x={x - t / 2} y={y} width={t} height={h} rx={t / 4} fill={color} />
      <Rect x={x - w / 2} y={y + h * 0.22} width={w} height={t} rx={t / 4} fill={color} />
    </>
  );
}

function Mountains() {
  return (
    <>
      <Defs>
        <LinearGradient id="m-sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6F97CF" />
          <Stop offset="0.45" stopColor="#C9B7C9" />
          <Stop offset="0.7" stopColor="#F2C58C" />
          <Stop offset="1" stopColor="#F7DDB5" />
        </LinearGradient>
        <RadialGradient id="m-sun" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFF3C4" />
          <Stop offset="0.35" stopColor="#FFD98A" stopOpacity={0.9} />
          <Stop offset="1" stopColor="#FFD98A" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={W} height={H} fill="url(#m-sky)" />
      <Circle cx={150} cy={150} r={95} fill="url(#m-sun)" />
      <Path d="M0 172 L40 150 L80 165 L120 140 L165 160 L210 135 L250 158 L295 138 L340 156 L390 132 L390 260 L0 260 Z" fill="#6D82A6" fillOpacity={0.55} />
      <Path d="M0 196 L45 178 L90 192 L140 170 L185 190 L230 172 L280 194 L330 176 L390 190 L390 260 L0 260 Z" fill="#3D5273" fillOpacity={0.85} />
      <Path d="M0 232 L60 214 L120 226 L190 206 L260 222 L320 204 L390 220 L390 260 L0 260 Z" fill="#1E2D42" />
      <Cross x={302} y={150} />
    </>
  );
}

const STARS = [[22, 30], [58, 18], [95, 44], [140, 22], [176, 58], [212, 30], [250, 48], [286, 22], [330, 40], [360, 66], [72, 74], [118, 90], [200, 96], [246, 84], [312, 100], [40, 110], [160, 120], [350, 128], [90, 140], [270, 132]];

function Night() {
  return (
    <>
      <Defs>
        <LinearGradient id="n-sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#070C1F" />
          <Stop offset="0.6" stopColor="#141F45" />
          <Stop offset="1" stopColor="#233260" />
        </LinearGradient>
        <RadialGradient id="n-moon" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFF8DC" />
          <Stop offset="0.5" stopColor="#FFF8DC" stopOpacity={0.35} />
          <Stop offset="1" stopColor="#FFF8DC" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={W} height={H} fill="url(#n-sky)" />
      {STARS.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={i % 4 === 0 ? 1.6 : 1} fill="#FFFFFF" fillOpacity={i % 3 === 0 ? 1 : 0.7} />
      ))}
      <Circle cx={300} cy={72} r={70} fill="url(#n-moon)" />
      <Circle cx={300} cy={72} r={24} fill="#FFF4CF" />
      <Circle cx={292} cy={66} r={4} fill="#F3E6BC" />
      <Circle cx={308} cy={80} r={3} fill="#F3E6BC" />
      <Path d="M0 205 L70 190 L130 200 L200 186 L270 198 L330 184 L390 196 L390 260 L0 260 Z" fill="#0E1730" />
      <Cross x={92} y={132} h={60} w={30} color="#05091A" />
    </>
  );
}

function Sea() {
  return (
    <>
      <Defs>
        <LinearGradient id="s-sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F7B267" />
          <Stop offset="0.5" stopColor="#F4845F" />
          <Stop offset="0.52" stopColor="#2E6F8E" />
          <Stop offset="1" stopColor="#123D5B" />
        </LinearGradient>
        <RadialGradient id="s-sun" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFF1C2" />
          <Stop offset="0.4" stopColor="#FFD27F" stopOpacity={0.9} />
          <Stop offset="1" stopColor="#FFD27F" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={W} height={H} fill="url(#s-sky)" />
      <Circle cx={230} cy={128} r={70} fill="url(#s-sun)" />
      <Circle cx={230} cy={128} r={26} fill="#FFE9A8" />
      {[140, 152, 166, 182, 200, 220].map((y, i) => (
        <Rect key={y} x={230 - 12 - i * 9} y={y} width={24 + i * 18} height={3} rx={1.5} fill="#FFE1A0" fillOpacity={0.55 - i * 0.06} />
      ))}
      <Path d="M0 150 Q40 142 80 150 T160 150 T240 150 T320 150 T400 150 L390 260 L0 260 Z" fill="#1E5A7A" fillOpacity={0.5} />
      <Path d="M0 214 Q30 204 60 214 T120 214 T180 214 T240 214 T300 214 T360 214 T420 214 L390 260 L0 260 Z" fill="#0F3550" fillOpacity={0.85} />
      <Path d="M0 236 Q25 228 50 236 T100 236 T150 236 T200 236 T250 236 T300 236 T350 236 T400 236 L390 260 L0 260 Z" fill="#0B2A40" />
      <Path d="M20 200 L60 176 L110 192 L120 210 L10 214 Z" fill="#0B2333" />
      <Cross x={72} y={128} h={50} w={26} color="#061826" />
    </>
  );
}

function Field() {
  return (
    <>
      <Defs>
        <LinearGradient id="f-sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7FB3E6" />
          <Stop offset="0.6" stopColor="#DCEBF7" />
          <Stop offset="1" stopColor="#FBE7C3" />
        </LinearGradient>
      </Defs>
      <Rect width={W} height={H} fill="url(#f-sky)" />
      <Ellipse cx={80} cy={70} rx={46} ry={16} fill="#FFFFFF" fillOpacity={0.85} />
      <Ellipse cx={104} cy={62} rx={30} ry={14} fill="#FFFFFF" fillOpacity={0.85} />
      <Ellipse cx={250} cy={48} rx={36} ry={12} fill="#FFFFFF" fillOpacity={0.75} />
      <Path d="M0 190 Q90 150 200 180 T390 170 L390 260 L0 260 Z" fill="#8FBF6A" />
      <Path d="M0 220 Q110 190 220 218 T390 206 L390 260 L0 260 Z" fill="#5E9A47" />
      <Path d="M0 244 Q130 224 260 244 T390 236 L390 260 L0 260 Z" fill="#3F7A34" />
      <Rect x={296} y={146} width={44} height={34} fill="#2B2E3A" />
      <Polygon points="292,148 318,128 344,148" fill="#3A3E4C" />
      <Rect x={318} y={112} width={14} height={40} fill="#2B2E3A" />
      <Polygon points="316,114 325,98 334,114" fill="#3A3E4C" />
      <Cross x={325} y={82} h={16} w={9} color="#2B2E3A" />
      <Rect x={314} y={160} width={8} height={18} rx={4} fill="#F5D98B" />
    </>
  );
}

function Dove() {
  return (
    <>
      <Defs>
        <RadialGradient id="d-sky" cx="50%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#FFF6E0" />
          <Stop offset="0.45" stopColor="#F4D9C6" />
          <Stop offset="1" stopColor="#8E7DB8" />
        </RadialGradient>
      </Defs>
      <Rect width={W} height={H} fill="url(#d-sky)" />
      {[-60, -40, -20, 0, 20, 40, 60].map((deg) => (
        <Line key={deg} x1={195} y1={92} x2={195 + 320 * Math.sin((deg * Math.PI) / 180)} y2={92 + 320 * Math.cos((deg * Math.PI) / 180)} stroke="#FFFFFF" strokeWidth={14} strokeOpacity={0.18} />
      ))}
      <Path d="M150 112 C170 96 205 96 222 110 C236 100 250 100 262 108 C246 110 238 118 232 128 C246 132 258 142 262 156 C244 148 226 146 212 152 C210 168 200 178 186 184 C190 170 186 158 178 150 C160 152 146 144 140 130 C150 128 158 130 166 134 C160 126 154 118 150 112 Z" fill="#FFFFFF" />
      <Path d="M196 106 C206 92 224 84 240 90 C226 94 214 104 208 118 Z" fill="#FFFFFF" />
      <Circle cx={252} cy={110} r={2} fill="#7A6A8A" />
      <Path d="M262 111 L272 113 L262 116 Z" fill="#E9A23B" />
      <Cross x={195} y={196} h={44} w={22} color="#5B4A8A" />
    </>
  );
}

function Rain() {
  return (
    <>
      <Defs>
        <LinearGradient id="r-sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4A5670" />
          <Stop offset="1" stopColor="#8E9BB5" />
        </LinearGradient>
        <LinearGradient id="r-shaft" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFF3C4" stopOpacity={0.85} />
          <Stop offset="1" stopColor="#FFF3C4" stopOpacity={0.05} />
        </LinearGradient>
      </Defs>
      <Rect width={W} height={H} fill="url(#r-sky)" />
      <Polygon points="230,0 300,0 360,260 150,260" fill="url(#r-shaft)" />
      {[[60, 70, 70], [120, 60, 52], [300, 66, 64], [350, 74, 46], [200, 54, 44]].map(([cx, cy, rx], i) => (
        <Ellipse key={i} cx={cx} cy={cy} rx={rx} ry={rx * 0.55} fill="#2F3950" fillOpacity={0.9} />
      ))}
      {Array.from({ length: 22 }, (_, i) => (
        <Line key={i} x1={20 + i * 17} y1={100 + (i % 3) * 20} x2={12 + i * 17} y2={126 + (i % 3) * 20} stroke="#DCE6F5" strokeWidth={1.4} strokeOpacity={0.55} />
      ))}
      <Path d="M0 216 L390 208 L390 260 L0 260 Z" fill="#2A3346" />
      <Cross x={262} y={142} h={70} w={34} color="#1A2233" />
    </>
  );
}

function Glass() {
  const cells: [string, string][] = [
    ['0,0 130,0 90,90', '#8E1B3B'],
    ['130,0 260,0 200,100 90,90', '#1F3C88'],
    ['260,0 390,0 390,120 200,100', '#1E6B4E'],
    ['0,0 90,90 40,180 0,150', '#C9891C'],
    ['90,90 200,100 170,190 40,180', '#5B2A86'],
    ['200,100 390,120 390,230 170,190', '#B23A48'],
    ['0,150 40,180 60,260 0,260', '#1F3C88'],
    ['40,180 170,190 150,260 60,260', '#C9891C'],
    ['170,190 390,230 390,260 150,260', '#1E6B4E'],
  ];
  return (
    <>
      <Rect width={W} height={H} fill="#14100E" />
      {cells.map(([pts, fill], i) => (
        <Polygon key={i} points={pts} fill={fill} fillOpacity={0.92} stroke="#14100E" strokeWidth={5} />
      ))}
      <Circle cx={195} cy={130} r={54} fill="#F3D27A" fillOpacity={0.35} stroke="#14100E" strokeWidth={5} />
      <Cross x={195} y={96} h={70} w={40} color="#FFF3C4" />
    </>
  );
}

const pictures: Record<SceneVariant, () => React.ReactElement> = { mountains: Mountains, night: Night, sea: Sea, field: Field, dove: Dove, rain: Rain, glass: Glass };

type Props = {
  variant?: SceneVariant;
  /** Fades the lower part to dark so white text stays readable on top of it. */
  dim?: boolean;
  /** Which side to keep when the box is taller than the picture. */
  align?: 'center' | 'right';
  style?: StyleProp<ViewStyle>;
};

/** One of seven pictures with a cross, drawn as vectors so they ship with the app and scale to any box. */
export function Scene({ variant = 'mountains', dim = false, align = 'center', style }: Props) {
  const Picture = pictures[variant];
  return (
    <View pointerEvents="none" style={style}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio={align === 'right' ? 'xMaxYMid slice' : 'xMidYMid slice'}>
        <Defs>
          <LinearGradient id="scene-dim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0B1526" stopOpacity={0} />
            <Stop offset="0.5" stopColor="#0B1526" stopOpacity={0.3} />
            <Stop offset="1" stopColor="#0B1526" stopOpacity={0.78} />
          </LinearGradient>
        </Defs>
        <Picture />
        {dim ? <Rect width={W} height={H} fill="url(#scene-dim)" /> : null}
      </Svg>
    </View>
  );
}
