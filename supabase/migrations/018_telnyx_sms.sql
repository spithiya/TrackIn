-- sms_log.twilio_sid predates the switch to Telnyx and was never actually
-- populated (no SMS-sending integration existed until now) — safe rename,
-- no data loss.
alter table sms_log rename column twilio_sid to telnyx_message_id;
