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
import { ComponentProps, forwardRef, SVGProps } from "react"

/**
 * Official Google logo icon component
 * Uses the official Google "G" logo with brand colors
 */
const GoogleIconBase = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  function GoogleIcon({ className, ...props }, ref) {
    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        className={className}
        {...props}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    )
  }
)
GoogleIconBase.displayName = "GoogleIcon"

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

/**
 * Creates an animated version of a custom SVG icon
 */
function createAnimatedCustomIcon(Icon: React.ForwardRefExoticComponent<SVGProps<SVGSVGElement> & React.RefAttributes<SVGSVGElement>>) {
  const AnimatedIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
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
  AnimatedIcon.displayName = `Animated${Icon.displayName || "CustomIcon"}`
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

// Export Google icon (both regular and animated versions)
export const GoogleIcon = GoogleIconBase
export const Google = createAnimatedCustomIcon(GoogleIconBase)
