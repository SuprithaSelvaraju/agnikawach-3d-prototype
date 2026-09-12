import { COLORS, fontUI } from "../styles/tokens";

export default function SectionHeading({ children }) {
  return (
    <div className="px-4 pt-4 pb-2" style={{ fontFamily: fontUI, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
      {children}
    </div>
  );
}
