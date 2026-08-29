import React from 'react';
import data from '@site/src/data/plans.json';
import styles from './styles.module.css';

/**
 * The plan ladder, rendered entirely from src/data/plans.json, which is
 * generated from the product's own plan catalog. Prices, site counts, module
 * counts and limits are never typed by hand into this file.
 */

type Plan = {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  maxSites: number;
  moduleCount: number;
  limits: Record<string, number>;
};

const plans = data.plans as Plan[];

const LIMIT_LABEL: Record<string, string> = {
  maxProducts: 'Products',
  maxOrders: 'Orders',
  maxCustomers: 'Customers',
  maxExportsPerMonth: 'Exports / month',
  maxImportsPerMonth: 'Imports / month',
};

function money(cents: number, currency: string): string {
  if (cents === 0) return 'Free';
  const amount = cents / 100;
  const formatted = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `${currency === 'USD' ? '$' : ''}${formatted}${currency === 'USD' ? '' : ` ${currency}`}/month`;
}

function limit(value: number): string {
  if (value === -1) return 'Unlimited';
  if (value === 0) return 'Not included';
  return value.toLocaleString('en-US');
}

function sites(value: number): string {
  if (value === -1) return 'Unlimited sites';
  return value === 1 ? '1 site' : `${value} sites`;
}

export default function PlanTable(): React.JSX.Element {
  const limitKeys = Object.keys(plans[0].limits);

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Plan</th>
            {plans.map((p) => (
              <th key={p.id} scope="col">
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Price</th>
            {plans.map((p) => (
              <td key={p.id}>
                <strong>{money(p.priceCents, p.currency)}</strong>
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">Modules included</th>
            {plans.map((p) => (
              <td key={p.id}>{p.moduleCount}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">Sites</th>
            {plans.map((p) => (
              <td key={p.id}>{sites(p.maxSites)}</td>
            ))}
          </tr>
          {limitKeys.map((k) => (
            <tr key={k}>
              <th scope="row">{LIMIT_LABEL[k] ?? k}</th>
              {plans.map((p) => (
                <td key={p.id}>{limit(p.limits[k])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
