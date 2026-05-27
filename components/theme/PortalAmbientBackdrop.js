export default function PortalAmbientBackdrop({ fixed = false }) {
  const positionClassName = fixed ? 'fixed' : 'absolute';

  return (
    <div className={`pointer-events-none ${positionClassName} inset-0 overflow-hidden`} aria-hidden="true">
      <div className="portal-scenic-image absolute inset-0" />
      <div className="portal-ambient-overlay absolute inset-0" />
      <div className="portal-grid-overlay absolute inset-0 opacity-10" />
    </div>
  );
}