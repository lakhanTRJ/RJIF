# Unpaid duplicate cleanup

Apply migration 020 after a database backup before running this release.

Administrators can use **Delete unpaid duplicate** in Registrations and Business Awards. Select the paid entry to keep and confirm. Registrations must match the same product and a registered email or normalized phone; award applications must match the event year and a registered contact. Do not choose a replacement merely because names look similar. Paid replacements currently come from the loaded recent-entry list (200 registrations / 250 award applications).

The action archives the unpaid record, not a hard delete. Paid/refunded/payment-identified entries and entries with passes are rejected. For award applications every linked order is checked and only unpaid orders can be archived. The paid replacement is untouched. Administrator ID and replacement ID are audited in the same transaction. Subscriber yearly benefit reservations are deliberately retained: cleanup must not reset a redeemed/reserved discount allowance.

Razorpay-linked orders are checked using read-only order and payment lookups. Paid, partially paid, authorised, refunded, unknown and unavailable states block cleanup. No gateway order is cancelled, no refund is issued and no credentials are changed. A previously opened payment window is not remotely revoked; valid captured-payment processing restores the order/application to the active list. Reconcile any unexpected late payment rather than silently dropping it.

Archived entries are hidden from active admin lists and customer account lists. Their old payment/checkout links are rejected by the application. Historical Excel exports retain them with explicit archive-date columns so financial history is not silently removed. There is no mass cleanup and no permanent deletion. Export an audit copy before reconciling large batches.

The gateway API contract is documented in Razorpay's official [orders API examples](https://github.com/razorpay/razorpay-node/blob/master/documents/order.md). Tests mock provider calls; the local smoke check performs no real Razorpay requests, payments or email sends.
