"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { ComponentProps } from "react"

/**
 * Animated icon wrapper component
 * Wraps lucide-react icons with framer-motion animations
 * Provides hover and interaction animations similar to lucide-animated
 */
interface AnimatedIconProps extends ComponentProps<typeof motion.div> {
  icon: LucideIcon
  size?: number | string
  className?: string
  animateOnHover?: boolean
}

export function AnimatedIcon({ 
  icon: Icon, 
  size = 24, 
  className = "",
  animateOnHover = true,
  ...props 
}: AnimatedIconProps) {
  return (
    <motion.div
      whileHover={animateOnHover ? { scale: 1.1, rotate: 5 } : {}}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={className}
      {...props}
    >
      <Icon size={size} />
    </motion.div>
  )
}

/**
 * Direct animated icon components
 * Use these as drop-in replacements for lucide-react icons
 */
export function createAnimatedIcon(Icon: LucideIcon) {
  return function AnimatedIconComponent({ 
    size = 24, 
    className = "",
    ...props 
  }: ComponentProps<LucideIcon>) {
    return (
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="inline-flex items-center justify-center"
      >
        <Icon size={size} className={className} {...props} />
      </motion.div>
    )
  }
}

