export function CertTag({ cert }: { cert: string | null }) {
  if (!cert) return <span className="muted">Any</span>
  return <span className="tag">{cert}</span>
}
