export function Arrow({ back = false }: { back?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d={back ? "M15 9H4M8.5 4.5 4 9l4.5 4.5" : "M3 9h11M9.5 4.5 14 9l-4.5 4.5"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}
