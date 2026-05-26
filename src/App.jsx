import Reps from './Reps'
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, FunnelChart, Funnel, LabelList
} from 'recharts'
import './App.css'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#a855f7']

function KPI({ label, value, sub, color }) {
  return (
    <div className="kpi" style={{ borderColor: color }}>
      <div className="kpi-value" style={{ color }}>{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>
      <div className="section-body">{children}</div>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('overview')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/data.json').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <div className="loading"><div className="spinner" />Loading dashboard...</div>

  const { leads, pipeline, funding } = data

  // ── KPIs ──────────────────────────────────────────────────
  const totalLeads = leads.length
  const interestedLeads = leads.filter(l => l.Interested === 'Interested').length
  const notInterested = leads.filter(l => l.Interested === 'Not Interested').length
  const totalPipeline = pipeline.length
  const totalFunded = funding.reduce((s, f) => s + (parseFloat(f.Funded_Amount) || 0), 0)
  const totalPayback = funding.reduce((s, f) => s + (parseFloat(f.Payback_Amount) || 0), 0)
  const totalCommission = funding.reduce((s, f) => s + (parseFloat(f.Commission) || 0), 0)
  const avgFunded = totalFunded / (funding.length || 1)
  const requestedTotal = pipeline.reduce((s, p) => s + (parseFloat(p.Requested_Loan_Amount) || 0), 0)

  // ── Lead Status breakdown ─────────────────────────────────
  const statusCount = {}
  leads.forEach(l => {
    const s = l.Lead_Status || 'Unknown'
    statusCount[s] = (statusCount[s] || 0) + 1
  })
  const statusData = Object.entries(statusCount).sort((a,b) => b[1]-a[1]).slice(0,8).map(([name,value]) => ({ name, value }))

  // ── Lead Source breakdown ─────────────────────────────────
  const sourceCount = {}
  leads.forEach(l => {
    const s = l.Lead_Source || 'Unknown'
    sourceCount[s] = (sourceCount[s] || 0) + 1
  })
  const sourceData = Object.entries(sourceCount).sort((a,b) => b[1]-a[1]).slice(0,8).map(([name,value]) => ({ name, value }))

  // ── Industry breakdown ────────────────────────────────────
  const industryCount = {}
  pipeline.forEach(p => {
    const i = p.Industry || 'Unknown'
    industryCount[i] = (industryCount[i] || 0) + 1
  })
  const industryData = Object.entries(industryCount).sort((a,b) => b[1]-a[1]).slice(0,8).map(([name,value]) => ({ name, value }))

  // ── Pipeline stages ───────────────────────────────────────
  const stageCount = {}
  pipeline.forEach(p => {
    const s = p.Current_Approval_Stage || p.Stage_of_Package || 'Unknown'
    stageCount[s] = (stageCount[s] || 0) + 1
  })
  const stageData = Object.entries(stageCount).sort((a,b) => b[1]-a[1]).map(([name,value]) => ({ name, value }))

  // ── Funding by lender ─────────────────────────────────────
  const lenderData = {}
  funding.forEach(f => {
    const l = f.Lender || 'Unknown'
    lenderData[l] = (lenderData[l] || 0) + (parseFloat(f.Funded_Amount) || 0)
  })
  const lenderChartData = Object.entries(lenderData).map(([name, value]) => ({ name, value }))

  // ── Funding by state ──────────────────────────────────────
  const stateCount = {}
  pipeline.forEach(p => {
    const s = p.State || p.Business_State || 'Unknown'
    if (s && s.length === 2) stateCount[s] = (stateCount[s] || 0) + 1
  })
  const stateData = Object.entries(stateCount).sort((a,b) => b[1]-a[1]).slice(0,10).map(([name,value]) => ({ name, value }))

  // ── Requested amounts buckets ─────────────────────────────
  const buckets = { '<50k':0, '50-100k':0, '100-200k':0, '200-500k':0, '>500k':0 }
  pipeline.forEach(p => {
    const amt = parseFloat(p.Requested_Loan_Amount) || 0
    if (amt < 50000) buckets['<50k']++
    else if (amt < 100000) buckets['50-100k']++
    else if (amt < 200000) buckets['100-200k']++
    else if (amt < 500000) buckets['200-500k']++
    else buckets['>500k']++
  })
  const bucketData = Object.entries(buckets).map(([name,value]) => ({ name, value }))

  // ── Funding book table ────────────────────────────────────
  const filteredFunding = funding.filter(f =>
    !search || Object.values(f).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  )
  const filteredPipeline = pipeline.filter(p =>
    !search || Object.values(p).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  )
  const filteredLeads = leads.filter(l =>
    !search || Object.values(l).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  )

  const fmt = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n.toFixed(0)}`

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">📊</div>
          <div>
            <h1>Capital Infusion</h1>
            <p>Business Lending Intelligence Dashboard</p>
          </div>
        </div>
        <div className="header-right">
          <input className="search" placeholder="🔍 Search all data..." value={search} onChange={e => setSearch(e.target.value)} />
          <div className="badge">Waymo CRM</div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tabs">
        {['overview','leads','pipeline','funding','tables','reps'].map(t => (
          <button key={t} className={`tab${tab===t?' active':''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </nav>

      <main className="main">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <>
            <div className="kpi-grid">
              <KPI label="Total Leads" value={totalLeads.toLocaleString()} sub="All time" color="#6366f1" />
              <KPI label="Interested" value={interestedLeads.toLocaleString()} sub={`${((interestedLeads/totalLeads)*100).toFixed(1)}% of leads`} color="#22c55e" />
              <KPI label="Pipeline Deals" value={totalPipeline} sub="Active" color="#f97316" />
              <KPI label="Total Funded" value={fmt(totalFunded)} sub={`${funding.length} deals`} color="#ec4899" />
              <KPI label="Total Payback" value={fmt(totalPayback)} sub="Expected return" color="#8b5cf6" />
              <KPI label="Commission" value={fmt(totalCommission)} sub="Earned" color="#eab308" />
              <KPI label="Avg Deal Size" value={fmt(avgFunded)} sub="Per funded deal" color="#06b6d4" />
              <KPI label="Pipeline Value" value={fmt(requestedTotal)} sub="Requested" color="#f43f5e" />
            </div>

            <div className="charts-grid">
              <Section title="Lead Status Distribution">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={statusData} margin={{ bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" tick={{ fill:'#94a3b8', fontSize:11 }} angle={-35} textAnchor="end" />
                    <YAxis tick={{ fill:'#94a3b8', fontSize:11 }} />
                    <Tooltip contentStyle={{ background:'#1e1235', border:'1px solid #7c3aed33', borderRadius:8 }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>

              <Section title="Lead Sources">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={sourceData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background:'#1e1235', border:'1px solid #7c3aed33', borderRadius:8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Section>

              <Section title="Pipeline by State">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stateData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis type="number" tick={{ fill:'#94a3b8', fontSize:11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fill:'#94a3b8', fontSize:11 }} width={30} />
                    <Tooltip contentStyle={{ background:'#1e1235', border:'1px solid #7c3aed33', borderRadius:8 }} />
                    <Bar dataKey="value" fill="#ec4899" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>

              <Section title="Funded Amount by Lender">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={lenderChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" tick={{ fill:'#94a3b8', fontSize:11 }} />
                    <YAxis tick={{ fill:'#94a3b8', fontSize:11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ background:'#1e1235', border:'1px solid #7c3aed33', borderRadius:8 }} formatter={v => fmt(v)} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </div>
          </>
        )}

        {/* ── LEADS ── */}
        {tab === 'leads' && (
          <>
            <div className="kpi-grid">
              <KPI label="Total Leads" value={filteredLeads.length} color="#6366f1" />
              <KPI label="Interested" value={filteredLeads.filter(l=>l.Interested==='Interested').length} color="#22c55e" />
              <KPI label="Not Interested" value={filteredLeads.filter(l=>l.Interested==='Not Interested').length} color="#f43f5e" />
              <KPI label="No Show" value={filteredLeads.filter(l=>l.Interested==='No Show').length} color="#f97316" />
            </div>
            <div className="charts-grid">
              <Section title="Lead Status Breakdown">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData} margin={{ bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" tick={{ fill:'#94a3b8', fontSize:11 }} angle={-35} textAnchor="end" />
                    <YAxis tick={{ fill:'#94a3b8', fontSize:11 }} />
                    <Tooltip contentStyle={{ background:'#1e1235', border:'1px solid #7c3aed33', borderRadius:8 }} />
                    <Bar dataKey="value" radius={[4,4,0,0]}>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Section>
              <Section title="Lead Sources">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceData} margin={{ bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" tick={{ fill:'#94a3b8', fontSize:11 }} angle={-35} textAnchor="end" />
                    <YAxis tick={{ fill:'#94a3b8', fontSize:11 }} />
                    <Tooltip contentStyle={{ background:'#1e1235', border:'1px solid #7c3aed33', borderRadius:8 }} />
                    <Bar dataKey="value" fill="#f43f5e" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </div>
            <Section title={`Leads Table (${filteredLeads.length})`}>
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Name</th><th>Company</th><th>Status</th><th>Source</th><th>Interested</th><th>Agent</th><th>Date</th>
                  </tr></thead>
                  <tbody>
                    {filteredLeads.slice(0,50).map((l,i) => (
                      <tr key={i}>
                        <td>{l.Full_Name || l.Principle_Owner_Name || '—'}</td>
                        <td>{l.Company || l.Business_Legal_Name || '—'}</td>
                        <td><span className={`badge-status ${(l.Lead_Status||'').replace(/\s+/g,'-').toLowerCase()}`}>{l.Lead_Status || '—'}</span></td>
                        <td>{l.Lead_Source || '—'}</td>
                        <td><span className={`badge-int ${(l.Interested||'').toLowerCase().replace(/\s/g,'-')}`}>{l.Interested || '—'}</span></td>
                        <td>{l.Agent || l['Owner.name'] || '—'}</td>
                        <td>{l.Date_Applied || l.Created_Time?.slice(0,10) || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}

        {/* ── PIPELINE ── */}
        {tab === 'pipeline' && (
          <>
            <div className="kpi-grid">
              <KPI label="Active Deals" value={filteredPipeline.length} color="#f97316" />
              <KPI label="Requested" value={fmt(filteredPipeline.reduce((s,p)=>s+(parseFloat(p.Requested_Loan_Amount)||0),0))} color="#6366f1" />
              <KPI label="Approved" value={filteredPipeline.filter(p=>p.Current_Approval_Stage?.includes('Approv')||p.Stage_of_Package?.includes('Approv')).length} color="#22c55e" />
              <KPI label="Declined" value={filteredPipeline.filter(p=>p.Current_Approval_Stage?.includes('Declin')||p.Stage_of_Package?.includes('Declin')).length} color="#f43f5e" />
            </div>
            <div className="charts-grid">
              <Section title="Pipeline Stages">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stageData} margin={{ bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" tick={{ fill:'#94a3b8', fontSize:10 }} angle={-35} textAnchor="end" />
                    <YAxis tick={{ fill:'#94a3b8', fontSize:11 }} />
                    <Tooltip contentStyle={{ background:'#1e1235', border:'1px solid #7c3aed33', borderRadius:8 }} />
                    <Bar dataKey="value" fill="#f97316" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
              <Section title="Requested Amount Buckets">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bucketData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" tick={{ fill:'#94a3b8', fontSize:11 }} />
                    <YAxis tick={{ fill:'#94a3b8', fontSize:11 }} />
                    <Tooltip contentStyle={{ background:'#1e1235', border:'1px solid #7c3aed33', borderRadius:8 }} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
              <Section title="Industry Mix">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={industryData} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({name,percent}) => percent > 0.05 ? `${name} ${(percent*100).toFixed(0)}%` : ''}>
                      {industryData.map((_, i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background:'#1e1235', border:'1px solid #7c3aed33', borderRadius:8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Section>
              <Section title="Deals by State">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stateData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis type="number" tick={{ fill:'#94a3b8', fontSize:11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fill:'#94a3b8', fontSize:11 }} width={30} />
                    <Tooltip contentStyle={{ background:'#1e1235', border:'1px solid #7c3aed33', borderRadius:8 }} />
                    <Bar dataKey="value" fill="#ec4899" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </div>
            <Section title={`Pipeline Table (${filteredPipeline.length})`}>
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Company</th><th>Owner</th><th>Requested</th><th>Stage</th><th>State</th><th>TIB</th><th>Date Applied</th>
                  </tr></thead>
                  <tbody>
                    {filteredPipeline.map((p,i) => (
                      <tr key={i}>
                        <td>{p.Business_Legal_Name || p.Account_Name || '—'}</td>
                        <td>{p.Principle_Owner_Name || '—'}</td>
                        <td>{p.Requested_Loan_Amount ? fmt(parseFloat(p.Requested_Loan_Amount)) : '—'}</td>
                        <td><span className="badge-stage">{p.Current_Approval_Stage || p.Stage_of_Package || '—'}</span></td>
                        <td>{p.State || p.Business_State || '—'}</td>
                        <td>{p.Time_in_Business || p.TIB1 || '—'}</td>
                        <td>{p.Date_Applied || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}

        {/* ── FUNDING ── */}
        {tab === 'funding' && (
          <>
            <div className="kpi-grid">
              <KPI label="Deals Funded" value={filteredFunding.length} color="#22c55e" />
              <KPI label="Total Funded" value={fmt(filteredFunding.reduce((s,f)=>s+(parseFloat(f.Funded_Amount)||0),0))} color="#6366f1" />
              <KPI label="Total Payback" value={fmt(filteredFunding.reduce((s,f)=>s+(parseFloat(f.Payback_Amount)||0),0))} color="#f97316" />
              <KPI label="Commission" value={fmt(filteredFunding.reduce((s,f)=>s+(parseFloat(f.Commission)||0),0))} color="#eab308" />
            </div>
            <div className="charts-grid">
              <Section title="Funded Amount by Lender">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={lenderChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" tick={{ fill:'#94a3b8', fontSize:11 }} />
                    <YAxis tick={{ fill:'#94a3b8', fontSize:11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ background:'#1e1235', border:'1px solid #7c3aed33', borderRadius:8 }} formatter={v => fmt(v)} />
                    <Bar dataKey="value" fill="#22c55e" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
              <Section title="Funded vs Payback vs Commission">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredFunding.map(f => ({
                    name: (f.Company||'').slice(0,15),
                    funded: parseFloat(f.Funded_Amount)||0,
                    payback: parseFloat(f.Payback_Amount)||0,
                    commission: parseFloat(f.Commission)||0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" tick={{ fill:'#94a3b8', fontSize:9 }} angle={-25} textAnchor="end" />
                    <YAxis tick={{ fill:'#94a3b8', fontSize:11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ background:'#1e1235', border:'1px solid #7c3aed33', borderRadius:8 }} formatter={v => fmt(v)} />
                    <Legend />
                    <Bar dataKey="funded" fill="#6366f1" radius={[4,4,0,0]} />
                    <Bar dataKey="payback" fill="#f97316" radius={[4,4,0,0]} />
                    <Bar dataKey="commission" fill="#eab308" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </div>
            <Section title={`Funding Book (${filteredFunding.length})`}>
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Company</th><th>Lender</th><th>Funded</th><th>Payback</th><th>Commission</th><th>Rate</th><th>Term</th><th>Daily Payment</th><th>Date Funded</th><th>Stage</th>
                  </tr></thead>
                  <tbody>
                    {filteredFunding.map((f,i) => (
                      <tr key={i}>
                        <td>{f.Company || '—'}</td>
                        <td>{f.Lender || '—'}</td>
                        <td className="num">{f.Funded_Amount ? fmt(parseFloat(f.Funded_Amount)) : '—'}</td>
                        <td className="num">{f.Payback_Amount ? fmt(parseFloat(f.Payback_Amount)) : '—'}</td>
                        <td className="num green">{f.Commission ? fmt(parseFloat(f.Commission)) : '—'}</td>
                        <td>{f.Final_Rate || f.Base_Rate || '—'}</td>
                        <td>{f.Term || '—'}</td>
                        <td className="num">{f.Daily_Payment ? `$${parseFloat(f.Daily_Payment).toFixed(0)}` : '—'}</td>
                        <td>{f.Date_Funded || '—'}</td>
                        <td><span className="badge-stage">{f.Stage || '—'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}

        {/* ── REPS ── */}
        {tab === 'reps' && <Reps />}

        {/* ── TABLES ── */}
        {tab === 'tables' && (
          <>
            <Section title={`All Leads (${filteredLeads.length})`}>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Status</th><th>Source</th><th>Interested</th><th>State</th></tr></thead>
                  <tbody>
                    {filteredLeads.slice(0,100).map((l,i) => (
                      <tr key={i}>
                        <td>{l.Full_Name || l.Principle_Owner_Name || '—'}</td>
                        <td>{l.Company || l.Business_Legal_Name || '—'}</td>
                        <td>{l.Email || l.Primary_Contact_Email || '—'}</td>
                        <td>{l.Phone || l.Best_Phone_Number || '—'}</td>
                        <td><span className="badge-status">{l.Lead_Status || '—'}</span></td>
                        <td>{l.Lead_Source || '—'}</td>
                        <td><span className={`badge-int ${(l.Interested||'').toLowerCase().replace(/\s/g,'-')}`}>{l.Interested || '—'}</span></td>
                        <td>{l.State || l.Business_State || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}

      </main>
    </div>
  )
}
