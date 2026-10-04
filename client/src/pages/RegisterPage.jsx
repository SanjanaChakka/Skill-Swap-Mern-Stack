import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', bio: '', city: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, bio: form.bio, city: form.city });
      navigate('/');
    } catch (err) {
      setError(errMsg(err, 'Registration failed'));
    }
    setBusy(false);
  };

  return (
    <div className="auth-page">
      <form className="auth-card card" onSubmit={submit}>
        <h1 className="page-title">Create your account</h1>
        <p className="muted mb-2">Join the community — it's free and always will be.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label>Full name</label>
          <input value={form.name} onChange={set('name')} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={set('email')} required />
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label>Password (min 8 chars)</label>
            <input type="password" value={form.password} onChange={set('password')} required />
          </div>
          <div className="form-group">
            <label>Confirm password</label>
            <input type="password" value={form.confirm} onChange={set('confirm')} required />
          </div>
        </div>
        <div className="form-group">
          <label>City (for in-person sessions)</label>
          <input value={form.city} onChange={set('city')} placeholder="e.g. Austin" />
        </div>
        <div className="form-group">
          <label>Short bio</label>
          <textarea rows={3} value={form.bio} onChange={set('bio')} placeholder="What skills can you teach? What do you want to learn?" />
        </div>
        <button className="btn" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-sm muted mt-2" style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
