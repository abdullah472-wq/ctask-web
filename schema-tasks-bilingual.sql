-- Add new Bengali columns
ALTER TABLE tasks ADD COLUMN title_bn TEXT;
ALTER TABLE tasks ADD COLUMN description_bn TEXT;
ALTER TABLE tasks ADD COLUMN proof_instruction_bn TEXT;
