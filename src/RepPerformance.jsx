import { useState, useEffect } from 'react'

const fmt = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n.toFixed(0)}`
const pct = (a, b) => b > 0 ? `${((a/b)*100).toFixed(1)}%` : '—'

export default function RepPerformance({ analytics }) {
  const [sort, setSort] = useState('leads')
  const [dir, setDir] = useState(-1)

  if (!analytics) return <div style={{padding:40,color:'#94a3b8'}}>Loading...</div>

  const reps = analytics.rep_stats.filter(r => r.leads > 0 || r.deals > 0)

  // Derive calculated fields per rep
  const enriched = reps.map(r => {
    const netCalls       = r.leads || 0
    const apps           = r.interested + r.calendly || 0
    const callToApp      = netCalls > 0 ? ((apps / netCalls) * 100).toFixed(1) : 0
    const approvals      = r.deals || 0
    const appToApproval  = apps > 0 ? ((approvals / apps) * 100).toFixed(1) : 0
    const funded         = r.funded || 0
    const approvalToFund = approvals > 0 ? ((funded / approvals) * 100).toFixed(1) : 0
    const fundAmount     = r.funded_value || r.pipeline_value || 0
    const avgPoints      = netCalls > 0 ? ((apps * 10 + approvals * 25 + funded * 50) / netCalls).toFixed(1) : 0
    const avgAmount      = funded > 0 ? fundAmount / funded : 0
    // Revenue = fund amount * avg factor (1.35 typical MCA)
    const revenue        = fundAmount * 1.35
    // Estimated expense = leads * $12 (cost per lead) + base salary estimate
    const estExpense     = netCalls * 12 + 2500
    const estMargin      = revenue - estExpense

    return {
      ...r,
      netCalls, apps, callToApp, approvals, appToApproval,
      funded, approvalToFund, fundAmount, avgPoints, avgAmount,
      revenue, estExpense, estMargin
    }
  })

  const sorted = [...enriched].sort((a, b) => {
    const av = parseFloat(a[sort]) || 0
    const bv = parseFloat(b[sort]) || 0
    return dir * (bv - av)
  })

  const toggleSort = (col) => {
    if (sort === col) setDir(d => -d)
    else { setSort(col); setDir(-1) }
  }

  const Th = ({ col, label }) => (
    <th onClick={() => toggleSort(col)} style={{ cursor:'pointer', whiteSpace:'nowrap', userSelect:'none' }}>
      {label} {sort === col ? (dir === -1 ? '↓' : '↑') : ''}
    </th>
  )

  // Totals
  const T = enriched.reduce((acc, r) => {
    acc.netCalls     += r.netCalls
    acc.apps         += r.apps
    acc.approvals    += r.approvals
    acc.funded       += r.funded
    acc.fundAmount   += r.fundAmount
    acc.revenue      += r.revenue
    acc.estExpense   += r.estExpense
    acc.estMargin    += r.estMargin
    return acc
  }, { netCalls:0, apps:0, approvals:0, funded:0, fundAmount:0, revenue:0, estExpense:0, estMargin:0 })

  return (
    <div>
      {/* KPI strip */}
      <div className="kpi-grid" style={{marginBottom:24}}>
        <div className="kpi" style={{borderColor:'#6366f1'}}><div className="kpi-value" style={{color:'#6366f1'}}>{enriched.length}</div><div className="kpi-label">Reps</div></div>
        <div className="kpi" style={{borderColor:'#ec4899'}}><div className="kpi-value" style={{color:'#ec4899'}}>{T.netCalls.toLocaleString()}</div><div className="kpi-label">Net Calls</div></div>
        <div className="kpi" style={{borderColor:'#06b6d4'}}><div className="kpi-value" style={{color:'#06b6d4'}}>{T.apps}</div><div className="kpi-label">Apps</div></div>
        <div className="kpi" style={{borderColor:'#22c55e'}}><div className="kpi-value" style={{color:'#22c55e'}}>{T.approvals}</div><div className="kpi-label">Approvals</div></div>
        <div className="kpi" style={{borderColor:'#eab308'}}><div className="kpi-value" style={{color:'#eab308'}}>{T.funded}</div><div className="kpi-label">Funded</div></div>
        <div className="kpi" style={{borderColor:'#8b5cf6'}}><div className="kpi-value" style={{color:'#8b5cf6'}}>{fmt(T.fundAmount)}</div><div className="kpi-label">Fund Amount</div></div>
        <div className="kpi" style={{borderColor:'#f97316'}}><div className="kpi-value" style={{color:'#f97316'}}>{fmt(T.revenue)}</div><div className="kpi-label">Revenue</div></div>
        <div className="kpi" style={{borderColor: T.estMargin > 0 ? '#22c55e' : '#f43f5e'}}>
          <div className="kpi-value" style={{color: T.estMargin > 0 ? '#22c55e' : '#f43f5e'}}>{fmt(T.estMargin)}</div>
          <div className="kpi-label">Est. Margin</div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Rep Performance — Waymo Lead Source (click headers to sort)</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{position:'sticky',left:0,background:'#160020',zIndex:2}}>Rep</th>
                <Th col="netCalls"       label="Net Calls" />
                <Th col="apps"           label="Apps" />
                <Th col="callToApp"      label="Call → App %" />
                <Th col="approvals"      label="Approvals" />
                <Th col="appToApproval"  label="App → Approval %" />
                <Th col="funded"         label="Funded" />
                <Th col="approvalToFund" label="Approval → Fund %" />
                <Th col="fundAmount"     label="Fund Amount" />
                <Th col="avgPoints"      label="Avg Points" />
                <Th col="avgAmount"      label="Avg Amount" />
                <Th col="revenue"        label="Revenue" />
                <Th col="estExpense"     label="Est. Expense" />
                <Th col="estMargin"      label="Est. Margin" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={i}>
                  <td style={{position:'sticky',left:0,background:'#0a0014',fontWeight:700,zIndex:1}}>{r.name}</td>
                  <td>{r.netCalls}</td>
                  <td style={{color:'#06b6d4'}}>{r.apps}</td>
                  <td style={{color: r.callToApp>30?'#22c55e':r.callToApp>15?'#eab308':'#f43f5e', fontWeight:600}}>{r.callToApp}%</td>
                  <td style={{color:'#8b5cf6'}}>{r.approvals}</td>
                  <td style={{color: r.appToApproval>50?'#22c55e':r.appToApproval>25?'#eab308':'#f43f5e', fontWeight:600}}>{r.appToApproval}%</td>
                  <td style={{color:'#eab308'}}>{r.funded || '—'}</td>
                  <td style={{color: r.approvalToFund>50?'#22c55e':r.approvalToFund>0?'#eab308':'#94a3b8', fontWeight:600}}>{r.approvalToFund > 0 ? `${r.approvalToFund}%` : '—'}</td>
                  <td style={{color:'#8b5cf6'}}>{r.fundAmount > 0 ? fmt(r.fundAmount) : '—'}</td>
                  <td style={{color:'#a78bfa'}}>{r.avgPoints}</td>
                  <td>{r.avgAmount > 0 ? fmt(r.avgAmount) : '—'}</td>
                  <td style={{color:'#f97316'}}>{fmt(r.revenue)}</td>
                  <td style={{color:'#f43f5e'}}>{fmt(r.estExpense)}</td>
                  <td style={{color: r.estMargin > 0 ? '#22c55e' : '#f43f5e', fontWeight:700}}>{fmt(r.estMargin)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{borderTop:'2px solid #6366f1', fontWeight:700}}>
                <td style={{position:'sticky',left:0,background:'#160020'}}>TOTAL</td>
                <td>{T.netCalls}</td>
                <td>{T.apps}</td>
                <td>{pct(T.apps, T.netCalls)}</td>
                <td>{T.approvals}</td>
                <td>{pct(T.approvals, T.apps)}</td>
                <td>{T.funded}</td>
                <td>{pct(T.funded, T.approvals)}</td>
                <td>{fmt(T.fundAmount)}</td>
                <td>—</td>
                <td>{T.funded > 0 ? fmt(T.fundAmount/T.funded) : '—'}</td>
                <td style={{color:'#f97316'}}>{fmt(T.revenue)}</td>
                <td style={{color:'#f43f5e'}}>{fmt(T.estExpense)}</td>
                <td style={{color: T.estMargin > 0 ? '#22c55e' : '#f43f5e'}}>{fmt(T.estMargin)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
