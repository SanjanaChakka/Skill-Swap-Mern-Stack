import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../api';
import ListingCard from '../components/ListingCard';

export default function SavedPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.bookmarks().then((r) => setListings(r.listings)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spin" />;

  return (
    <div className="container mt-2 mb-3">
      <h1 className="page-title mb-2">Saved listings</h1>
      {listings.length === 0 ? (
        <div className="card empty">
          <p>You haven't saved any listings yet.</p>
          <Link to="/browse" className="btn mt-2">Browse listings</Link>
        </div>
      ) : (
        <div className="grid grid-3">
          {listings.map((l) => <ListingCard key={l._id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
