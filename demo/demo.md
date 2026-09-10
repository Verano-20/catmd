# Payment service

Deposits move from the customer's bank into the client money wallet,
then settle into the investment account.

```mermaid
sequenceDiagram
  participant App
  participant API
  participant Bank
  App->>API: POST /deposit
  API->>Bank: create payment
  Bank-->>API: payment.settled
  API-->>App: deposit confirmed
```

Reconciliation runs nightly:

```mermaid
flowchart LR
  A[fetch statements] --> B[match ledger]
  B --> C{breaks?}
  C -- no --> D[close batch]
  C -- yes --> E[alert ops]
```

Plain code blocks pass straight through:

```sql
select count(*) from deposits where settled_at is null;
```
