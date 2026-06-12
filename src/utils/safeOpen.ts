export function safeOpen(url: string, target: '_blank' | '_self' = '_blank') {
  if (!url)
    return null;

  const opened = window.open(url, target, 'noopener,noreferrer');
  if (opened)
    opened.opener = null;

  return opened;
}
