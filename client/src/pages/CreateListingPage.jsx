import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listingApi, errMsg } from '../api';

const CATEGORIES = [
  'Technology', 'Arts', 'Languages', 'Music', 'Fitness', 'Cooking', 'Business', 'Education', 'Photography', 'Other',
];

export default function CreateListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'offer',
    category: 'Technology',
    tags: '',
    proficiencyLevel: 'Intermediate',
    sessionFormat: 'Both',
    durationMinutes: 60,
    frequency: 'Weekly',
    portfolio: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    listingApi.get(id).then(({ listing: l }) => {
      setForm({
        title: l.title,
        description: l.description,
        type: l.type,
        category: l.category,
        tags: (l.tags || []).join(', '),
        proficiencyLevel: l.proficiencyLevel,
        sessionFormat: l.sessionFormat,
        durationMinutes: l.durationMinutes,
        frequency: l.frequency,
        portfolio: l.portfolio,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, isEdit]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const payload = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (isEdit) {
        await listingApi.update(id, payload);
      } else {
        await listingApi.create(payload);
      }
      navigate('/me/listings');
    } catch (err) {
      setError(errMsg(err));
    }
    setBusy(false);
  };

  if (loading) return <div className="spin" />;

  return (
    <div className="container mt-2 mb-3" style={{ maxWidth: 720 }}>
      <h1 className="page-title">{isEdit ? 'Edit listing' : 'Create a skill listing'}</h1>
      <p className="muted mb-2">Offer a skill you can teach, or request one you want to learn.</p>

      <form className="card" onSubmit={submit}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="grid grid-2">
          <div className="form-group">
            <label>Listing type</label>
            <select value={form.type} onChange={set('type')}>
              <option value="offer">I'm offering this skill</option>
              <option value="seek">I'm seeking this skill</option>
            </select>
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Title</label>
          <input value={form.title} onChange={set('title')} placeholder="e.g. JavaScript Tutoring" required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows={4} value={form.description} onChange={set('description')} placeholder="What do you teach / want to learn? How will sessions work?" required />
        </div>
        <div className="form-group">
          <label>Tags (comma separated)</label>
          <input value={form.tags} onChange={set('tags')} placeholder="python, coding, automation" />
        </div>
        <div className="grid grid-4">
          <div className="form-group">
            <label>Proficiency</label>
            <select value={form.proficiencyLevel} onChange={set('proficiencyLevel')}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Expert</option>
            </select>
          </div>
          <div className="form-group">
            <label>Format</label>
            <select value={form.sessionFormat} onChange={set('sessionFormat')}>
              <option>Online</option>
              <option>In-Person</option>
              <option>Both</option>
            </select>
          </div>
          <div className="form-group">
            <label>Duration (min)</label>
            <input type="number" value={form.durationMinutes} onChange={set('durationMinutes')} />
          </div>
          <div className="form-group">
            <label>Frequency</label>
            <select value={form.frequency} onChange={set('frequency')}>
              <option>Weekly</option>
              <option>Bi-weekly</option>
              <option>One-time</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Portfolio / proof link (optional)</label>
          <input value={form.portfolio} onChange={set('portfolio')} placeholder="https://github.com/you or portfolio URL" />
        </div>
        <div className="flex flex-between">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/me/listings')}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : isEdit ? 'Save changes' : 'Publish listing'}</button>
        </div>
      </form>
    </div>
  );
}
