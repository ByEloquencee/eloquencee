
UPDATE public.global_words
SET word = CONCAT(UPPER(LEFT(word, 1)), SUBSTRING(word FROM 2))
WHERE LEFT(word, 1) ~ '[a-ząćęłńóśźż]';

UPDATE public.global_words
SET definition = CONCAT(UPPER(LEFT(definition, 1)), SUBSTRING(definition FROM 2))
WHERE LEFT(definition, 1) ~ '[a-ząćęłńóśźż]';
