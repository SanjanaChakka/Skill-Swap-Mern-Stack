export default function Avatar({ user, size, className = '' }) {
  const px = size === 'lg' ? 'avatar-lg' : '';
  const src = user?.profilePhoto;
  if (src) {
    return (
      <span className={`avatar ${px} ${className}`}>
        <img src={src} alt={user?.name} />
      </span>
    );
  }
  return <span className={`avatar ${px} ${className}`}>{user?.name ? user.name[0] : '?'}</span>;
}
