import {useState} from 'react';
const fields=[['customer_name','Customer name','e.g. Nimal Perera'],['contact_details','Email or phone','e.g. 0771234567'],['subject','Subject','e.g. Product delivery question']];
export default function InquiryForm({onSave,saving=false}){
 const [form,setForm]=useState({customer_name:'',contact_details:'',subject:'',description:''});
 const [errors,setErrors]=useState({});
 function validate(){const e={};if(form.customer_name.trim().length<2)e.customer_name='Enter at least 2 characters.';if(form.contact_details.trim().length<5)e.contact_details='Enter valid contact details.';if(form.subject.trim().length<3)e.subject='Enter at least 3 characters.';if(form.description.trim().length<10)e.description='Enter at least 10 characters.';setErrors(e);return !Object.keys(e).length;}
 async function submit(e){e.preventDefault();if(validate())await onSave(Object.fromEntries(Object.entries(form).map(([k,v])=>[k,v.trim()])),setErrors);}
 return <form onSubmit={submit} noValidate className="form-card">
  <h2>New inquiry</h2><p className="muted">Record the customer request. Every field is required.</p>
  {fields.map(([key,label,placeholder])=><label key={key}>{label}<input value={form[key]} placeholder={placeholder} aria-invalid={!!errors[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}/>{errors[key]&&<small role="alert">{errors[key]}</small>}</label>)}
  <label>Description<textarea rows="5" value={form.description} placeholder="Describe the customer's request..." aria-invalid={!!errors.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>{errors.description&&<small role="alert">{errors.description}</small>}</label>
  <button className="primary" disabled={saving}>{saving?'Saving...':'Save inquiry'}</button>
 </form>;
}
