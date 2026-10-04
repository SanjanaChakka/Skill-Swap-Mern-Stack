import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listingApi } from '../api';
import ListingCard from '../components/ListingCard';
import { useAuth } from '../context/AuthContext';

export default function MyListingsPage() {
  const { refreshUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listingApi.mine().then((r) => setListings(r.listings)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleActive = async (l) => {
    await listingApi.update(l._id, { isActive: !l.isActive });
    setListings((prev) => prev.map((x) => (x._id === l._id ? { ...x, isActive: !x.isActive } : x)));
  };

  const remove = async (l) => {
    if (!confirm('Delete this listing?')) return;
    await listingApi.remove(l._id);
    setListings((prev) => prev.filter((x) => x._id !== l._id));
    refreshUser();
  };

  if (loading) return <div className="spin" />;

  return (
    <div className="container mt-2 mb-3">
      <div className="flex-between mb-2">
        <h1 className="page-title">My listings</h1>
        <Link to="/listings/new" className="btn">+ New listing</Link>
      </div>

      {listings.length === 0 ? (
        <div className="card empty">
          <p>You have no listings yet.</p>
          <button className="btn mt-2" onClick={() => (window.location.href = '/listings/new')}>Create your first</button>
        </div>
      ) : (
        <div className="grid grid-2">
          {listings.map((l) => (
            <div key={l._id} className="card">
              <div className="flex-between">
                <span className={`chip ${l.type === 'offer' ? 'chip-offer' : 'chip-seek'}`}>
                  {l.type === 'offer' ? 'Offering' : 'Seeking'} · {l.category}
                </span>
                <span className={`chip ${l.isActive ? 'chip-active' : ''}`}>
                  {l.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="mt-1">{l.title}</h3>
              <p className="text-sm muted">{l.description}</p>
              <div className="flex mt-2">
                <Link to={`/listings/${l._id}`} className="btn btn-sm btn-outline">View</Link>
                <Link to={`/listings/${l._id}/edit`} className="btn btn-sm btn-outline">Edit</Link>
                <button className="btn btn-sm btn-outline" onClick={() => toggleActive(l)}>
                  {l.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => remove(l)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
