-- Privlo encrypted claim inbox (no plaintext amounts)
create table if not exists claims (
  id text primary key,
  recipient text not null,
  creator text not null,
  campaign_name text not null,
  token_address text not null,
  token_symbol text,
  airdrop_address text not null,
  encrypted_handle text not null,
  input_proof text not null,
  signature text not null,
  created_at bigint not null,
  claimed_at bigint,
  claim_transaction_hash text
);

create index if not exists claims_recipient_idx on claims (recipient);
create index if not exists claims_creator_idx on claims (creator);
create index if not exists claims_recipient_pending_idx on claims (recipient) where claimed_at is null;