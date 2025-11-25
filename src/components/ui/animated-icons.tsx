"use client"

import { motion } from "framer-motion"
import {
  Activity as ActivityIcon,
  AlertCircle as AlertCircleIcon,
  ArrowRight as ArrowRightIcon,
  BarChart as BarChartIcon,
  Bell as BellIcon,
  BellOff as BellOffIcon,
  Camera as CameraIcon,
  CameraOff as CameraOffIcon,
  CheckCircle2 as CheckCircle2Icon,
  Check as CheckIconBase,
  ChevronDown as ChevronDownIconBase,
  ChevronRight as ChevronRightIconBase,
  ChevronUp as ChevronUpIconBase,
  Circle as CircleIconBase,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Github as GithubIcon,
  Globe as GlobeIcon,
  Heart as HeartIcon,
  Home as HomeIcon,
  Languages as LanguagesIcon,
  Loader2 as Loader2Icon,
  LogIn as LogInIcon,
  LogOut as LogOutIcon,
  Mail as MailIcon,
  Maximize2 as Maximize2Icon,
  Menu as MenuIcon,
  Mic as MicIcon,
  Palette as PaletteIcon,
  Pause as PauseIcon,
  Play as PlayIcon,
  Plug as PlugIcon,
  RotateCcw as RotateCcwIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  Sparkles as SparklesIcon,
  Square as SquareIcon,
  Type as TypeIcon,
  User as UserIcon,
  Volume2 as Volume2Icon,
  VolumeX as VolumeXIcon,
  X as XIconBase,
  Zap as ZapIcon,
  CircleCheck as CircleCheckIconBase,
  Info as InfoIconBase,
  OctagonX as OctagonXIconBase,
  TriangleAlert as TriangleAlertIconBase,
  type LucideIcon,
} from "lucide-react"
import { ComponentProps, forwardRef } from "react"

/**
 * Creates an animated version of a Lucide icon
 * Wraps the icon with framer-motion for hover and interaction animations
 */
function createAnimatedIcon(Icon: LucideIcon) {
  const AnimatedIcon = forwardRef<SVGSVGElement, ComponentProps<LucideIcon>>(
    function AnimatedIconComponent({ className, ...props }, ref) {
      return (
        <motion.span
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="inline-flex items-center justify-center"
        >
          <Icon ref={ref} className={className} {...props} />
        </motion.span>
      )
    }
  )
  AnimatedIcon.displayName = `Animated${Icon.displayName || Icon.name}`
  return AnimatedIcon
}

// Export animated versions of all icons used in the project
export const Activity = createAnimatedIcon(ActivityIcon)
export const AlertCircle = createAnimatedIcon(AlertCircleIcon)
export const ArrowRight = createAnimatedIcon(ArrowRightIcon)
export const BarChart = createAnimatedIcon(BarChartIcon)
export const Bell = createAnimatedIcon(BellIcon)
export const BellOff = createAnimatedIcon(BellOffIcon)
export const Camera = createAnimatedIcon(CameraIcon)
export const CameraOff = createAnimatedIcon(CameraOffIcon)
export const CheckCircle2 = createAnimatedIcon(CheckCircle2Icon)
export const CheckIcon = createAnimatedIcon(CheckIconBase)
export const ChevronDownIcon = createAnimatedIcon(ChevronDownIconBase)
export const ChevronRightIcon = createAnimatedIcon(ChevronRightIconBase)
export const ChevronUpIcon = createAnimatedIcon(ChevronUpIconBase)
export const CircleIcon = createAnimatedIcon(CircleIconBase)
export const Eye = createAnimatedIcon(EyeIcon)
export const EyeOff = createAnimatedIcon(EyeOffIcon)
export const Github = createAnimatedIcon(GithubIcon)
export const Globe = createAnimatedIcon(GlobeIcon)
export const Heart = createAnimatedIcon(HeartIcon)
export const Home = createAnimatedIcon(HomeIcon)
export const Languages = createAnimatedIcon(LanguagesIcon)
export const Loader2 = createAnimatedIcon(Loader2Icon)
export const LogIn = createAnimatedIcon(LogInIcon)
export const LogOut = createAnimatedIcon(LogOutIcon)
export const Mail = createAnimatedIcon(MailIcon)
export const Maximize2 = createAnimatedIcon(Maximize2Icon)
export const Menu = createAnimatedIcon(MenuIcon)
export const Mic = createAnimatedIcon(MicIcon)
export const Palette = createAnimatedIcon(PaletteIcon)
export const Pause = createAnimatedIcon(PauseIcon)
export const Play = createAnimatedIcon(PlayIcon)
export const Plug = createAnimatedIcon(PlugIcon)
export const RotateCcw = createAnimatedIcon(RotateCcwIcon)
export const Send = createAnimatedIcon(SendIcon)
export const Settings = createAnimatedIcon(SettingsIcon)
export const Sparkles = createAnimatedIcon(SparklesIcon)
export const Square = createAnimatedIcon(SquareIcon)
export const Type = createAnimatedIcon(TypeIcon)
export const User = createAnimatedIcon(UserIcon)
export const Volume2 = createAnimatedIcon(Volume2Icon)
export const VolumeX = createAnimatedIcon(VolumeXIcon)
export const X = createAnimatedIcon(XIconBase)
export const XIcon = createAnimatedIcon(XIconBase)
export const Zap = createAnimatedIcon(ZapIcon)
export const CircleCheckIcon = createAnimatedIcon(CircleCheckIconBase)
export const InfoIcon = createAnimatedIcon(InfoIconBase)
export const OctagonXIcon = createAnimatedIcon(OctagonXIconBase)
export const TriangleAlertIcon = createAnimatedIcon(TriangleAlertIconBase)
