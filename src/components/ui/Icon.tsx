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
export function ModuleIcon({ id, color, size = 56 }: { id: string; color: string; size?: number }) {
  const I = MODULE_ICON[id] ?? BookOpenIcon;
  return (
    <span className="icon-tile" style={{ width: size, height: size, color, ['--tile' as string]: color }} aria-hidden>
      <I size={Math.round(size * 0.56)} weight="duotone" />
    </span>
  );
}
