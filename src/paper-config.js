// Optional visual excerpts. Keep these empty until every item has been checked
// against the final public paper and the referenced asset exists in public/assets.
export const PAPER_CONTENT = {
  sourcePath: "/paper/paper.md",
  evidencePolicy: [
    "Use only the supplied public paper passages and author-reviewed visual metadata.",
    "Distinguish the paper's reported findings from interpretation.",
    "Mention the relevant section, figure, table, or appendix item when available.",
    "Do not claim access to restricted-use data, author computers, credentials, unpublished results, or an executable replication system.",
    "If the supplied sources do not support an answer, say so plainly rather than guessing."
  ].join(" "),
  figures: [
    // Example:
    // {
    //   match: /figure\s*1|main result|principal finding/i,
    //   src: "/assets/figure-1.png",
    //   alt: "Accessible description of Figure 1.",
    //   caption: "Figure 1. Author-reviewed short caption."
    // }
  ],
  tables: [
    // Example:
    // {
    //   match: /table\s*2|heterogeneity/i,
    //   title: "Selected columns from Table 2",
    //   subtitle: "State the outcome, units, and specification",
    //   headers: ["Group", "Estimate", "p-value"],
    //   rows: [["Example group", "0.00", "0.00"]],
    //   note: "Author-reviewed excerpt; identify omitted rows or columns."
    // }
  ]
};

