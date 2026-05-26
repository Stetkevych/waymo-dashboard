import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#a855f7']
const fmt = (n) => {
  if (!n) return '$0'
  const abs = Math.abs(n)
  const s = n < 0 ? '-' : ''
  if (abs >= 1000000) return `${s}$${(abs/1000000).toFixed(1)}M`
  if (abs >= 1000) return `${s}$${(abs/1000).toFixed(0)}K`
  return `${s}$${abs.toFixed(0)}`
}

export default function Reps() {
  const [analytics, setAnalytics] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/analytics.json').then(r => r.json()).then(d => {
      setAnalytics(d)
      if (d.rep_stats?.length) setSelected(d.rep_stats[0].name)
    })
  }, [])

  if (!analytics) return <div style={{padding:40,color:'#94a3b8'}}>Loading rep data...</div>

  const reps = (analytics.rep_stats || []).filter(r => r.net_calls > 0 || r.funded > 0)
  const T = analytics.team_totals || {}

  const totalCalls    = reps.reduce((s,r) => s + (r.net_calls||0), 0)
  const totalApps     = reps.reduce((s,r) => s + (r.apps||0), 0)
  const totalApprovals= reps.reduce((s,r) => s + (r.approvals||0), 0)
  const totalFunded   = reps.reduce((s,r) => s + (r.funded||0), 0)
  const totalFundAmt  = reps.reduce((s,r) => s + (r.fund_amount||0), 0)

  const selectedRep = reps.find(r => r.name === selected)

  // Radar data for selected rep
  const radarData = selectedRep ? [
    { metric: 'Calls',      value: Math.min(100, Math.round((selectedRep.net_calls / (totalCalls/reps.length)) * 50)) },
    { metric: 'Apps',       value: Math.min(100, Math.round((selectedRep.apps / Math.max(1, totalApps/reps.length)) * 50)) },
    { metric: 'Approvals',  value: Math.min(100, Math.round((selectedRep.approvals / Math.max(1, totalApprovals/reps.length)) * 50)) },
    { metric: 'Conv %',     value: Math.min(100, Math.round(selectedRep.call_to_app * 3)) },
    { metric: 'Funded',     value: Math.min(100, selectedRep.funded * 20) },
    { metric: 'Revenue',    value: Math.min(100, Math.round((selectedRep.revenue / Math.max(1, T.revenue/reps.length)) * 50)) },
  ] : []

  return (
    <div>
      {/* KPIs */}
      <div className="kpi-grid" style={{marginBottom:24}}>
        <div className="kpi" style={{borderColor:'#6366f1'}}><div className="kpi-value" style={{color:'#6366f1'}}>{reps.length}</div><div className="kpi-label">Active Reps</div></div>
        <div className="kpi" style={{borderColor:'#ec4899'}}><div className="kpi-value" style={{color:'#ec4899'}}>{totalCalls}</div><div className="kpi-label">Net Calls</div></div>
        <div className="kpi" style={{borderColor:'#06b6d4'}}><div className="kpi-value" style={{color:'#06b6d4'}}>{totalApps}</div><div className="kpi-label">Apps</div></div>
        <div className="kpi" style={{borderColor:'#8b5cf6'}}><div className="kpi-value" style={{color:'#8b5cf6'}}>{totalApprovals}</div><div className="kpi-label">Approvals</div></div>
        <div className="kpi" style={{borderColor:'#eab308'}}><div className="kpi-value" style={{color:'#eab308'}}>{totalFunded}</div><div className="kpi-label">Funded</div></div>
        <div className="kpi" style={{borderColor:'#a855f7'}}><div className="kpi-value" style={{color:'#a855f7'}}>{fmt(totalFundAmt)}</div><div className="kpi-label">Fund Amount</div></div>
      </div>

      {/* Charts grid */}
      <div className="charts-grid" style={{marginBottom:24}}>

        {/* Net Calls by Rep */}
        <div className="section">
          <h2 className="section-title">Net Calls by Rep</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[...reps].sort((a,b)=>b.net_calls-a.net_calls)} margin={{bottom:60}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10"/>
              <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:10}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fill:'#94a3b8',fontSize:11}}/>
              <Tooltip contentStyle={{background:'#1e1235',border:'1px solid #7c3aed33',borderRadius:8}}/>
              <Bar dataKey="net_calls" radius={[4,4,0,0]}>
                {reps.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Apps by Rep */}
        <div className="section">
          <h2 className="section-title">Apps (Calendly Bookings) by Rep</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[...reps].sort((a,b)=>b.apps-a.apps).filter(r=>r.apps>0)} margin={{bottom:60}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10"/>
              <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:10}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fill:'#94a3b8',fontSize:11}}/>
              <Tooltip contentStyle={{background:'#1e1235',border:'1px solid #7c3aed33',borderRadius:8}}/>
              <Bar dataKey="apps" fill="#06b6d4" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Call to App % */}
        <div className="section">
          <h2 className="section-title">Call → App Conversion % by Rep</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[...reps].filter(r=>r.net_calls>0).sort((a,b)=>b.call_to_app-a.call_to_app)} margin={{bottom:60}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10"/>
              <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:10}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fill:'#94a3b8',fontSize:11}} unit="%"/>
              <Tooltip contentStyle={{background:'#1e1235',border:'1px solid #7c3aed33',borderRadius:8}} formatter={v=>`${v}%`}/>
              <Bar dataKey="call_to_app" radius={[4,4,0,0]}>
                {reps.map((r,i) => <Cell key={i} fill={r.call_to_app>30?'#22c55e':r.call_to_app>15?'#eab308':'#f43f5e'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fund Amount by Rep */}
        <div className="section">
          <h2 className="section-title">Fund Amount by Rep</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[...reps].filter(r=>r.fund_amount>0).sort((a,b)=>b.fund_amount-a.fund_amount)} margin={{bottom:60}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10"/>
              <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:10}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fill:'#94a3b8',fontSize:11}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <Tooltip contentStyle={{background:'#1e1235',border:'1px solid #7c3aed33',borderRadius:8}} formatter={v=>fmt(v)}/>
              <Bar dataKey="fund_amount" fill="#a855f7" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* No Show by Rep */}
        <div className="section">
          <h2 className="section-title">No Shows by Rep</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[...reps].filter(r=>r.no_show>0).sort((a,b)=>b.no_show-a.no_show)} margin={{bottom:60}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10"/>
              <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:10}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fill:'#94a3b8',fontSize:11}}/>
              <Tooltip contentStyle={{background:'#1e1235',border:'1px solid #7c3aed33',borderRadius:8}}/>
              <Bar dataKey="no_show" fill="#f43f5e" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rep Radar — individual spotlight */}
        <div className="section">
          <h2 className="section-title">Rep Spotlight</h2>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
            {reps.map(r => (
              <button key={r.name}
                onClick={() => setSelected(r.name)}
                style={{
                  padding:'6px 12px', borderRadius:50, fontSize:12, fontWeight:600, cursor:'pointer',
                  background: selected===r.name ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(99,102,241,0.1)',
                  color: selected===r.name ? '#fff' : '#a78bfa',
                  border: `1px solid ${selected===r.name ? 'transparent' : 'rgba(99,102,241,0.25)'}`,
                }}>
                {r.name.split(' ')[0]}
              </button>
            ))}
          </div>
          {selectedRep && (
            <div style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
              <ResponsiveContainer width={220} height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#ffffff15"/>
                  <PolarAngleAxis dataKey="metric" tick={{fill:'#94a3b8',fontSize:11}}/>
                  <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3}/>
                </RadarChart>
              </ResponsiveContainer>
              <div style={{flex:1,minWidth:160}}>
                <div style={{fontSize:16,fontWeight:800,marginBottom:12,color:'#e2e8f0'}}>{selectedRep.name}</div>
                {[
                  ['Net Calls',    selectedRep.net_calls,    '#ec4899'],
                  ['Apps',         selectedRep.apps,         '#06b6d4'],
                  ['Call→App',     `${selectedRep.call_to_app}%`, selectedRep.call_to_app>20?'#22c55e':'#f43f5e'],
                  ['Approvals',    selectedRep.approvals,    '#8b5cf6'],
                  ['Funded',       selectedRep.funded||'—',  '#eab308'],
                  ['Fund Amount',  selectedRep.fund_amount>0?fmt(selectedRep.fund_amount):'—', '#a855f7'],
                  ['Revenue',      selectedRep.revenue>0?fmt(selectedRep.revenue):'—', '#f97316'],
                  ['Est Margin',   fmt(selectedRep.est_margin), selectedRep.est_margin>=0?'#22c55e':'#f43f5e'],
                ].map(([label,val,color]) => (
                  <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #ffffff08'}}>
                    <span style={{fontSize:12,color:'#7c6fa0'}}>{label}</span>
                    <span style={{fontSize:13,fontWeight:700,color}}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Leaderboard table */}
      <div className="section">
        <h2 className="section-title">Rep Leaderboard — Waymo Performance</h2>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>#</th><th>Rep</th><th>Net Calls</th><th>Apps</th><th>Call→App%</th>
              <th>Approvals</th><th>No Show</th><th>Not Int.</th><th>DNQ</th>
              <th>Funded</th><th>Fund Amount</th><th>Revenue</th><th>Est Margin</th>
            </tr></thead>
            <tbody>
              {[...reps].sort((a,b)=>b.fund_amount-a.fund_amount).map((r,i) => (
                <tr key={i} onClick={()=>setSelected(r.name)} style={{cursor:'pointer'}}>
                  <td style={{color:'#6366f1',fontWeight:700}}>{i+1}</td>
                  <td style={{fontWeight:700}}>{r.name}</td>
                  <td>{r.net_calls}</td>
                  <td style={{color:'#06b6d4'}}>{r.apps}</td>
                  <td style={{color:r.call_to_app>20?'#22c55e':r.call_to_app>10?'#eab308':'#f43f5e',fontWeight:600}}>{r.call_to_app}%</td>
                  <td style={{color:'#8b5cf6'}}>{r.approvals}</td>
                  <td style={{color:'#f43f5e'}}>{r.no_show}</td>
                  <td style={{color:'#f87171'}}>{r.not_interested}</td>
                  <td style={{color:'#94a3b8'}}>{r.dnq}</td>
                  <td style={{color:'#eab308',fontWeight:600}}>{r.funded||'—'}</td>
                  <td style={{color:'#a855f7',fontWeight:600}}>{r.fund_amount>0?fmt(r.fund_amount):'—'}</td>
                  <td style={{color:'#f97316'}}>{r.revenue>0?fmt(r.revenue):'—'}</td>
                  <td style={{color:r.est_margin>=0?'#22c55e':'#f43f5e',fontWeight:700}}>{fmt(r.est_margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
