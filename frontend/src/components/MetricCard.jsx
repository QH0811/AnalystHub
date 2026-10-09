function MetricCard({
  label,
  value,
  description
}) {

  return (
    <div className="metric-card">

      <span className="metric-label">
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {description}
      </small>

    </div>
  );
}


export default MetricCard;