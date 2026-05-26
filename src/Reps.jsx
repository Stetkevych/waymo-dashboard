import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#a855f7']
const fmt = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n.toFixed(0)}`

export default function Reps() {
  const [analytics, setAnalytics] = useState(null)
  useEffect(() => { fetch('/analytics.json').then(r=>r.json()).then(setAnalytics) }, [])
  if (!analytics) return <div style={{padding:40,color:'#94a3b8'}}>Loading rep data...</div>

  const reps = analytics.rep_stats.filter(r => r.leads > 0 || r.deals > 0)
  const totalLeads = reps.reduce((s,r)=>s+r.leads,0)
  const totalInterested = reps.reduce((s,r)=>s+r.interested,0)
  const totalPipeline = reps.reduce((s,r)=>s+r.pipeline_value,0)
  const totalFunded = reps.reduce((s,r)=>s+r.funded,0)

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi" style={{borderColor:'#6366f1'}}><div className="kpi-value" style={{color:'#6366f1'}}>{reps.length}</div><div className="kpi-label">Active Reps</div></div>
        <div className="kpi" style={{borderColor:'#ec4899'}}><div className="kpi-value" style={{color:'#ec4899'}}>{totalLeads}</div><div className="kpi-label">Total Waymo Leads</div></div>
        <div className="kpi" style={{borderColor:'#22c55e'}}><div className="kpi-value" style={{color:'#22c55e'}}>{totalInterested}</div><div className="kpi-label">Total Interested</div></div>
        <div className="kpi" style={{borderColor:'#f97316'}}><div className="kpi-value" style={{color:'#f97316'}}>{fmt(totalPipeline)}</div><div className="kpi-label">Total Pipeline</div></div>
        <div className="kpi" style={{borderColor:'#eab308'}}><div className="kpi-value" style={{color:'#eab308'}}>{totalFunded}</div><div className="kpi-label">Funded Deals</div></div>
      </div>

      <div className="charts-grid" style={{marginBottom:24}}>
        <div className="section">
          <h2 className="section-title">Leads by Rep</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reps} margin={{bottom:60}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10"/>
              <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:10}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fill:'#94a3b8',fontSize:11}}/>
              <Tooltip contentStyle={{background:'#1e1235',border:'1px solid #7c3aed33',borderRadius:8}}/>
              <Bar dataKey="leads" radius={[4,4,0,0]}>{reps.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="section">
          <h2 className="section-title">Conversion Rate by Rep (%)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reps.filter(r=>r.leads>0).map(r=>({...r,conv:r.conversion_rate}))} margin={{bottom:60}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10"/>
              <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:10}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fill:'#94a3b8',fontSize:11}} unit="%"/>
              <Tooltip contentStyle={{background:'#1e1235',border:'1px solid #7c3aed33',borderRadius:8}} formatter={v=>`${v}%`}/>
              <Bar dataKey="conv" radius={[4,4,0,0]}>{reps.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="section">
          <h2 className="section-title">Pipeline Value by Rep</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reps.filter(r=>r.pipeline_value>0)} margin={{bottom:60}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10"/>
              <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:10}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fill:'#94a3b8',fontSize:11}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <Tooltip contentStyle={{background:'#1e1235',border:'1px solid #7c3aed33',borderRadius:8}} formatter={v=>fmt(v)}/>
              <Bar dataKey="pipeline_value" radius={[4,4,0,0]}>{reps.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="section">
          <h2 className="section-title">Calendly Bookings by Rep</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reps.filter(r=>r.calendly>0)} margin={{bottom:60}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10"/>
              <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:10}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fill:'#94a3b8',fontSize:11}}/>
              <Tooltip contentStyle={{background:'#1e1235',border:'1px solid #7c3aed33',borderRadius:8}}/>
              <Bar dataKey="calendly" fill="#22c55e" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Rep Leaderboard — Waymo Performance</h2>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>#</th><th>Rep</th><th>Leads</th><th>Interested</th><th>Calendly</th><th>No Show</th><th>Not Interested</th><th>Conv %</th><th>Deals</th><th>Pipeline Value</th><th>Funded</th>
            </tr></thead>
            <tbody>
              {reps.map((r,i)=>(
                <tr key={i}>
                  <td style={{color:'#6366f1',fontWeight:700}}>{i+1}</td>
                  <td style={{fontWeight:600}}>{r.name}</td>
                  <td>{r.leads}</td>
                  <td style={{color:'#22c55e'}}>{r.interested}</td>
                  <td style={{color:'#06b6d4'}}>{r.calendly}</td>
                  <td style={{color:'#f43f5e'}}>{r.no_show}</td>
                  <td style={{color:'#f97171'}}>{r.not_interested}</td>
                  <td style={{color: r.conversion_rate>40?'#22c55e':r.conversion_rate>20?'#eab308':'#f43f5e',fontWeight:700}}>{r.conversion_rate}%</td>
                  <td>{r.deals}</td>
                  <td style={{color:'#8b5cf6',fontWeight:600}}>{r.pipeline_value>0?fmt(r.pipeline_value):'—'}</td>
                  <td style={{color:'#eab308'}}>{r.funded>0?r.funded:'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
