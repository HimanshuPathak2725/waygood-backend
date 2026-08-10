const applicationStatuses = [
  "draft",
  "submitted",
  "under-review",
  "offer-received",
  "visa-processing",
  "enrolled",
  "rejected",
];

const validStatusTransitions = {
  draft: ["submitted"],
  submitted: ["under-review", "rejected"],
  "under-review": ["offer-received", "rejected"],
  "offer-received": ["visa-processing", "rejected"],
  "visa-processing": ["enrolled", "rejected"],
  enrolled: [],
  rejected: [],
};

module.exports = {
  applicationStatuses,
  validStatusTransitions,
};
