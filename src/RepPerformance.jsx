import { useState } from 'react'

const fmt = (n) => {
  if (n === 0) return '$0'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1000000) return `${sign}$${(abs/1000000).toFixed(2)}M`
  if (abs >= 1000) return `${sign}$${(abs/1000).toFixed(1)}K`
  return `${sign}$${abs.toFixed(0)}`
}
const pct = (a, b) => b > 0 ? `${((a/b)*100).toFixed(1)}%` : '—'

export default function RepPerformance({ analytics }) {
  const [sort, setSort] = useState('fund_amount')
  const [dir, setDir] = useState(-1)

  if (!analytics) return <div style={{padding:40,color:'#94a3b8'}}>Loading...</div>

  const reps = analytics.rep_stats || []
  const T = analytics.team_totals || {}

  const sorted = [...reps].sort((a, b) => {
    const av = parseFloat(a[sort]) || 0
    const bv = parseFloat(b[sort]) || 0
    return dir * (bv - av)
  })

  const toggleSort = (col) => {
    if (sort === col) setDir(d => -d)
    else { setSort(col); setDir(-1) }
  }

  const Th = ({ col, label }) => (
    <th onClick={() => toggleSort(col)} style={{ cursor:'pointer', whiteSpace:'nowrap', userSelect:'none', padding:'10px 14px' }}>
      {label} {sort === col ? (dir === -1 ? '↓' : '↑') : ''}
    </th>
  )

  return (
    <div>
      {/* Team KPIs */}
      <div className="kpi-grid" style={{marginBottom:24}}>
        <div className="kpi" style={{borderColor:'#6366f1'}}><div className="kpi-value" style={{color:'#6366f1'}}>{reps.length}</div><div className="kpi-label">Active Reps</div></div>
        <div className="kpi" style={{borderColor:'#ec4899'}}><div className="kpi-value" style={{color:'#ec4899'}}>{(T.net_calls||0).toLocaleString()}</div><div className="kpi-label">Net Calls</div></div>
        <div className="kpi" style={{borderColor:'#06b6d4'}}><div className="kpi-value" style={{color:'#06b6d4'}}>{T.apps||0}</div><div className="kpi-label">Apps</div><div className="kpi-sub">{pct(T.apps,T.net_calls)} call→app</div></div>
        <div className="kpi" style={{borderColor:'#8b5cf6'}}><div className="kpi-value" style={{color:'#8b5cf6'}}>{T.approvals||0}</div><div className="kpi-label">Approvals</div><div className="kpi-sub">{pct(T.approvals,T.apps)} app→approval</div></div>
        <div className="kpi" style={{borderColor:'#eab308'}}><div className="kpi-value" style={{color:'#eab308'}}>{T.funded||0}</div><div className="kpi-label">Funded</div><div className="kpi-sub">{pct(T.funded,T.approvals)} approval→fund</div></div>
        <div className="kpi" style={{borderColor:'#a855f7'}}><div className="kpi-value" style={{color:'#a855f7'}}>{fmt(T.fund_amount||0)}</div><div className="kpi-label">Fund Amount</div><div className="kpi-sub">{T.funded>0?fmt((T.fund_amount||0)/(T.funded||1))+' avg':''}</div></div>
        <div className="kpi" style={{borderColor:'#f97316'}}><div className="kpi-value" style={{color:'#f97316'}}>{fmt(T.revenue||0)}</div><div className="kpi-label">Revenue</div></div>
        <div className="kpi" style={{borderColor:'#f43f5e'}}><div className="kpi-value" style={{color:'#f43f5e'}}>{fmt(T.est_expense||0)}</div><div className="kpi-label">Est. Expense</div></div>
        <div className="kpi" style={{borderColor:(T.est_margin||0)>=0?'#22c55e':'#f43f5e'}}>
          <div className="kpi-value" style={{color:(T.est_margin||0)>=0?'#22c55e':'#f43f5e'}}>{fmt(T.est_margin||0)}</div>
          <div className="kpi-label">Est. Margin</div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Rep Performance — Waymo Lead Source &nbsp;<span style={{fontSize:11,color:'#7c6fa0',fontWeight:400}}>Click any column to sort</span></h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{position:'sticky',left:0,background:'#160020',zIndex:2,padding:'10px 14px'}}>Rep</th>
                <Th col="net_calls"        label="Net Calls" />
                <Th col="apps"             label="Apps" />
                <Th col="call_to_app"      label="Call→App %" />
                <Th col="approvals"        label="Approvals" />
                <Th col="app_to_approval"  label="App→Approval %" />
                <Th col="funded"           label="Funded" />
                <Th col="approval_to_fund" label="Approval→Fund %" />
                <Th col="fund_amount"      label="Fund Amount" />
                <Th col="avg_positions"    label="Avg Positions" />
                <Th col="avg_amount"       label="Avg Amount" />
                <Th col="revenue"          label="Revenue" />
                <Th col="est_expense"      label="Est. Expense" />
                <Th col="est_margin"       label="Est. Margin" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={i}>
                  <td style={{position:'sticky',left:0,background:'#0a0014',fontWeight:700,zIndex:1,padding:'10px 14px'}}>{r.name}</td>
                  <td>{r.net_calls}</td>
                  <td style={{color:'#06b6d4',fontWeight:600}}>{r.apps}</td>
                  <td style={{color:r.call_to_app>30?'#22c55e':r.call_to_app>15?'#eab308':'#f43f5e',fontWeight:600}}>{r.call_to_app != null ? `${r.call_to_app}%` : '—'}</td>
                  <td style={{color:'#8b5cf6'}}>{r.approvals}</td>
                  <td style={{color:r.app_to_approval>50?'#22c55e':r.app_to_approval>25?'#eab308':'#f43f5e',fontWeight:600}}>{r.app_to_approval != null ? `${r.app_to_approval}%` : '—'}</td>
                  <td style={{color:'#eab308',fontWeight:600}}>{r.funded > 0 ? r.funded : '—'}</td>
                  <td style={{color:r.approval_to_fund>50?'#22c55e':r.approval_to_fund>0?'#eab308':'#94a3b8',fontWeight:600}}>{r.approval_to_fund != null ? `${r.approval_to_fund}%` : '—'}</td>
                  <td style={{color:'#a855f7',fontWeight:600}}>{r.fund_amount > 0 ? fmt(r.fund_amount) : '—'}</td>
                  <td style={{color:'#c4b5fd'}}>{r.avg_positions > 0 ? r.avg_positions : '—'}</td>
                  <td>{r.avg_amount > 0 ? fmt(r.avg_amount) : '—'}</td>
                  <td style={{color:'#f97316',fontWeight:600}}>{r.revenue > 0 ? fmt(r.revenue) : '—'}</td>
                  <td style={{color:'#f43f5e'}}>{fmt(r.est_expense)}</td>
                  <td style={{color:r.est_margin>=0?'#22c55e':'#f43f5e',fontWeight:700}}>{fmt(r.est_margin)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{borderTop:'2px solid #6366f1',fontWeight:700,background:'rgba(99,102,241,0.08)'}}>
                <td style={{position:'sticky',left:0,background:'#160020',padding:'10px 14px'}}>TOTAL</td>
                <td>{T.net_calls||0}</td>
                <td style={{color:'#06b6d4'}}>{T.apps||0}</td>
                <td style={{color:'#22c55e'}}>{pct(T.apps,T.net_calls)}</td>
                <td style={{color:'#8b5cf6'}}>{T.approvals||0}</td>
                <td>{pct(T.approvals,T.apps)}</td>
                <td style={{color:'#eab308'}}>{T.funded||0}</td>
                <td>{pct(T.funded,T.approvals)}</td>
                <td style={{color:'#a855f7'}}>{fmt(T.fund_amount||0)}</td>
                <td>{T.funded>0?((T.fund_amount||0)/(T.funded||1)/43800).toFixed(1):'—'}</td>
                <td>{T.funded>0?fmt((T.fund_amount||0)/(T.funded||1)):'—'}</td>
                <td style={{color:'#f97316'}}>{fmt(T.revenue||0)}</td>
                <td style={{color:'#f43f5e'}}>{fmt(T.est_expense||0)}</td>
                <td style={{color:(T.est_margin||0)>=0?'#22c55e':'#f43f5e'}}>{fmt(T.est_margin||0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
