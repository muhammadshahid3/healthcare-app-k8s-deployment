// Server UTC time deta hai, browser apne local time mein dikhata hai.
export function formatRange(startIso, endIso) {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const date = start.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const t = { hour: '2-digit', minute: '2-digit' }
  return `${date}, ${start.toLocaleTimeString([], t)} - ${end.toLocaleTimeString([], t)}`
}
