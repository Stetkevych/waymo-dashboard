import { useState, useRef } from 'react'

const API_APP   = 'https://lendersuggestion.onrender.com/application'
const API_BANK  = 'https://lendersuggestion.onrender.com/bank-statement'

const INDUSTRIES = ['Restaurant','Construction','Retail','Healthcare','Transportation','Real Estate','Technology','Manufacturing','Professional Services','Other']
const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const TIB = ['Under 6 months','6-12 months','1-2 years','2-3 years','3-5 years','5+ years']

const INITIAL = {
  business_name: null, owner_name: null, email: null, phone: null,
  state: null, industry: null, entity_type: null,
  time_in_business: null, monthly_revenue: null, annual_revenue: null,
  requested_amount: null, use_of_funds: null,
  credit_score: null, bankruptcies: null,
  tax_id: null, business_start_date: null,
}

export default function LenderSubmit() {
  const [form, setForm]         = useState(INITIAL)
  const [bankFile, setBankFile] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState(null)
  const [step, setStep]         = useState(1)
  const fileRef = useRef()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v === '' ? null : v }))

  const submit = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      // POST application
      const appRes = await fetch(API_APP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const appData = await appRes.json()

      // POST bank statement if file provided
      let bankData = null
      if (bankFile) {
        const fd = new FormData()
        fd.append('file', bankFile)
        fd.append('business_name', form.business_name || '')
        const bankRes = await fetch(API_BANK, { method: 'POST', body: fd })
        bankData = await bankRes.json()
      }

      setResult({ application: appData, bank_statement: bankData })
      setStep(3)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const Input = ({ label, field, type='text', placeholder='' }) => (
    <label className="ob-label" style={{marginBottom:12}}>
      {label}
      <input className="input" type={type} placeholder={placeholder}
        value={form[field] ?? ''}
        onChange={e => set(field, e.target.value)}
        style={{marginTop:6}}
      />
    </label>
  )

  const Select = ({ label, field, options }) => (
    <label className="ob-label" style={{marginBottom:12}}>
      {label}
      <select className="input" value={form[field] ?? ''}
        onChange={e => set(field, e.target.value)}
        style={{marginTop:6}}>
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )

  return (
    <div>
      {/* Step indicator */}
      <div style={{display:'flex',gap:8,marginBottom:24,alignItems:'center'}}>
        {['Application','Bank Statement','Results'].map((s,i) => (
          <div key={s} style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{
              width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:12,fontWeight:700,
              background: step>i+1?'#22c55e':step===i+1?'linear-gradient(135deg,#6366f1,#8b5cf6)':'rgba(99,102,241,0.1)',
              color: step>=i+1?'#fff':'#7c6fa0',
              border: step===i+1?'none':'1px solid rgba(99,102,241,0.25)',
            }}>{step>i+1?'✓':i+1}</div>
            <span style={{fontSize:13,fontWeight:600,color:step===i+1?'#e2e8f0':'#7c6fa0'}}>{s}</span>
            {i<2 && <div style={{width:32,height:1,background:'rgba(99,102,241,0.2)'}}/>}
          </div>
        ))}
      </div>

      {/* Step 1 — Application */}
      {step === 1 && (
        <div className="section">
          <h2 className="section-title">Application Details</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'0 20px'}}>
            <Input label="Business Name"       field="business_name"      placeholder="Legal business name" />
            <Input label="Owner Name"          field="owner_name"         placeholder="Full name" />
            <Input label="Email"               field="email"              type="email" placeholder="email@business.com" />
            <Input label="Phone"               field="phone"              placeholder="(555) 555-5555" />
            <Select label="State"              field="state"              options={STATES} />
            <Select label="Industry"           field="industry"           options={INDUSTRIES} />
            <Input label="Entity Type"         field="entity_type"        placeholder="LLC, Corp, Sole Prop..." />
            <Select label="Time in Business"   field="time_in_business"   options={TIB} />
            <Input label="Monthly Revenue"     field="monthly_revenue"    type="number" placeholder="0.00" />
            <Input label="Annual Revenue"      field="annual_revenue"     type="number" placeholder="0.00" />
            <Input label="Requested Amount"    field="requested_amount"   type="number" placeholder="0.00" />
            <Input label="Use of Funds"        field="use_of_funds"       placeholder="Working capital, equipment..." />
            <Input label="Credit Score"        field="credit_score"       type="number" placeholder="300-850" />
            <Input label="Bankruptcies"        field="bankruptcies"       placeholder="None, Chapter 7, Chapter 11..." />
            <Input label="Tax ID / EIN"        field="tax_id"             placeholder="XX-XXXXXXX" />
            <Input label="Business Start Date" field="business_start_date" type="date" />
          </div>
          <button className="btn btn-primary" style={{marginTop:16,width:'100%',justifyContent:'center'}}
            onClick={() => setStep(2)}>
            Continue to Bank Statement →
          </button>
        </div>
      )}

      {/* Step 2 — Bank Statement */}
      {step === 2 && (
        <div className="section">
          <h2 className="section-title">Bank Statement Upload</h2>
          <p style={{fontSize:14,color:'#94a3b8',marginBottom:20}}>
            Upload the most recent 3 months of bank statements (PDF). Optional but improves lender matching.
          </p>
          <div
            onClick={() => fileRef.current.click()}
            style={{
              border:'2px dashed rgba(99,102,241,0.35)', borderRadius:16, padding:'40px 24px',
              textAlign:'center', cursor:'pointer', transition:'all 0.2s',
              background: bankFile ? 'rgba(34,197,94,0.06)' : 'rgba(99,102,241,0.04)',
              borderColor: bankFile ? '#22c55e' : 'rgba(99,102,241,0.35)',
            }}>
            <div style={{fontSize:32,marginBottom:8}}>{bankFile ? '✅' : '📄'}</div>
            <div style={{fontSize:15,fontWeight:600,color:'#e2e8f0'}}>
              {bankFile ? bankFile.name : 'Click to upload bank statement'}
            </div>
            <div style={{fontSize:12,color:'#7c6fa0',marginTop:4}}>PDF, up to 20MB</div>
            <input ref={fileRef} type="file" accept=".pdf,.csv" style={{display:'none'}}
              onChange={e => setBankFile(e.target.files[0])} />
          </div>
          {bankFile && (
            <button onClick={() => setBankFile(null)}
              style={{marginTop:8,fontSize:12,color:'#f43f5e',background:'none',border:'none',cursor:'pointer'}}>
              Remove file
            </button>
          )}
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button className="btn btn-ghost" style={{flex:1,justifyContent:'center'}} onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" style={{flex:2,justifyContent:'center'}} onClick={submit} disabled={loading}>
              {loading ? <><span className="spinner" style={{width:16,height:16,marginRight:8}}/> Submitting...</> : 'Submit & Get Lender Match →'}
            </button>
          </div>
          {error && <div style={{marginTop:12,padding:'12px 16px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:10,color:'#f87171',fontSize:13}}>{error}</div>}
        </div>
      )}

      {/* Step 3 — Results */}
      {step === 3 && result && (
        <div>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
            <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,#22c55e,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>✓</div>
            <div>
              <div style={{fontSize:18,fontWeight:800}}>Submission Complete</div>
              <div style={{fontSize:13,color:'#94a3b8'}}>Lender analysis returned</div>
            </div>
          </div>

          {/* Application response */}
          {result.application && (
            <div className="section" style={{marginBottom:16}}>
              <h2 className="section-title">Lender Suggestion — Application</h2>
              <pre style={{
                background:'rgba(0,0,0,0.3)', borderRadius:10, padding:16,
                fontSize:12, color:'#c4b5fd', overflowX:'auto', lineHeight:1.6,
                border:'1px solid rgba(99,102,241,0.15)'
              }}>
                {JSON.stringify(result.application, null, 2)}
              </pre>
            </div>
          )}

          {/* Bank statement response */}
          {result.bank_statement && (
            <div className="section" style={{marginBottom:16}}>
              <h2 className="section-title">Bank Statement Analysis</h2>
              <pre style={{
                background:'rgba(0,0,0,0.3)', borderRadius:10, padding:16,
                fontSize:12, color:'#86efac', overflowX:'auto', lineHeight:1.6,
                border:'1px solid rgba(34,197,94,0.15)'
              }}>
                {JSON.stringify(result.bank_statement, null, 2)}
              </pre>
            </div>
          )}

          <button className="btn btn-ghost" style={{width:'100%',justifyContent:'center'}}
            onClick={() => { setStep(1); setForm(INITIAL); setResult(null); setBankFile(null) }}>
            Submit Another Application
          </button>
        </div>
      )}
    </div>
  )
}
