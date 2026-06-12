export function devWarn(message: string, context?: unknown) {
  if (!import.meta.env.DEV)
    return

  if (context === undefined)
    console.warn(message)
  else
    console.warn(message, context)
}

export function devError(message: string, context?: unknown) {
  if (!import.meta.env.DEV)
    return

  if (context === undefined)
    console.error(message)
  else
    console.error(message, context)
}
