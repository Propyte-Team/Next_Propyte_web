/**
 * Canonical icon registry — Propyte
 *
 * 1. Iconos rediseñados por la diseñadora se re-exportan desde `./propyte-icons`.
 * 2. Iconos sin versión Propyte aún se pasan desde `lucide-react` (fallback).
 * 3. Algunos archivos Propyte usan un nombre custom (gym, lock-keyhole, etc.) y se
 *    re-exportan bajo el nombre de lucide para que el sitio funcione sin codemod
 *    semántico ("gym" cubre <Dumbbell />, "lock-keyhole" cubre <Lock />, etc.).
 *
 * Consumir SIEMPRE desde `@/lib/icons`, no desde `lucide-react` directo, para que
 * los reemplazos lleguen en automático cuando la diseñadora entregue más SVGs.
 */

// ---------------------------------------------------------------------------
// Propyte iconos — match directo (nombre Propyte = nombre lucide)
// ---------------------------------------------------------------------------
export {
  ArrowLeft,
  ArrowRight,
  Bath,
  Bed,
  Bike,
  Building2,
  Calendar,
  Car,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  CreditCard,
  DollarSign,
  Download,
  FileDown,
  FileText,
  Flame,
  Globe,
  Heart,
  Home,
  Languages,
  Laptop,
  Mail,
  MapPin,
  Maximize,
  MessageCircle,
  PawPrint,
  Pencil,
  Phone,
  Play,
  Search,
  Share2,
  Shield,
  Sun,
  Tag,
  TrendingUp,
  Users,
  Wifi,
  Wind,
  Zap,
} from './propyte-icons';

// ---------------------------------------------------------------------------
// Propyte iconos — remap (archivo custom Propyte → nombre lucide)
// ---------------------------------------------------------------------------
export {
  Gym as Dumbbell,
  LockKeyhole as Lock,
  KeySquare as Key,
  KeySquare as KeyRound,
  CircleX as X,
  ChartColumnDecreasing as TrendingDown,
  Forward as ArrowUpRight,
  WavesHorizontal as Waves,
  FileQuestionMark as HelpCircle,
  ArrowDownUp as ArrowUpDown,
  Cook as ChefHat,
  Headset as Headphones,
  Parking as ParkingCircle,
  Utensils as UtensilsCrossed,
} from './propyte-icons';

// ---------------------------------------------------------------------------
// Propyte iconos — disponibles bajo su nombre nativo (para uso opcional)
// ---------------------------------------------------------------------------
export {
  Box,
  Cctv,
  ChartColumnDecreasing,
  CircleX,
  Cook,
  DoorClosed,
  FileChartColumnIncreasing,
  FileQuestionMark,
  Folder,
  Forward,
  Frown,
  Ghost,
  Gym,
  Headset,
  House,
  KeySquare,
  LockKeyhole,
  MessageSquareMore,
  Parking,
  Plant,
  Spa,
  SquaresExclude,
  User,
  Utensils,
  WavesHorizontal,
  WavesLadder,
  Yoga,
  ArrowDownUp,
} from './propyte-icons';

// ---------------------------------------------------------------------------
// Lucide fallback — iconos que aún no tienen versión Propyte
//
// Cada uno se envuelve para forzar `strokeWidth=1.5` por default y empatar
// visualmente con los iconos Propyte (que también renderizan a 1.5 por
// default desde createIcon). Si un consumidor pasa `strokeWidth={X}` explícito
// éste gana porque los props van después del default.
//
// Cuando la diseñadora entregue una versión Propyte, mover el nombre al bloque
// Propyte de arriba — los consumidores no cambian de path.
// ---------------------------------------------------------------------------
import { forwardRef } from 'react';
import * as Lucide from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';

const withDefaultStroke = (Icon: LucideIcon, displayName: string): LucideIcon => {
  const Wrapped = forwardRef<SVGSVGElement, LucideProps>(function LucideWithStroke(
    props,
    ref,
  ) {
    return <Icon strokeWidth={1.5} {...props} ref={ref} />;
  }) as unknown as LucideIcon;
  Wrapped.displayName = displayName;
  return Wrapped;
};

export const Activity = withDefaultStroke(Lucide.Activity, 'Activity');
export const AlertCircle = withDefaultStroke(Lucide.AlertCircle, 'AlertCircle');
export const AlertTriangle = withDefaultStroke(Lucide.AlertTriangle, 'AlertTriangle');
export const ArrowDown = withDefaultStroke(Lucide.ArrowDown, 'ArrowDown');
export const ArrowLeftRight = withDefaultStroke(Lucide.ArrowLeftRight, 'ArrowLeftRight');
export const ArrowUp = withDefaultStroke(Lucide.ArrowUp, 'ArrowUp');
export const Award = withDefaultStroke(Lucide.Award, 'Award');
export const BadgeCheck = withDefaultStroke(Lucide.BadgeCheck, 'BadgeCheck');
export const Banknote = withDefaultStroke(Lucide.Banknote, 'Banknote');
export const BarChart3 = withDefaultStroke(Lucide.BarChart3, 'BarChart3');
// Bike → Propyte (re-export arriba)
export const Bookmark = withDefaultStroke(Lucide.Bookmark, 'Bookmark');
export const BookOpen = withDefaultStroke(Lucide.BookOpen, 'BookOpen');
export const Brain = withDefaultStroke(Lucide.Brain, 'Brain');
export const Briefcase = withDefaultStroke(Lucide.Briefcase, 'Briefcase');
export const Building = withDefaultStroke(Lucide.Building, 'Building');
export const Calculator = withDefaultStroke(Lucide.Calculator, 'Calculator');
export const Camera = withDefaultStroke(Lucide.Camera, 'Camera');
// Car, ChefHat → Propyte (re-exports arriba)
export const CheckCircle2 = withDefaultStroke(Lucide.CheckCircle2, 'CheckCircle2');
export const ChevronUp = withDefaultStroke(Lucide.ChevronUp, 'ChevronUp');
export const ClipboardCheck = withDefaultStroke(Lucide.ClipboardCheck, 'ClipboardCheck');
export const Compass = withDefaultStroke(Lucide.Compass, 'Compass');
export const Copy = withDefaultStroke(Lucide.Copy, 'Copy');
export const Cross = withDefaultStroke(Lucide.Cross, 'Cross');
export const Crosshair = withDefaultStroke(Lucide.Crosshair, 'Crosshair');
export const Crown = withDefaultStroke(Lucide.Crown, 'Crown');
export const Database = withDefaultStroke(Lucide.Database, 'Database');
export const Gem = withDefaultStroke(Lucide.Gem, 'Gem');
export const ExternalLink = withDefaultStroke(Lucide.ExternalLink, 'ExternalLink');
export const Eye = withDefaultStroke(Lucide.Eye, 'Eye');
export const EyeOff = withDefaultStroke(Lucide.EyeOff, 'EyeOff');
export const Facebook = withDefaultStroke(Lucide.Facebook, 'Facebook');
export const FileCheck = withDefaultStroke(Lucide.FileCheck, 'FileCheck');
export const FileCode = withDefaultStroke(Lucide.FileCode, 'FileCode');
export const FileImage = withDefaultStroke(Lucide.FileImage, 'FileImage');
export const Filter = withDefaultStroke(Lucide.Filter, 'Filter');
export const Flower2 = withDefaultStroke(Lucide.Flower2, 'Flower2');
export const Gamepad2 = withDefaultStroke(Lucide.Gamepad2, 'Gamepad2');
export const Gauge = withDefaultStroke(Lucide.Gauge, 'Gauge');
export const GitCompare = withDefaultStroke(Lucide.GitCompare, 'GitCompare');
export const GraduationCap = withDefaultStroke(Lucide.GraduationCap, 'GraduationCap');
export const Hammer = withDefaultStroke(Lucide.Hammer, 'Hammer');
export const Handshake = withDefaultStroke(Lucide.Handshake, 'Handshake');
export const HardHat = withDefaultStroke(Lucide.HardHat, 'HardHat');
// Headphones → Propyte Headset (re-export arriba)
export const Image = withDefaultStroke(Lucide.Image, 'Image');
export const ImageIcon = withDefaultStroke(Lucide.Image, 'ImageIcon');
export const Info = withDefaultStroke(Lucide.Info, 'Info');
export const Instagram = withDefaultStroke(Lucide.Instagram, 'Instagram');
export const Landmark = withDefaultStroke(Lucide.Landmark, 'Landmark');
export const Layers = withDefaultStroke(Lucide.Layers, 'Layers');
export const Layout = withDefaultStroke(Lucide.Layout, 'Layout');
export const LayoutGrid = withDefaultStroke(Lucide.LayoutGrid, 'LayoutGrid');
export const Leaf = withDefaultStroke(Lucide.Leaf, 'Leaf');
export const Link2 = withDefaultStroke(Lucide.Link2, 'Link2');
export const Linkedin = withDefaultStroke(Lucide.Linkedin, 'Linkedin');
export const List = withDefaultStroke(Lucide.List, 'List');
export const Loader2 = withDefaultStroke(Lucide.Loader2, 'Loader2');
export const Map = withDefaultStroke(Lucide.Map, 'Map');
export const Maximize2 = withDefaultStroke(Lucide.Maximize2, 'Maximize2');
export const Megaphone = withDefaultStroke(Lucide.Megaphone, 'Megaphone');
export const Menu = withDefaultStroke(Lucide.Menu, 'Menu');
export const Minus = withDefaultStroke(Lucide.Minus, 'Minus');
export const Monitor = withDefaultStroke(Lucide.Monitor, 'Monitor');
export const Move3D = withDefaultStroke(Lucide.Move3D, 'Move3D');
export const Palette = withDefaultStroke(Lucide.Palette, 'Palette');
export const Palmtree = withDefaultStroke(Lucide.Palmtree, 'Palmtree');
// ParkingCircle → Propyte Parking (re-export arriba)
export const Percent = withDefaultStroke(Lucide.Percent, 'Percent');
export const Plane = withDefaultStroke(Lucide.Plane, 'Plane');
export const Plus = withDefaultStroke(Lucide.Plus, 'Plus');
export const Redo2 = withDefaultStroke(Lucide.Redo2, 'Redo2');
export const RefreshCw = withDefaultStroke(Lucide.RefreshCw, 'RefreshCw');
export const Rocket = withDefaultStroke(Lucide.Rocket, 'Rocket');
export const RotateCcw = withDefaultStroke(Lucide.RotateCcw, 'RotateCcw');
export const Ruler = withDefaultStroke(Lucide.Ruler, 'Ruler');
export const Save = withDefaultStroke(Lucide.Save, 'Save');
export const ScrollText = withDefaultStroke(Lucide.ScrollText, 'ScrollText');
export const Send = withDefaultStroke(Lucide.Send, 'Send');
export const ShieldCheck = withDefaultStroke(Lucide.ShieldCheck, 'ShieldCheck');
export const ShoppingCart = withDefaultStroke(Lucide.ShoppingCart, 'ShoppingCart');
export const SlidersHorizontal = withDefaultStroke(Lucide.SlidersHorizontal, 'SlidersHorizontal');
export const SortAsc = withDefaultStroke(Lucide.SortAsc, 'SortAsc');
export const SortDesc = withDefaultStroke(Lucide.SortDesc, 'SortDesc');
export const Sparkles = withDefaultStroke(Lucide.Sparkles, 'Sparkles');
export const Square = withDefaultStroke(Lucide.Square, 'Square');
export const Star = withDefaultStroke(Lucide.Star, 'Star');
export const StarHalf = withDefaultStroke(Lucide.StarHalf, 'StarHalf');
export const Store = withDefaultStroke(Lucide.Store, 'Store');
// Sun → Propyte (re-export arriba)
export const Target = withDefaultStroke(Lucide.Target, 'Target');
export const Trash2 = withDefaultStroke(Lucide.Trash2, 'Trash2');
export const Trees = withDefaultStroke(Lucide.Trees, 'Trees');
export const TreePine = withDefaultStroke(Lucide.TreePine, 'TreePine');
export const Truck = withDefaultStroke(Lucide.Truck, 'Truck');
export const Twitter = withDefaultStroke(Lucide.Twitter, 'Twitter');
export const Undo2 = withDefaultStroke(Lucide.Undo2, 'Undo2');
export const Unlock = withDefaultStroke(Lucide.Unlock, 'Unlock');
export const Upload = withDefaultStroke(Lucide.Upload, 'Upload');
export const UserCheck = withDefaultStroke(Lucide.UserCheck, 'UserCheck');
// UtensilsCrossed → Propyte Utensils (re-export arriba)
export const Video = withDefaultStroke(Lucide.Video, 'Video');
export const Volume2 = withDefaultStroke(Lucide.Volume2, 'Volume2');
export const VolumeX = withDefaultStroke(Lucide.VolumeX, 'VolumeX');
// Wifi → Propyte (re-export arriba)
export const Wrench = withDefaultStroke(Lucide.Wrench, 'Wrench');
export const Youtube = withDefaultStroke(Lucide.Youtube, 'Youtube');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type { LucideIcon, LucideProps } from 'lucide-react';
