interface PodiumEntry {
  rank: number
  name: string
  points: number
  highlight?: boolean
}

interface PodiumProps {
  entries: PodiumEntry[]
}

export function Podium({ entries }: PodiumProps) {
  if (entries.length === 0) return null

  const ordered = [1, 0, 2]
    .map((i) => entries[i])
    .filter(Boolean) as PodiumEntry[]

  return (
    <div className="podium">
      {ordered.map((entry) => (
        <div
          key={entry.rank}
          className={`podium__item podium__item--${entry.rank}${entry.highlight ? ' podium__item--self' : ''}`}
        >
          <span className="podium__rank">{entry.rank}</span>
          <span className="podium__name">{entry.name}</span>
          <span className="podium__points">{entry.points}pt</span>
        </div>
      ))}
    </div>
  )
}
