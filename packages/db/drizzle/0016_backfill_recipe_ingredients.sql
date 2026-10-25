-- Keeps every non-blank line of the old text ingredient list as a custom ingredient, in order.
INSERT INTO "recipe_ingredient" ("recipe_id", "position", "name")
SELECT
	"recipe"."id",
	(row_number() OVER (PARTITION BY "recipe"."id" ORDER BY "line"."ordinality") - 1)::integer,
	btrim("line"."name")
FROM "recipe"
CROSS JOIN LATERAL unnest("recipe"."ingredients") WITH ORDINALITY AS "line"("name", "ordinality")
WHERE btrim("line"."name") <> '';
