import { groupSpecs, type Spec } from "@/lib/specs";
import { ChevronIcon } from "@/components/icons";
import { SpecIcon } from "./SpecIcons";

/** Especificaciones como menú desplegable: cada parte de la bici se abre por separado. */
export function SpecsAccordion({ specs }: { specs: Spec[] }) {
  const groups = groupSpecs(specs);
  return (
    <div className="spec-list">
      {groups.map((g) => (
        <details key={g.key} className="spec-item">
          <summary>
            <span className="spec-icon"><SpecIcon part={g.key} /></span>
            <span className="spec-name">{g.label}</span>
            <span className="spec-chevron"><ChevronIcon /></span>
          </summary>
          <dl className="spec-detail">
            {g.specs.map((s) => (
              <div key={s.label}>
                {(g.specs.length > 1 || s.label.toLowerCase() !== g.label.toLowerCase()) && <dt>{s.label}</dt>}
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ))}
    </div>
  );
}
