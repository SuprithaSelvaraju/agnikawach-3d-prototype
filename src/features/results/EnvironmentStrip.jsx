import { COLORS, fontUI, fontMono } from "../../styles/tokens";
import { compassLabel } from "../../utils/geo";
import SectionHeading from "../../components/SectionHeading";

export default function EnvironmentStrip({ scenario, environment }) {
  const items = [
    { label: "Material", value: scenario.material.name },
    { label: "Wind", value: `${environment.windSpeedMS.toFixed(1)} m/s` },
    { label: "From", value: `${environment.windDirectionDeg}° ${compassLabel(environment.windDirectionDeg)}` },
    { label: "Stability", value: `Class ${environment.weatherStabilityClass}` },
  ];
  return (
    <div>
      <SectionHeading>Environment</SectionHeading>
      <div className="px-4 pb-4 grid grid-cols-2 gap-x-3 gap-y-2.5">
        {items.map((it) => (
          <div key={it.label}>
            <div style={{ fontFamily: fontUI, fontSize: 11, color: COLORS.textTertiary }}>{it.label}</div>
            <div style={{ fontFamily: fontMono, fontSize: 13, color: COLORS.textPrimary }}>{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
