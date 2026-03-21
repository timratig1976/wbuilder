const store = new Map<string, string>()

export function savePreview(id: string, html: string) {
  store.set(id, html)
  // Auto-cleanup after 30 minutes
  setTimeout(() => store.delete(id), 30 * 60 * 1000)
}

export function getPreview(id: string): string | undefined {
  return store.get(id)
}
