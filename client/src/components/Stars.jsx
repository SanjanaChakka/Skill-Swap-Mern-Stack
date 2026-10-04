export default function Stars({ value, max = 5 }) {
  return (
    <span className="stars">
      {Array.from({ length: max }, (_, i) => (i < Math.round(value) ? '★' : '☆')).join('')}
    </span>
  );
}
