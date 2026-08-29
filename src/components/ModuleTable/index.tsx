import React, { useMemo, useState } from 'react';
import data from '@site/src/data/modules.json';
import styles from './styles.module.css';

/**
 * The module reference, rendered entirely from src/data/modules.json.
 *
 * Nothing here is hand-written per module: the table cannot disagree with the
 * data file, and the data file is generated from the plugin's own module
 * manifest and plan catalog. Editing this component cannot change what the
 * catalogue says a module is or which plan it belongs to.
 */

type Module = {
  key: string;
  entitlement: string;
  title: string;
  tier: 'free' | 'premium';
  plan: string;
  category: string;
  adminTab: string | null;
  available: boolean;
};

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  business: 'Business',
  enterprise: 'Enterprise',
};

const PLAN_ORDER = ['free', 'starter', 'professional', 'business', 'enterprise'];

const modules = data.modules as Module[];
const categories = data.categories as Record<string, string>;

export function ModuleCount(): string {
  return String(modules.length);
}

export function AvailableCount(): string {
  return String(modules.filter((m) => m.available).length);
}

export default function ModuleTable(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [plan, setPlan] = useState('all');
  const [category, setCategory] = useState('all');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return modules.filter((m) => {
      if (plan !== 'all' && PLAN_ORDER.indexOf(m.plan) > PLAN_ORDER.indexOf(plan)) return false;
      if (category !== 'all' && m.category !== category) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        m.key.toLowerCase().includes(q) ||
        categories[m.category].toLowerCase().includes(q)
      );
    });
  }, [query, plan, category]);

  const grouped = useMemo(() => {
    const out = new Map<string, Module[]>();
    for (const m of rows) {
      const list = out.get(m.category) ?? [];
      list.push(m);
      out.set(m.category, list);
    }
    return [...out.entries()].sort((a, b) => categories[a[0]].localeCompare(categories[b[0]]));
  }, [rows]);

  return (
    <div>
      <div className={styles.controls}>
        <input
          type="search"
          className={styles.search}
          placeholder="Search modules…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search modules by name"
        />
        <label className={styles.field}>
          <span className={styles.label}>Included in</span>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Filter by plan">
            <option value="all">Any plan</option>
            {PLAN_ORDER.map((p) => (
              <option key={p} value={p}>
                {PLAN_LABEL[p]} and below
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {Object.entries(categories).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className={styles.count}>
        Showing <strong>{rows.length}</strong> of {modules.length} modules.
      </p>

      {grouped.length === 0 && <p>No modules match that search.</p>}

      {grouped.map(([catId, list]) => (
        <section key={catId}>
          <h3 id={catId}>{categories[catId]}</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Module</th>
                <th>Lowest plan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.key}>
                  <td>
                    <strong>{m.title}</strong>
                    <br />
                    <code className={styles.key}>{m.key}</code>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${m.tier === 'free' ? styles.free : styles.paid}`}
                    >
                      {PLAN_LABEL[m.plan]}
                    </span>
                  </td>
                  <td>
                    {m.available ? (
                      'Available'
                    ) : (
                      <span className={styles.pending}>Not in 1.0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
