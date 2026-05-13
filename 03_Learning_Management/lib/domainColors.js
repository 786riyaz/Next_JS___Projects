// lib/domainColors.js  — single source of truth for domain colors
// Used by both Videos and Priorities pages

export const DOMAIN_COLORS = [
  { bg: "bg-indigo-100 dark:bg-indigo-900/50",  text: "text-indigo-700 dark:text-indigo-300",  dot: "bg-indigo-500"  },
  { bg: "bg-emerald-100 dark:bg-emerald-900/50", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  { bg: "bg-orange-100 dark:bg-orange-900/50",   text: "text-orange-700 dark:text-orange-300",   dot: "bg-orange-500"  },
  { bg: "bg-pink-100 dark:bg-pink-900/50",       text: "text-pink-700 dark:text-pink-300",       dot: "bg-pink-500"    },
  { bg: "bg-violet-100 dark:bg-violet-900/50",   text: "text-violet-700 dark:text-violet-300",   dot: "bg-violet-500"  },
  { bg: "bg-cyan-100 dark:bg-cyan-900/50",       text: "text-cyan-700 dark:text-cyan-300",       dot: "bg-cyan-500"    },
  { bg: "bg-amber-100 dark:bg-amber-900/50",     text: "text-amber-700 dark:text-amber-300",     dot: "bg-amber-500"   },
  { bg: "bg-teal-100 dark:bg-teal-900/50",       text: "text-teal-700 dark:text-teal-300",       dot: "bg-teal-500"    },
  { bg: "bg-rose-100 dark:bg-rose-900/50",       text: "text-rose-700 dark:text-rose-300",       dot: "bg-rose-500"    },
  { bg: "bg-sky-100 dark:bg-sky-900/50",         text: "text-sky-700 dark:text-sky-300",         dot: "bg-sky-500"     },
  { bg: "bg-lime-100 dark:bg-lime-900/50",       text: "text-lime-700 dark:text-lime-300",       dot: "bg-lime-500"    },
  { bg: "bg-fuchsia-100 dark:bg-fuchsia-900/50", text: "text-fuchsia-700 dark:text-fuchsia-300", dot: "bg-fuchsia-500" },
];

/**
 * Build a stable domain → color map from a sorted list of domain names.
 * Pass the DOMAIN_ORDER-sorted array so colors are consistent across pages.
 */
export function buildDomainColorMap(sortedDomains) {
  const map = {};
  sortedDomains.forEach((d, i) => {
    map[d] = DOMAIN_COLORS[i % DOMAIN_COLORS.length];
  });
  return map;
}