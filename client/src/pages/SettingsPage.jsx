import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi, errMsg } from '../api';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', bio: '', city: '', offeredSkills: '', soughtSkills: '', portfolio: '' });
  const [schedule, setSchedule] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name,
      bio: user.bio,
      city: user.location?.city,
      offeredSkills: (user.skills?.offered || []).join(', '),
      soughtSkills: (user.skills?.sought || []).join(', '),
      portfolio: (user.portfolio || []).map((p) => p.url).join(', '),
    });
    setSchedule(user.availability?.schedule || DAYS.map((day) => ({ day, start: '09:00', end: '17:00', available: true })));
  }, [user?._id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setBusy(true);
    const payload = {
      name: form.name,
      bio: form.bio,
      location: { city: form.city, radiusKm: user.location?.radiusKm || 50 },
      skills: {
        offered: form.offeredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        sought: form.soughtSkills.split(',').map((s) => s.trim()).filter(Boolean),
      },
      portfolio: form.portfolio.split(',').map((u) => u.trim()).filter(Boolean).map((url) => ({ title: 'Portfolio item', type: 'link', url })),
      availability: { schedule },
    };
    try {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => fd.append(k, JSON.stringify(v)));
      if (photo) fd.append('profilePhoto', photo);
      await userApi.updateWithPhoto(fd);
      await refreshUser();
      setMsg('Profile updated successfully.');
    } catch (e2) {
      setErr(errMsg(e2));
    }
    setBusy(false);
  };

  const toggleDay = (day) =>
    setSchedule((prev) => prev.map((d) => (d.day === day ? { ...d, available: !d.available } : d)));

  const updateSlot = (day, key, val) =>
    setSchedule((prev) => prev.map((d) => (d.day === day ? { ...d, [key]: val } : d)));

  return (
    <div className="container mt-2 mb-3" style={{ maxWidth: 760 }}>
      <h1 className="page-title mb-1">Account settings</h1>
      <button className="btn btn-outline btn-sm mb-2" onClick={() => navigate('/me')}>← Back to profile</button>
      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      <form className="card" onSubmit={save}>
        <h3 className="mb-1">Profile</h3>
        <div className="grid grid-2">
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={set('name')} />
          </div>
          <div className="form-group">
            <label>City</label>
            <input value={form.city} onChange={set('city')} placeholder="e.g. Austin" />
          </div>
        </div>
        <div className="form-group">
          <label>Bio</label>
          <textarea rows={3} value={form.bio} onChange={set('bio')} placeholder="Tell the community about yourself…" />
        </div>
        <div className="form-group">
          <label>Profile photo</label>
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
          {user?.profilePhoto && <p className="text-sm muted mt-1">Current photo: {user.profilePhoto}</p>}
        </div>

        <h3 className="mt-2 mb-1">Skills</h3>
        <div className="grid grid-2">
          <div className="form-group">
            <label>Skills I offer (comma separated)</label>
            <input value={form.offeredSkills} onChange={set('offeredSkills')} placeholder="JavaScript, Guitar" />
          </div>
          <div className="form-group">
            <label>Skills I want (comma separated)</label>
            <input value={form.soughtSkills} onChange={set('soughtSkills')} placeholder="Spanish, Yoga" />
          </div>
        </div>

        <h3 className="mt-2 mb-1">Availability calendar</h3>
        <div className="avail-editor">
          {schedule.map((d) => (
            <div key={d.day} className={`avail-edit-row ${d.available ? '' : 'off'}`}>
              <label className="avail-toggle">
                <input type="checkbox" checked={d.available} onChange={() => toggleDay(d.day)} />
                <strong className="text-sm">{d.day}</strong>
              </label>
              {d.available ? (
                <div className="flex">
                  <input type="time" value={d.start} onChange={(e) => updateSlot(d.day, 'start', e.target.value)} />
                  <span className="muted">–</span>
                  <input type="time" value={d.end} onChange={(e) => updateSlot(d.day, 'end', e.target.value)} />
                </div>
              ) : (
                <span className="muted text-sm">Unavailable</span>
              )}
            </div>
          ))}
        </div>

        <h3 className="mt-2 mb-1">Portfolio links</h3>
        <div className="form-group">
          <label>URLs (comma separated — GitHub, Behance, etc.)</label>
          <input value={form.portfolio} onChange={set('portfolio')} placeholder="https://github.com/you" />
        </div>

        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>
  );
}
