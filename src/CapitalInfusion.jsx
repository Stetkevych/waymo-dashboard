import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts'

const COLORS = ['#6366f1','#ec4899','#22c55e','#f97316','#eab308','#06b6d4','#a855f7','#f43f5e','#10b981','#3b82f6','#fb923c','#84cc16','#e879f9','#38bdf8','#4ade80','#fbbf24']
const TS = { background: '#1e1235', border: '1px solid #7c3aed33', borderRadius: 8, color: '#e2e8f0' }

const METRICS = [
  { key: 'Apps', label: 'Apps' },
  { key: 'Approvals', label: 'Approvals' },
  { key: 'Funded_Count', label: 'Funded' },
  { key: 'app_rate', label: 'App→Appr %' },
  { key: 'fund_rate', label: 'Appr→Fund %' },
]

function parseLeadSources(str) {
  if (!str || str === 'No data') return {}
  const out = {}
  str.split(',').forEach(part => {
    const m = part.trim().match(/^(.+)\((\d+)\)$/)
    if (m) out[m[1].trim()] = parseInt(m[2])
  })
  return out
}

function computeStats(records) {
  const apps = records.reduce((s, r) => s + (r.Apps || 0), 0)
  const approvals = records.reduce((s, r) => s + (r.Approvals || 0), 0)
  const funded = records.reduce((s, r) => s + (r.Funded_Count || 0), 0)
  return {
    Apps: apps, Approvals: approvals, Funded_Count: funded,
    app_rate: apps ? +((approvals / apps) * 100).toFixed(1) : 0,
    fund_rate: approvals ? +((funded / approvals) * 100).toFixed(1) : 0,
  }
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
      border: `1px solid ${active ? '#6366f1' : '#ffffff15'}`,
      background: active ? '#6366f133' : 'transparent',
      color: active ? '#a5b4fc' : '#64748b',
    }}>{label}</button>
  )
}

export default function CapitalInfusion() {
  const [raw, setRaw] = useState([])
  const [view, setView] = useState('sources') // sources | reps | chart
  const [metric, setMetric] = useState('Apps')
  const [section, setSection] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState('Apps')
  const [sortDir, setSortDir] = useState(-1)
  const [selectedReps, setSelectedReps] = useState([])
  const [drillSource, setDrillSource] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/capital_infusion.json')
      .then(r => r.json())
      .then(d => { setRaw(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const sections = useMemo(() => ['All', ...new Set(raw.map(r => r.Section).filter(Boolean))], [raw])
  const allReps = useMemo(() => [...new Set(raw.map(r => r.Employee_Name))].sort(), [raw])

  const filtered = useMemo(() => raw.filter(r => {
    if (section !== 'All' && r.Section !== section) return false
    if (dateFrom && r.Month_Start < dateFrom) return false
    if (dateTo && r.Month_Start > dateTo) return false
    return true
  }), [raw, section, dateFrom, dateTo])

  const allMonths = useMemo(() => [...new Set(filtered.map(r => r.Month_Start))].sort(), [filtered])

  // ── Lead Source Performance ──────────────────────────────
  const sourcePerf = useMemo(() => {
    const map = {}
    filtered.forEach(r => {
      const closer = parseLeadSources(r.Closer_All_Lead_Sources)
      const puller = parseLeadSources(r.Puller_All_Lead_Sources)
      const combined = {}
      Object.entries(closer).forEach(([s, c]) => combined[s] = (combined[s] || 0) + c)
      Object.entries(puller).forEach(([s, c]) => combined[s] = (combined[s] || 0) + c)
      Object.entries(combined).forEach(([src]) => {
        if (!map[src]) map[src] = { source: src, records: [], reps: new Set() }
        map[src].records.push(r)
        map[src].reps.add(r.Employee_Name)
      })
    })
    return Object.values(map).map(s => ({
      source: s.source,
      reps: s.reps.size,
      topReps: [...s.reps].slice(0, 3).join(', '),
      ...computeStats(s.records),
    })).sort((a, b) => (b[sortCol] || 0) - (a[sortCol] || 0))
  }, [filtered, sortCol])

  // ── Rep Performance ──────────────────────────────────────
  const repPerf = useMemo(() => {
    const map = {}
    filtered.forEach(r => {
      if (!map[r.Employee_Name]) map[r.Employee_Name] = { name: r.Employee_Name, section: r.Section, records: [] }
      map[r.Employee_Name].records.push(r)
    })
    return Object.values(map).map(r => ({
      name: r.name, section: r.section, ...computeStats(r.records)
    })).sort((a, b) => sortDir * ((b[sortCol] || 0) - (a[sortCol] || 0)))
  }, [filtered, sortCol, sortDir])

  // ── Chart: reps over time ────────────────────────────────
  const chartReps = useMemo(() => {
    if (selectedReps.length) return selectedReps
    return [...repPerf].sort((a, b) => (b[metric] || 0) - (a[metric] || 0)).slice(0, 8).map(r => r.name)
  }, [selectedReps, repPerf, metric])

  const timeSeriesData = useMemo(() => {
    const byMonth = {}
    allMonths.forEach(m => { byMonth[m] = { month: m.slice(0, 7) } })
    filtered.forEach(r => {
      if (!chartReps.includes(r.Employee_Name)) return
      const m = r.Month_Start
      if (!byMonth[m]) return
      const prev = byMonth[m][r.Employee_Name] || { Apps: 0, Approvals: 0, Funded_Count: 0 }
      const apps = prev.Apps + (r.Apps || 0)
      const approvals = prev.Approvals + (r.Approvals || 0)
      const funded = prev.Funded_Count + (r.Funded_Count || 0)
      byMonth[m][r.Employee_Name] = {
        Apps: apps, Approvals: approvals, Funded_Count: funded,
        app_rate: apps ? +((approvals / apps) * 100).toFixed(1) : 0,
        fund_rate: approvals ? +((funded / approvals) * 100).toFixed(1) : 0,
      }
    })
    return Object.values(byMonth).map(row => {
      const out = { month: row.month }
      chartReps.forEach(rep => { out[rep] = row[rep]?.[metric] ?? null })
      const vals = chartReps.map(rep => out[rep]).filter(v => v !== null)
      out.__avg = vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null
      return out
    })
  }, [filtered, allMonths, chartReps, metric])

  // ── Source drilldown over time ───────────────────────────
  const drillData = useMemo(() => {
    if (!drillSource) return []
    const byMonth = {}
    allMonths.forEach(m => { byMonth[m] = { month: m.slice(0, 7), Apps: 0, Approvals: 0, Funded_Count: 0 } })
    filtered.forEach(r => {
      const sources = { ...parseLeadSources(r.Closer_All_Lead_Sources), ...parseLeadSources(r.Puller_All_Lead_Sources) }
      if (!sources[drillSource]) return
      const m = r.Month_Start
      if (!byMonth[m]) return
      byMonth[m].Apps += r.Apps || 0
      byMonth[m].Approvals += r.Approvals || 0
      byMonth[m].Funded_Count += r.Funded_Count || 0
    })
    return Object.values(byMonth).map(row => ({
      ...row,
      app_rate: row.Apps ? +((row.Approvals / row.Apps) * 100).toFixed(1) : 0,
      fund_rate: row.Approvals ? +((row.Funded_Count / row.Approvals) * 100).toFixed(1) : 0,
    }))
  }, [filtered, allMonths, drillSource])

  const filteredSources = useMemo(() => {
    const q = search.toLowerCase()
    return sourcePerf.filter(s => !q || s.source.toLowerCase().includes(q))
  }, [sourcePerf, search])

  const filteredReps = useMemo(() => {
    const q = search.toLowerCase()
    return repPerf.filter(r => !q || r.name.toLowerCase().includes(q))
  }, [repPerf, search])

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => -d)
    else { setSortCol(col); setSortDir(-1) }
  }

  function toggleRep(name) {
    setSelectedReps(prev => prev.includes(name) ? prev.filter(r => r !== name) : [...prev, name])
  }

  const totals = useMemo(() => computeStats(filtered), [filtered])
  const metricLabel = METRICS.find(m => m.key === metric)?.label || metric

  if (loading) return <div className="loading"><div className="spinner" />Loading CI data...</div>

  return (
    <div style={{ padding: '0 0 60px' }}>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <select value={section} onChange={e => setSection(e.target.value)} className="ci-select">
          {sections.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={metric} onChange={e => setMetric(e.target.value)} className="ci-select">
          {METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
        <input type="month" onChange={e => setDateFrom(e.target.value ? e.target.value + '-01' : '')} className="ci-select" />
        <input type="month" onChange={e => setDateTo(e.target.value ? e.target.value + '-01' : '')} className="ci-select" />
        <input placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} className="ci-select" style={{ flex: 1, minWidth: 160 }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[['sources','Lead Sources'],['reps','Reps'],['chart','Chart']].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} className={`ci-btn${view === v ? ' active' : ''}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Reps', val: repPerf.length, color: '#6366f1' },
          { label: 'Total Apps', val: totals.Apps.toLocaleString(), color: '#ec4899' },
          { label: 'Total Approvals', val: totals.Approvals.toLocaleString(), color: '#22c55e' },
          { label: 'Total Funded', val: totals.Funded_Count.toLocaleString(), color: '#f97316' },
          { label: 'App→Appr%', val: totals.app_rate + '%', color: '#eab308' },
          { label: 'Appr→Fund%', val: totals.fund_rate + '%', color: '#06b6d4' },
          { label: 'Lead Sources', val: sourcePerf.length.toLocaleString(), color: '#a855f7' },
        ].map(k => (
          <div key={k.label} style={{ background: '#1e1235', border: '1px solid #7c3aed33', borderRadius: 10, padding: '10px 18px', minWidth: 110 }}>
            <div style={{ color: k.color, fontSize: 22, fontWeight: 700 }}>{k.val}</div>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── LEAD SOURCES VIEW ── */}
      {view === 'sources' && (
        <>
          {drillSource && (
            <div style={{ background: '#1e1235', border: '1px solid #7c3aed33', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 15 }}>📍 {drillSource} — over time</span>
                <button onClick={() => setDrillSource(null)} className="ci-btn">✕ Close</button>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={drillData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={TS} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  <Line type="monotone" dataKey="Apps" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Approvals" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Funded_Count" name="Funded" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: '#1e1235', border: '1px solid #7c3aed33', borderRadius: 12, padding: 20 }}>
              <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 12 }}>Top Sources by {metricLabel}</div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={filteredSources.slice(0, 20)} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis dataKey="source" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={150} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey={metric} radius={[0, 4, 4, 0]} onClick={d => setDrillSource(d.source)} style={{ cursor: 'pointer' }}>
                    {filteredSources.slice(0, 20).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: '#1e1235', border: '1px solid #7c3aed33', borderRadius: 12, padding: 20 }}>
              <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 12 }}>Conversion Rates by Source (top 15)</div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={[...filteredSources].sort((a,b) => b.app_rate - a.app_rate).slice(0,15)} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                  <YAxis dataKey="source" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={150} />
                  <Tooltip contentStyle={TS} formatter={v => v + '%'} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  <Bar dataKey="app_rate" name="App→Appr%" fill="#6366f1" radius={[0,4,4,0]} />
                  <Bar dataKey="fund_rate" name="Appr→Fund%" fill="#22c55e" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: '#1e1235', border: '1px solid #7c3aed33', borderRadius: 12, padding: 20 }}>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>Click any row to drill into that source over time</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {[
                      { col: 'source', label: 'Lead Source' },
                      { col: 'Apps', label: 'Apps' },
                      { col: 'Approvals', label: 'Approvals' },
                      { col: 'app_rate', label: 'App→Appr%' },
                      { col: 'Funded_Count', label: 'Funded' },
                      { col: 'fund_rate', label: 'Appr→Fund%' },
                      { col: 'reps', label: 'Reps' },
                    ].map(({ col, label }) => (
                      <th key={col} onClick={() => handleSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        {label} {sortCol === col ? (sortDir === -1 ? '↓' : '↑') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSources.map((s, i) => (
                    <tr key={i} onClick={() => setDrillSource(s.source)} style={{ cursor: 'pointer', background: drillSource === s.source ? '#6366f115' : undefined }}>
                      <td style={{ color: drillSource === s.source ? '#a5b4fc' : '#e2e8f0', fontWeight: drillSource === s.source ? 600 : 400 }}>{s.source}</td>
                      <td className="num">{s.Apps}</td>
                      <td className="num">{s.Approvals}</td>
                      <td className="num">{s.app_rate}%</td>
                      <td className="num">{s.Funded_Count}</td>
                      <td className="num">{s.fund_rate}%</td>
                      <td className="num">{s.reps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── REPS VIEW ── */}
      {view === 'reps' && (
        <div style={{ background: '#1e1235', border: '1px solid #7c3aed33', borderRadius: 12, padding: 20 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>Click rows to select reps for the Chart view</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {[
                    { col: 'name', label: 'Rep' },
                    { col: 'section', label: 'Section' },
                    { col: 'Apps', label: 'Apps' },
                    { col: 'Approvals', label: 'Approvals' },
                    { col: 'app_rate', label: 'App→Appr%' },
                    { col: 'Funded_Count', label: 'Funded' },
                    { col: 'fund_rate', label: 'Appr→Fund%' },
                  ].map(({ col, label }) => (
                    <th key={col} onClick={() => handleSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      {label} {sortCol === col ? (sortDir === -1 ? '↓' : '↑') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReps.map((r, i) => (
                  <tr key={i} onClick={() => toggleRep(r.name)} style={{ cursor: 'pointer', opacity: selectedReps.length && !selectedReps.includes(r.name) ? 0.35 : 1 }}>
                    <td style={{ color: selectedReps.includes(r.name) ? '#a5b4fc' : '#e2e8f0' }}>{r.name}</td>
                    <td>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10,
                        background: r.section === 'Active' ? '#22c55e22' : r.section === 'Inactive' ? '#f9731622' : '#f43f5e22',
                        color: r.section === 'Active' ? '#86efac' : r.section === 'Inactive' ? '#fdba74' : '#fca5a5'
                      }}>{r.section}</span>
                    </td>
                    <td className="num">{r.Apps}</td>
                    <td className="num">{r.Approvals}</td>
                    <td className="num">{r.app_rate}%</td>
                    <td className="num">{r.Funded_Count}</td>
                    <td className="num">{r.fund_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CHART VIEW ── */}
      {view === 'chart' && (
        <>
          <div style={{ background: '#1e1235', border: '1px solid #7c3aed33', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4, fontSize: 15 }}>
              {metricLabel} Over Time
            </div>
            <div style={{ color: '#64748b', fontSize: 12, marginBottom: 14 }}>
              Showing top 8 by {metricLabel} — select reps in Reps tab to customize
              {selectedReps.length > 0 && <button onClick={() => setSelectedReps([])} className="ci-btn" style={{ marginLeft: 10, padding: '2px 10px', fontSize: 11 }}>Reset</button>}
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timeSeriesData} margin={{ right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={TS} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                {chartReps.map((rep, i) => (
                  <Line key={rep} type="monotone" dataKey={rep} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} connectNulls />
                ))}
                <Line type="monotone" dataKey="__avg" name="— Team Avg" stroke="#ffffff88" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: '#1e1235', border: '1px solid #7c3aed33', borderRadius: 12, padding: 20 }}>
            <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 12 }}>Total {metricLabel} by Rep</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={repPerf.filter(r => chartReps.includes(r.name)).sort((a,b) => (b[metric]||0)-(a[metric]||0))} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={TS} />
                <Bar dataKey={metric} radius={[4,4,0,0]}>
                  {repPerf.filter(r => chartReps.includes(r.name)).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rep chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
            {allReps.map(rep => (
              <Chip key={rep} label={rep} active={selectedReps.includes(rep)} onClick={() => toggleRep(rep)} />
            ))}
          </div>
        </>
      )}

      <style>{`
        .ci-select {
          background: #1e1235; border: 1px solid #7c3aed55; color: #e2e8f0;
          padding: 6px 10px; border-radius: 8px; font-size: 13px; outline: none;
        }
        .ci-btn {
          background: transparent; border: 1px solid #7c3aed55; color: #94a3b8;
          padding: 6px 14px; border-radius: 8px; font-size: 13px; cursor: pointer;
        }
        .ci-btn.active, .ci-btn:hover { background: #6366f133; border-color: #6366f1; color: #a5b4fc; }
      `}</style>
    </div>
  )
}
