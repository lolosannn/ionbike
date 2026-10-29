"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { conversion, periodOptions, type StatsData } from "@/lib/admin/stats-types";
import { BarList, DayChart, ShareBar, StatTile, fmt, longDate, shortDate } from "./charts";

// Dispositivos: tres colores validados para daltonismo sobre el fondo oscuro del panel
const deviceInfo = {
  mobile: { label: "Celular", color: "#3987e5" },
  desktop: { label: "Computadora", color: "#d95926" },
  tablet: { label: "Tablet", color: "#199e70" },
} as const;

const pageName = (path: string) => {
  if (path === "/") return "Inicio";
  const known: Record<string, string> = { "/carrito": "Carrito", "/checkout": "Checkout", "/taller": "Taller", "/ofertas": "Ofertas", "/guia-de-talles": "Guía de talles", "/contacto": "Contacto", "/buscar": "Buscador" };
  return known[path] ?? path;
};

function ChartCard({ title, sub, chart, table }: { title: string; sub?: string; chart: React.ReactNode; table: React.ReactNode }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className="adm-card adm-chart-card">
      <header className="adm-chart-head">
        <div>
          <h2>{title}</h2>
          {sub && <p className="adm-muted">{sub}</p>}
        </div>
        <button type="button" className="adm-link" onClick={() => setAsTable((t) => !t)}>{asTable ? "Ver gráfico" : "Ver tabla"}</button>
      </header>
      {asTable ? <div className="adm-table-wrap adm-table-scroll">{table}</div> : chart}
    </section>
  );
}

export function StatsDashboard({ datasets, empty, note }: { datasets: StatsData[]; empty?: boolean; note?: string }) {
  const router = useRouter();
  const [loading, start] = useTransition();
  const [days, setDays] = useState(datasets[0].days);
  const data = datasets.find((d) => d.days === days) ?? datasets[0];
  const { totals: t, previous: p, series } = data;

  const choose = (d: number) => {
    setDays(d);
    // En la tienda real cada período se calcula en el servidor; en la vista previa ya vienen todos
    if (!datasets.some((x) => x.days === d)) start(() => router.push(`/admin/estadisticas?dias=${d}`));
  };

  const avgTicket = t.paidOrders ? t.revenue / t.paidOrders : 0;
  const prevTicket = p.paidOrders ? p.revenue / p.paidOrders : 0;
  const totalSources = data.sources.reduce((s, x) => s + x.visits, 0);
  const sources = data.sources.length > 7
    ? [...data.sources.slice(0, 6), { name: "Otros", visits: data.sources.slice(6).reduce((s, x) => s + x.visits, 0) }]
    : data.sources;

  return (
    <div className={`adm-page adm-stats${loading ? " is-loading" : ""}`}>
      <header className="adm-head">
        <div>
          <h1>Estadísticas</h1>
          <p className="adm-sub">Del {longDate(data.from).toLowerCase()} al {longDate(data.to).toLowerCase()}</p>
        </div>
      </header>

      <div className="adm-toolbar">
        <div className="adm-tabs" role="group" aria-label="Período">
          {periodOptions.map((d) => (
            <button key={d} type="button" aria-pressed={days === d} onClick={() => choose(d)}>Últimos {d} días</button>
          ))}
        </div>
      </div>

      {note && <p className="adm-banner info">{note}</p>}
      {empty && (
        <p className="adm-banner info">
          Todavía no hay visitas registradas: las estadísticas se empiezan a juntar desde que la tienda está online con esta versión.
        </p>
      )}

      <div className="adm-stat-row">
        <StatTile label="Visitantes" value={fmt.int(t.visitors)} current={t.visitors} previous={p.visitors} spark={series.map((s) => s.visitors)}
          hint="Personas distintas por día, sumadas: alguien que entra dos días cuenta dos veces." />
        <StatTile label="Páginas vistas" value={fmt.int(t.views)} current={t.views} previous={p.views} spark={series.map((s) => s.views)} />
        <StatTile label="Pedidos" value={fmt.int(t.orders)} current={t.orders} previous={p.orders} spark={series.map((s) => s.orders)} />
        <StatTile label="Conversión" value={fmt.pct(conversion(t))} current={conversion(t)} previous={conversion(p)}
          hint="Pedidos sobre visitantes: de cada 100 personas que entraron, cuántas hicieron un pedido." />
        <StatTile label="Ventas cobradas" value={fmt.money(t.revenue)} current={t.revenue} previous={p.revenue} spark={series.map((s) => s.revenue)} />
        <StatTile label="Ticket promedio" value={fmt.money(avgTicket)} current={avgTicket} previous={prevTicket} />
      </div>

      <div className="adm-stats-grid">
        <ChartCard
          title="Visitantes por día"
          sub={`${fmt.int(Math.round(t.visitors / data.days))} por día en promedio`}
          chart={<DayChart kind="area" label="Visitantes por día" points={series.map((s) => ({ date: s.date, value: s.visitors }))} format={(v) => `${fmt.int(v)} visitantes`} axisFormat={fmt.compact} />}
          table={
            <table className="adm-table">
              <thead><tr><th>Día</th><th className="num">Visitantes</th><th className="num">Páginas vistas</th><th className="num">Pedidos</th></tr></thead>
              <tbody>{[...series].reverse().map((s) => <tr key={s.date}><td>{shortDate(s.date)}</td><td className="num">{fmt.int(s.visitors)}</td><td className="num">{fmt.int(s.views)}</td><td className="num">{s.orders}</td></tr>)}</tbody>
            </table>
          }
        />
        <ChartCard
          title="Ventas cobradas por día"
          sub={`${fmt.int(t.paidOrders)} ${t.paidOrders === 1 ? "pedido cobrado" : "pedidos cobrados"} · ${fmt.money(t.revenue)}`}
          chart={<DayChart kind="columns" label="Ventas cobradas por día" points={series.map((s) => ({ date: s.date, value: s.revenue }))} format={fmt.money} axisFormat={fmt.moneyCompact} />}
          table={
            <table className="adm-table">
              <thead><tr><th>Día</th><th className="num">Cobrado</th></tr></thead>
              <tbody>{[...series].reverse().map((s) => <tr key={s.date}><td>{shortDate(s.date)}</td><td className="num">{fmt.money(s.revenue)}</td></tr>)}</tbody>
            </table>
          }
        />

        <section className="adm-card">
          <h2>Embudo de compra</h2>
          <p className="adm-muted adm-card-sub">Cuántas personas llegaron a cada paso, y qué parte de los que entraron es.</p>
          <BarList
            items={data.funnel.map((f) => ({ label: f.label, value: f.value }))}
            format={fmt.int}
            note={(v, i) => (i > 0 && data.funnel[0].value ? `(${fmt.pct(Math.min((v / data.funnel[0].value) * 100, 100))})` : null)}
          />
        </section>

        <section className="adm-card">
          <h2>De dónde llegan</h2>
          <p className="adm-muted adm-card-sub">Visitas según desde dónde entraron a la tienda.</p>
          {sources.length ? (
            <BarList items={sources.map((s) => ({ label: s.name, value: s.visits }))} format={fmt.int} note={(v) => (totalSources ? `(${fmt.pct((v / totalSources) * 100)})` : null)} />
          ) : <p className="adm-muted">Todavía no hay visitas en este período.</p>}
          <p className="adm-hint">Tip: en los links que compartas en Instagram o WhatsApp agregá <code>?utm_source=instagram</code> para distinguirlos.</p>
        </section>

        <section className="adm-card adm-span-2">
          <h2>Productos más vistos</h2>
          {data.products.length ? (
            <div className="adm-table-wrap adm-table-flat">
              <table className="adm-table">
                <thead><tr><th>Producto</th><th className="num">Vistas</th><th className="num">Al carrito</th><th className="num">Vendidos</th></tr></thead>
                <tbody>
                  {data.products.map((pr) => (
                    <tr key={pr.slug}>
                      <td><Link href={`/producto/${pr.slug}`} target="_blank" rel="noreferrer">{pr.name}</Link></td>
                      <td className="num" data-label="Vistas">{fmt.int(pr.views)}</td>
                      <td className="num" data-label="Al carrito">{fmt.int(pr.carts)}</td>
                      <td className="num" data-label="Vendidos"><b>{fmt.int(pr.sold)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="adm-muted">Todavía no hay visitas a productos en este período.</p>}
        </section>

        <section className="adm-card">
          <h2>Dispositivos</h2>
          <p className="adm-muted adm-card-sub">Desde qué entran los visitantes.</p>
          <ShareBar items={data.devices.map((d) => ({ label: deviceInfo[d.device].label, value: d.visitors, color: deviceInfo[d.device].color }))} />
        </section>

        <section className="adm-card">
          <h2>Páginas más vistas</h2>
          {data.pages.length ? (
            <BarList items={data.pages.map((pg) => ({ label: pg.label ?? pageName(pg.path), value: pg.views }))} format={fmt.int} />
          ) : <p className="adm-muted">Todavía no hay visitas en este período.</p>}
        </section>

        <section className="adm-card adm-span-2">
          <h2>Taller y consultas</h2>
          <div className="adm-stat-row adm-stat-row-sm">
            <StatTile label="Turnos reservados" value={fmt.int(t.bookings)} current={t.bookings} previous={p.bookings} />
            <StatTile label="Consultas por bicis a pedido" value={fmt.int(t.inquiries)} current={t.inquiries} previous={p.inquiries} />
            <StatTile label="Pedidos cobrados" value={fmt.int(t.paidOrders)} current={t.paidOrders} previous={p.paidOrders} />
          </div>
        </section>
      </div>

      <p className="adm-hint adm-stats-foot">
        Estadísticas propias, sin cookies ni servicios externos: cada visitante se cuenta con un código anónimo que cambia todos los días.
        Se comparan con los {data.days} días anteriores. Los datos de más de 13 meses se borran solos.
      </p>
    </div>
  );
}
