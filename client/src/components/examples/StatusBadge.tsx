import { StatusBadge } from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      <StatusBadge status="recovered" type="specimen" />
      <StatusBadge status="processing" type="specimen" />
      <StatusBadge status="stored" type="specimen" />
      <StatusBadge status="eligible" type="donor" />
      <StatusBadge status="pending" type="donor" />
      <StatusBadge status="consented" type="consent" />
      <StatusBadge status="pass" type="quality" />
      <StatusBadge status="high" type="event" />
    </div>
  );
}
