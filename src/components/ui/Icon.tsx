import type { Icon as PhIcon } from '@phosphor-icons/react';
import {
  PackageIcon, DatabaseIcon, LinkIcon, StackIcon, HardDrivesIcon, TargetIcon, LightningIcon, FactoryIcon, ShuffleIcon, HouseIcon,
  BrainIcon, CompassIcon, PhoneIcon, LockKeyIcon, TagIcon, HourglassIcon, GlobeHemisphereWestIcon, GearIcon, ChatCircleIcon, FileTextIcon,
  DoorIcon, TrafficSignIcon, TestTubeIcon, RocketLaunchIcon, KeyIcon, PuzzlePieceIcon, CheckCircleIcon, PlugsConnectedIcon, IdentificationCardIcon,
  ClipboardTextIcon, ReceiptIcon, BuildingsIcon, SyringeIcon, LockIcon, CloudIcon, CubeIcon, GameControllerIcon, ShieldCheckIcon, EnvelopeIcon,
  MailboxIcon, ChefHatIcon, FileTsIcon, UserIcon, HandshakeIcon, TicketIcon, FoldersIcon, ListNumbersIcon, TextAaIcon, LaptopIcon,
  MagnifyingGlassIcon, RepeatIcon, BroomIcon, CameraIcon, MagicWandIcon, CookieIcon, BooksIcon, BankIcon, DnaIcon, DeviceMobileIcon,
  FilmSlateIcon, TrayIcon, DownloadSimpleIcon, EyeIcon, BrowsersIcon, FileCSharpIcon, TerminalWindowIcon, GitBranchIcon, MapTrifoldIcon,
  ArrowsLeftRightIcon, CpuIcon, BracketsCurlyIcon, WifiHighIcon, TableIcon, KeyboardIcon, WarningIcon, QuestionIcon, BugIcon, ScalesIcon,
  CalendarIcon, PaperPlaneTiltIcon, ChartLineUpIcon, MegaphoneIcon, TreeStructureIcon, BookOpenIcon, FloppyDiskIcon, UsersThreeIcon,
} from '@phosphor-icons/react';

// Una sola familia de iconos (Phosphor, estilo duotone) en toda la interfaz.

/** Emojis del contenido → icono SVG equivalente. Si un emoji no está aquí, se muestra tal cual. */
const EMOJI: Record<string, PhIcon> = {
  '📦': PackageIcon, '🗄️': DatabaseIcon, '🔗': LinkIcon, '🧱': StackIcon, '🖥️': HardDrivesIcon, '🎯': TargetIcon, '⚡': LightningIcon,
  '🏭': FactoryIcon, '🔀': ShuffleIcon, '🏠': HouseIcon, '🧠': BrainIcon, '🧭': CompassIcon, '📞': PhoneIcon, '🔐': LockKeyIcon,
  '🏷️': TagIcon, '⏳': HourglassIcon, '🌐': GlobeHemisphereWestIcon, '⚙️': GearIcon, '💬': ChatCircleIcon, '📄': FileTextIcon,
  '🚪': DoorIcon, '🚦': TrafficSignIcon, '🧪': TestTubeIcon, '🚀': RocketLaunchIcon, '🔑': KeyIcon, '🧩': PuzzlePieceIcon,
  '✅': CheckCircleIcon, '🔌': PlugsConnectedIcon, '🪪': IdentificationCardIcon, '📋': ClipboardTextIcon, '🧾': ReceiptIcon,
  '🏢': BuildingsIcon, '💉': SyringeIcon, '🔒': LockIcon, '☁️': CloudIcon, '🐳': CubeIcon, '🎮': GameControllerIcon,
  '🛡️': ShieldCheckIcon, '📨': EnvelopeIcon, '📮': MailboxIcon, '🧑‍🍳': ChefHatIcon, '🟦': FileTsIcon, '🧑': UserIcon,
  '🤝': HandshakeIcon, '🎟️': TicketIcon, '🗂️': FoldersIcon, '📑': ListNumbersIcon, '🔤': TextAaIcon, '💻': LaptopIcon,
  '🔍': MagnifyingGlassIcon, '🔁': RepeatIcon, '🟪': FileCSharpIcon, '🧹': BroomIcon, '📸': CameraIcon, '🧑‍💻': LaptopIcon,
  '🪄': MagicWandIcon, '🍪': CookieIcon, '📚': BooksIcon, '🏦': BankIcon, '👀': EyeIcon, '🧬': DnaIcon, '📱': DeviceMobileIcon,
  '🎬': FilmSlateIcon, '📬': TrayIcon, '📥': DownloadSimpleIcon, '🐧': TerminalWindowIcon, '🌳': GitBranchIcon, '🌿': GitBranchIcon,
  '🗺️': MapTrifoldIcon, '⌨️': KeyboardIcon, '⚠️': WarningIcon, '❓': QuestionIcon, '🦠': BugIcon, '⚖️': ScalesIcon, '📖': BookOpenIcon,
  '📣': MegaphoneIcon, '💾': FloppyDiskIcon, '👤': UserIcon, '📊': ChartLineUpIcon, '📡': WifiHighIcon, '✉️': PaperPlaneTiltIcon,
  '🏗️': TreeStructureIcon, '🏘️': UsersThreeIcon, '📍': TargetIcon, '🕰️': CalendarIcon,
};

/** Icono propio de cada módulo. */
export const MODULE_ICON: Record<string, PhIcon> = {
  internet: GlobeHemisphereWestIcon, 'request-response': ArrowsLeftRightIcon, server: HardDrivesIcon, 'data-flow': StackIcon,
  memory: CpuIcon, databases: DatabaseIcon, apis: BracketsCurlyIcon, auth: LockKeyIcon, caching: LightningIcon, security: ShieldCheckIcon,
  architecture: BuildingsIcon, networking: WifiHighIcon, linux: TerminalWindowIcon, git: GitBranchIcon, testing: TestTubeIcon,
  devops: CubeIcon, roadmap: MapTrifoldIcon, typescript: FileTsIcon, csharp: FileCSharpIcon, aspnet: BrowsersIcon, efcore: TableIcon,
};

/**
 * Muestra el icono SVG equivalente a un emoji (decorativo: aria-hidden).
 * Si no hay equivalente, cae al emoji para no perder información.
 */
export function Glyph({ emoji, size = 24, color }: { emoji?: string; size?: number; color?: string }) {
  if (!emoji) return null;
  const I = EMOJI[emoji];
  if (!I) return <span aria-hidden style={{ fontSize: size * 0.9, lineHeight: 1 }}>{emoji}</span>;
  return <I size={size} weight="duotone" color={color} aria-hidden style={{ flex: 'none' }} />;
}

/** Recuadro de color con el icono de un módulo. */
/** Recuadro con el icono de un módulo. Todos usan el mismo acento: el color no compite con el contenido. */
export function ModuleIcon({ id, size = 56 }: { id: string; color?: string; size?: number }) {
  const I = MODULE_ICON[id] ?? BookOpenIcon;
  return (
    <span className="icon-tile" style={{ width: size, height: size, color: 'var(--primary-2)', ['--tile' as string]: 'var(--primary)' }} aria-hidden>
      <I size={Math.round(size * 0.56)} weight="duotone" />
    </span>
  );
}

// ---------------------------------------------------------------------
// Iconos de interfaz con nombres cortos: <Ic n="check" />
// ---------------------------------------------------------------------
import {
  CheckIcon, XIcon, ConfettiIcon, LightbulbIcon, ArrowCounterClockwiseIcon, TrophyIcon, StarIcon, BarbellIcon, ArrowsClockwiseIcon,
  ArrowLeftIcon, ArrowRightIcon, PlusIcon, DiceFiveIcon, SparkleIcon, EyeSlashIcon, TrashIcon, FireIcon, ClockIcon, UploadSimpleIcon,
  CopyIcon, ShareNetworkIcon, FolderIcon, QuestionMarkIcon, HandWavingIcon, PlayIcon, PauseIcon, SkipForwardIcon, SkipBackIcon,
  ProhibitIcon, CardsIcon, XCircleIcon, FlaskIcon, CodeIcon, ArrowsLeftRightIcon as SwapIcon,
} from '@phosphor-icons/react';

const UI: Record<string, PhIcon> = {
  check: CheckIcon, checkCircle: CheckCircleIcon, x: XIcon, xCircle: XCircleIcon, celebrate: ConfettiIcon, repeat: RepeatIcon, bulb: LightbulbIcon,
  reset: ArrowCounterClockwiseIcon, trophy: TrophyIcon, star: StarIcon, muscle: BarbellIcon, brain: BrainIcon, flip: ArrowsClockwiseIcon,
  lightning: LightningIcon, puzzle: PuzzlePieceIcon, globe: GlobeHemisphereWestIcon, laptop: LaptopIcon, flask: FlaskIcon, code: CodeIcon,
  left: ArrowLeftIcon, right: ArrowRightIcon, eye: EyeIcon, plus: PlusIcon, dice: DiceFiveIcon, box: PackageIcon, sparkle: SparkleIcon,
  books: BooksIcon, eyeSlash: EyeSlashIcon, map: MapTrifoldIcon, target: TargetIcon, trash: TrashIcon, fire: FireIcon, clock: ClockIcon,
  upload: UploadSimpleIcon, download: DownloadSimpleIcon, link: LinkIcon, copy: CopyIcon, share: ShareNetworkIcon, phone: DeviceMobileIcon,
  folder: FolderIcon, swap: SwapIcon, question: QuestionMarkIcon, wave: HandWavingIcon, play: PlayIcon, pause: PauseIcon,
  next: SkipForwardIcon, prev: SkipBackIcon, gear: GearIcon, stop: ProhibitIcon, cards: CardsIcon, chart: ChartLineUpIcon,
  save: FloppyDiskIcon, warn: WarningIcon, stack: StackIcon, file: FileTsIcon, csharp: FileCSharpIcon, users: UsersThreeIcon,
};

export type IcName = keyof typeof UI;

/** Icono de interfaz. Decorativo por defecto (aria-hidden); con `label` se anuncia a lectores de pantalla. */
export function Ic({ n, size = 20, color, weight = 'duotone', label }: { n: IcName; size?: number; color?: string; weight?: 'duotone' | 'regular' | 'bold' | 'fill'; label?: string }) {
  const I = UI[n];
  return label ? <I size={size} color={color} weight={weight} role="img" aria-label={label} /> : <I size={size} color={color} weight={weight} aria-hidden style={{ flex: 'none' }} />;
}

/** Recuadro grande con icono (cabeceras de pantallas de resultado, estados vacíos…). */
export function IcTile({ n, color = 'var(--primary-2)', size = 64 }: { n: IcName; color?: string; size?: number }) {
  return (
    <span className="icon-tile" style={{ width: size, height: size, color, ['--tile' as string]: color }} aria-hidden>
      <Ic n={n} size={Math.round(size * 0.56)} />
    </span>
  );
}
