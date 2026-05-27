export default function PortalAmbientBackdrop({ fixed = false }) {
  const positionClassName = fixed ? 'fixed' : 'absolute';

  return (
    <div className={`pointer-events-none ${positionClassName} inset-0 overflow-hidden`} aria-hidden="true">
      <div className="portal-scenic-image absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(167,243,208,0.08),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(217,231,207,0.08),_transparent_24%),linear-gradient(180deg,_rgba(7,14,20,0.22),_rgba(7,14,20,0.48)_30%,_rgba(7,14,20,0.88)_100%)] backdrop-blur-[6px]" />
      <div className="portal-grid-overlay absolute inset-0 opacity-10" />
    </div>
  );
}