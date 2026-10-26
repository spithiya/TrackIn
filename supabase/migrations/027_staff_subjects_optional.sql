-- Subjects are optional when registering staff: not every staff member
-- tutors (front desk, admin), and owners may not want to pin one down.
-- null = not specified. The existing check constraint still allows only
-- math / reading / both when a value is set.

alter table staff_members alter column subjects drop not null;
