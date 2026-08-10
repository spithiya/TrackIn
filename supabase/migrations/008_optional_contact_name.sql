-- Parent/guardian name is no longer required at check-in registration —
-- only a phone number is. Bulk import in particular only collects phone.
alter table parent_contacts
  alter column full_name drop not null;
