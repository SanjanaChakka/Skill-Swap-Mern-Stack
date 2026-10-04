import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listingApi } from '../api';
import ListingCard from '../components/ListingCard';

export default function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [data, setData] = useState({ listings: [], total: 0, categories: [] });
  const [loading, setLoading] = useState(true);

  const type = params.get('type') || '';
  const category = params.get('category') || '';
  const tag = params.get('tag') || '';
  const level = params.get('level') || '';
  const format = params.get('format') || '';
  const city = params.get('city') || '';
  const page = Number(params.get('page')) || 1;

  useEffect(() => {
    setLoading(true);
    const query = {
      q: q || undefined,
      type: type || undefined,
      category: category || undefined,
      tag: tag || undefined,
      level: level || undefined,
      format: format || undefined,
      city: city || undefined,
      page,
      limit: 12,
    };
    listingApi
      .search(query)
      .then((r) => setData(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type, category, tag, level, format, city, page]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next);
  };

  const goPage = (p) => {
    const next = new URLSearchParams(params);
    next.set('page', String(p));
    setParams(next);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    update('q', q);
  };

  const clear = () => setParams(new URLSearchParams());

  return (
    <div className="container mt-2 mb-3">
      <h1 className="page-title">Browse skills</h1>
      <form className="hero-search mb-2" onSubmit={submitSearch}>
        <input placeholder="Search listings…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn">Search</button>
      </form>

      <div className="filters card mb-2">
        <div className="grid grid-4">
          <div>
            <label>Type</label>
            <select value={type} onChange={(e) => update('type', e.target.value)}>
              <option value="">All types</option>
              <option value="offer">Offering</option>
              <option value="seek">Seeking</option>
            </select>
          </div>
          <div>
            <label>Category</label>
            <select value={category} onChange={(e) => update('category', e.target.value)}>
              <option value="">All categories</option>
              {data.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Proficiency</label>
            <select value={level} onChange={(e) => update('level', e.target.value)}>
              <option value="">Any level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
          <div>
            <label>Format</label>
            <select value={format} onChange={(e) => update('format', e.target.value)}>
              <option value="">Any format</option>
              <option value="Online">Online</option>
              <option value="In-Person">In-Person</option>
              <option value="Both">Both</option>
            </select>
          </div>
        </div>
        <div className="grid grid-2 mt-1">
          <div>
            <label>City (in-person)</label>
            <input placeholder="e.g. Austin" value={city} onChange={(e) => update('city', e.target.value)} />
          </div>
          <div className="flex" style={{ alignItems: 'flex-end' }}>
            <label style={{ visibility: 'hidden' }}>.</label>
            <button className="btn btn-outline" onClick={clear}>Clear filters</button>
          </div>
        </div>
      </div>

      <div className="flex-between mb-1">
        <span className="muted text-sm">{data.total} result{data.total === 1 ? '' : 's'}</span>
      </div>

      {loading ? (
        <div className="spin" />
      ) : data.listings.length === 0 ? (
        <div className="card empty">No listings match your search. Try removing some filters.</div>
      ) : (
        <div className="grid grid-3">
          {data.listings.map((l) => (
            <ListingCard key={l._id} listing={l} />
          ))}
        </div>
      )}

      {data.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => goPage(page - 1)}>← Prev</button>
          <span className="muted text-sm">Page {data.page} of {data.pages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= data.pages} onClick={() => goPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
