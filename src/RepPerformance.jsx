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
    <th onClick={() => toggleSort(col)} style={{ cursor:'pointer', whiteSpace:'nowrap', userSelect:'none', padding:'8px 10px', fontSize:12 }}>
      {label} {sort === col ? (dir === -1 ? '↓' : '↑') : ''}
    </th>
  )

  return (
    <div>
      {/* Team KPIs */}
      <div className="kpi-grid" style={{marginBottom:24}}>
        <div className="kpi" style={{borderColor:'#6366f1'}}>
          <div className="kpi-value" style={{color:'#6366f1'}}>{reps.length}</div>
          <div className="kpi-label">Active Reps</div>
        </div>
        <div className="kpi" style={{borderColor:'#ec4899'}}>
          <div className="kpi-value" style={{color:'#ec4899'}}>{(T.net_calls||0).toLocaleString()}</div>
          <div className="kpi-label">Net Calls</div>
        </div>
        <div className="kpi" style={{borderColor:'#06b6d4'}}>
          <div className="kpi-value" style={{color:'#06b6d4'}}>{T.apps||0}</div>
          <div className="kpi-label">Apps</div>
          <div className="kpi-sub" style={{fontSize:12,marginTop:4,color:'#67e8f9'}}>{pct(T.apps,T.net_calls)} call → app</div>
        </div>
        <div className="kpi" style={{borderColor:'#8b5cf6'}}>
          <div className="kpi-value" style={{color:'#8b5cf6'}}>{T.approvals||0}</div>
          <div className="kpi-label">Approvals</div>
          <div className="kpi-sub" style={{fontSize:12,marginTop:4,color:'#c4b5fd'}}>{pct(T.approvals,T.apps)} app → approval</div>
        </div>
        <div className="kpi" style={{borderColor:'#eab308'}}>
          <div className="kpi-value" style={{color:'#eab308'}}>{T.funded||0}</div>
          <div className="kpi-label">Funded</div>
          <div className="kpi-sub" style={{fontSize:12,marginTop:4,color:'#fde047'}}>{pct(T.funded,T.approvals)} approval → fund</div>
        </div>
        <div className="kpi" style={{borderColor:'#a855f7'}}>
          <div className="kpi-value" style={{color:'#a855f7'}}>{fmt(T.fund_amount||0)}</div>
          <div className="kpi-label">Fund Amount</div>
          <div className="kpi-sub" style={{fontSize:12,marginTop:4,color:'#d8b4fe'}}>{T.funded>0 ? fmt((T.fund_amount||0)/(T.funded||1))+' avg' : '—'}</div>
        </div>
        <div className="kpi" style={{borderColor:'#f97316'}}>
          <div className="kpi-value" style={{color:'#f97316'}}>{fmt(T.revenue||0)}</div>
          <div className="kpi-label">Revenue</div>
        </div>
        <div className="kpi" style={{borderColor:'#f43f5e'}}>
          <div className="kpi-value" style={{color:'#f43f5e'}}>{fmt(T.est_expense||0)}</div>
          <div className="kpi-label">Est. Expense</div>
        </div>
        <div className="kpi" style={{borderColor:(T.est_margin||0)>=0?'#22c55e':'#f43f5e'}}>
          <div className="kpi-value" style={{color:(T.est_margin||0)>=0?'#22c55e':'#f43f5e'}}>{fmt(T.est_margin||0)}</div>
          <div className="kpi-label">Est. Margin</div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">
          Rep Performance — Waymo Lead Source &nbsp;
          <span style={{fontSize:11,color:'#7c6fa0',fontWeight:400}}>Click any column to sort</span>
        </h2>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,tableLayout:'fixed'}}>
            <colgroup>
              <col style={{width:'13%'}} />
              <col style={{width:'6%'}} />
              <col style={{width:'5%'}} />
              <col style={{width:'7%'}} />
              <col style={{width:'7%'}} />
              <col style={{width:'8%'}} />
              <col style={{width:'6%'}} />
              <col style={{width:'8%'}} />
              <col style={{width:'8%'}} />
              <col style={{width:'7%'}} />
              <col style={{width:'8%'}} />
              <col style={{width:'8%'}} />
              <col style={{width:'9%'}} />
            </colgroup>
            <thead>
              <tr style={{borderBottom:'1px solid #7c3aed44'}}>
                <th style={{padding:'8px 10px',fontSize:12,textAlign:'left',color:'#94a3b8'}}>Rep</th>
                <Th col="net_calls"        label="Calls" />
                <Th col="apps"             label="Apps" />
                <Th col="call_to_app"      label="Call→App%" />
                <Th col="approvals"        label="Apprvls" />
                <Th col="app_to_approval"  label="App→Appr%" />
                <Th col="funded"           label="Funded" />
                <Th col="approval_to_fund" label="Appr→Fund%" />
                <Th col="fund_amount"      label="Fund Amt" />
                <Th col="avg_amount"       label="Avg Amt" />
                <Th col="revenue"          label="Revenue" />
                <Th col="est_expense"      label="Est Exp" />
                <Th col="est_margin"       label="Est Margin" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={i} style={{borderBottom:'1px solid #ffffff08',background: i%2===0?'transparent':'rgba(255,255,255,0.02)'}}>
                  <td style={{padding:'8px 10px',fontWeight:700,color:'#e2e8f0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</td>
                  <td style={{padding:'8px 10px',textAlign:'center',color:'#94a3b8'}}>{r.net_calls ?? '—'}</td>
                  <td style={{padding:'8px 10px',textAlign:'center',color:'#67e8f9',fontWeight:600}}>{r.apps}</td>
                  <td style={{padding:'8px 10px',textAlign:'center',fontWeight:600,color:r.call_to_app>30?'#22c55e':r.call_to_app>15?'#eab308':'#f43f5e'}}>
                    {r.call_to_app != null ? `${r.call_to_app}%` : '—'}
                  </td>
                  <td style={{padding:'8px 10px',textAlign:'center',color:'#c4b5fd'}}>{r.approvals}</td>
                  <td style={{padding:'8px 10px',textAlign:'center',fontWeight:600,color:r.app_to_approval>50?'#22c55e':r.app_to_approval>25?'#eab308':'#f43f5e'}}>
                    {r.app_to_approval != null ? `${r.app_to_approval}%` : '—'}
                  </td>
                  <td style={{padding:'8px 10px',textAlign:'center',color:'#fde047',fontWeight:600}}>{r.funded > 0 ? r.funded : '—'}</td>
                  <td style={{padding:'8px 10px',textAlign:'center',fontWeight:600,color:r.approval_to_fund>50?'#22c55e':r.approval_to_fund>0?'#eab308':'#94a3b8'}}>
                    {r.approval_to_fund != null ? `${r.approval_to_fund}%` : '—'}
                  </td>
                  <td style={{padding:'8px 10px',textAlign:'center',color:'#d8b4fe',fontWeight:600}}>{r.fund_amount > 0 ? fmt(r.fund_amount) : '—'}</td>
                  <td style={{padding:'8px 10px',textAlign:'center',color:'#94a3b8'}}>{r.avg_amount > 0 ? fmt(r.avg_amount) : '—'}</td>
                  <td style={{padding:'8px 10px',textAlign:'center',color:'#fb923c',fontWeight:600}}>{r.revenue > 0 ? fmt(r.revenue) : '—'}</td>
                  <td style={{padding:'8px 10px',textAlign:'center',color:'#f43f5e'}}>{fmt(r.est_expense)}</td>
                  <td style={{padding:'8px 10px',textAlign:'center',fontWeight:700,color:r.est_margin>=0?'#22c55e':'#f43f5e'}}>{fmt(r.est_margin)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{borderTop:'2px solid #6366f1',fontWeight:700,background:'rgba(99,102,241,0.08)'}}>
                <td style={{padding:'8px 10px',color:'#a5b4fc'}}>TOTAL</td>
                <td style={{padding:'8px 10px',textAlign:'center'}}>{T.net_calls||0}</td>
                <td style={{padding:'8px 10px',textAlign:'center',color:'#67e8f9'}}>{T.apps||0}</td>
                <td style={{padding:'8px 10px',textAlign:'center',color:'#22c55e'}}>{pct(T.apps,T.net_calls)}</td>
                <td style={{padding:'8px 10px',textAlign:'center',color:'#c4b5fd'}}>{T.approvals||0}</td>
                <td style={{padding:'8px 10px',textAlign:'center'}}>{pct(T.approvals,T.apps)}</td>
                <td style={{padding:'8px 10px',textAlign:'center',color:'#fde047'}}>{T.funded||0}</td>
                <td style={{padding:'8px 10px',textAlign:'center'}}>{pct(T.funded,T.approvals)}</td>
                <td style={{padding:'8px 10px',textAlign:'center',color:'#d8b4fe'}}>{fmt(T.fund_amount||0)}</td>
                <td style={{padding:'8px 10px',textAlign:'center'}}>{T.funded>0?fmt((T.fund_amount||0)/(T.funded||1)):'—'}</td>
                <td style={{padding:'8px 10px',textAlign:'center',color:'#fb923c'}}>{fmt(T.revenue||0)}</td>
                <td style={{padding:'8px 10px',textAlign:'center',color:'#f43f5e'}}>{fmt(T.est_expense||0)}</td>
                <td style={{padding:'8px 10px',textAlign:'center',color:(T.est_margin||0)>=0?'#22c55e':'#f43f5e'}}>{fmt(T.est_margin||0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
